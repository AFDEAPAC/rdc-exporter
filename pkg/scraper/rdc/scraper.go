package rdc

import (
	"errors"
	"log/slog"
	"reflect"
	"strconv"
	"strings"
	"sync"

	"github.com/ROCm/rdc-exporter/internal/bindings/rdc"
	"github.com/ROCm/rdc-exporter/pkg/catalog"
	"github.com/ROCm/rdc-exporter/pkg/labeler"
	"github.com/prometheus/client_golang/prometheus"
)

type RdcScraper struct {
	handler   *rdc.Handler
	config    *RdcScraperConfig
	entities  []*catalog.Entity
	gaugeVecs map[rdc.FieldID]*prometheus.GaugeVec
	labels    map[rdc.FieldID]map[uint32][]string

	// Data from RDC
	fieldGroupID uint32
	fieldIDs     []rdc.FieldID
	gpuGroupID   uint32
	gpuIndexs    []uint32
}

func NewRdcScraper(config *RdcScraperConfig, gpuIndexes []int, entities []*catalog.Entity) (*RdcScraper, error) {
	slog.Info("Initializing RDC scraper", "gpuGroupName", config.GpuGroupName)

	slog.Debug("Initializing RDC")
	if err := rdc.Init(0); err != nil {
		slog.Error("Failed to initialize RDC", "err", err)
		return nil, err
	}
	slog.Debug("RDC initialized successfully")

	// Start the embedded RDC
	slog.Debug("Starting embedded RDC handler")
	handler, err := rdc.NewEmbeddedHandler()
	if err != nil {
		slog.Error("Failed to start embedded RDC handler", "err", err)
		return nil, err
	}
	slog.Debug("Embedded RDC handler started successfully")

	// Get all GPU indexs
	slog.Debug("Retrieving all GPU indexes")
	hostGpuIndexs, err := handler.GetAllGpuIndexes()
	if err != nil {
		slog.Error("Failed to get GPU indexs", "err", err)
		return nil, err
	}
	slog.Debug("Found GPU indexes form RDC", "count", len(hostGpuIndexs), "indexes", hostGpuIndexs)

	// Filter GPU indexes if provided
	if gpuIndexes != nil && len(gpuIndexes) > 0 {
		providedGpuIndexes := map[uint32]bool{}
		for _, idx := range gpuIndexes {
			if idx < 0 || idx >= len(hostGpuIndexs) {
				slog.Warn("Invalid GPU index provided, skipping", "index", idx)
				continue
			}
			providedGpuIndexes[uint32(idx)] = true
		}

		slog.Debug("Filtering GPU indexes based on provided list", "gpuIndexes", gpuIndexes)
		filteredGpuIndexs := make([]uint32, 0, len(gpuIndexes))
		for _, idx := range hostGpuIndexs {
			if providedGpuIndexes[uint32(idx)] {
				slog.Debug("Keeping GPU index", "index", idx)
				filteredGpuIndexs = append(filteredGpuIndexs, idx)
			}
		}
		if len(filteredGpuIndexs) == 0 {
			slog.Error("No valid GPU indexes provided, cannot proceed")
			return nil, errors.New("no valid GPU indexes provided")
		}
		hostGpuIndexs = filteredGpuIndexs
	}

	scraper := &RdcScraper{
		handler:   handler,
		config:    config,
		fieldIDs:  make([]rdc.FieldID, len(entities)),
		entities:  entities,
		gaugeVecs: make(map[rdc.FieldID]*prometheus.GaugeVec),
		gpuIndexs: hostGpuIndexs,
	}

	for i, entity := range entities {
		fieldId, err := strconv.Atoi(entity.Field)
		if err != nil || fieldId < 0 {
			slog.Error("Invalid field ID", "field", entity.Field, "err", err)
			return nil, errors.New("invalid field ID: " + entity.Field)
		}
		scraper.fieldIDs[i] = rdc.NewFieldIDFromInt(fieldId)
	}

	// Get or create the GPU group
	if err := scraper.CreateGpuGroup(); err != nil {
		slog.Error("Failed to create GPU group", "err", err)
		return nil, err
	}

	// Get or create the field group
	if err := scraper.CreateFieldGroup(); err != nil {
		slog.Error("Failed to create field group", "err", err)
		return nil, err
	}

	// Start watching fields
	if err := scraper.WatchFields(); err != nil {
		slog.Error("Failed to watch fields", "err", err)
		return nil, err
	}

	slog.Info("RDC scraper initialized successfully")
	return scraper, nil
}

func (r *RdcScraper) Close() error {

	slog.Debug("Stopping RDC handler")
	if err := r.handler.Stop(); err != nil {
		slog.Error("Failed to stop RDC handler", "err", err)
		return err
	}
	slog.Debug("RDC handler stopped successfully")

	slog.Info("Closing RDC scraper")
	return nil
}

func (r *RdcScraper) CreateFieldGroup() error {

	allGroupIDs, err := r.handler.GetAllFieldGroupIDs()
	if err != nil {
		slog.Error("Failed to get all field group IDs", "err", err)
		return err
	}

	for _, groupID := range allGroupIDs {
		slog.Debug("Retrieving field group info", "groupID", groupID)
		group, err := r.handler.GetFieldGroupInfo(groupID)
		if err != nil {
			slog.Error("Failed to get field group info", "groupID", groupID, "err", err)
			continue
		}

		if group.Name() == r.config.FieldGroupName {
			fieldIDs := group.ValidFieldIDs()
			if reflect.DeepEqual(fieldIDs, r.fieldIDs) {
				slog.Debug("Field group already exists", "name", r.config.FieldGroupName, "fieldIDs", fieldIDs)
				r.fieldGroupID = group.GroupID
				return nil
			}
			slog.Warn("Field group already exists with different field IDs", "name", r.config.FieldGroupName, "existingFieldIDs", fieldIDs, "newFieldIDs", r.fieldIDs)
			if err := r.handler.DestroyFieldGroup(group.GroupID); err != nil {
				slog.Error("Failed to destroy existing field group", "name", r.config.FieldGroupName, "err", err)
				return err
			}
			slog.Debug("Destroyed existing field group", "name", r.config.FieldGroupName)
			break
		}
	}

	slog.Debug("Creating field group", "name", r.config.FieldGroupName)
	groupID, err := r.handler.CreateFieldGroup(r.fieldIDs, r.config.FieldGroupName)
	if err != nil {
		slog.Error("Failed to create field group", "name", r.config.FieldGroupName, "err", err)
		return err
	}

	r.fieldGroupID = groupID
	slog.Debug("Field group created successfully", "groupID", groupID, "name", r.config.FieldGroupName)
	return nil
}

func (r *RdcScraper) CreateGpuGroup() error {

	if r.config.GpuGroupName == "" {
		slog.Error("GPU group name is empty")
		return nil
	}

	groups, err := r.GetAllGpuGroups()
	if err != nil {
		slog.Error("Failed to get all GPU groups", "err", err)
		return err
	}

	for _, group := range groups {
		if group.Name() == r.config.GpuGroupName {
			entityIDs := group.ValidEntityIDs()
			if reflect.DeepEqual(entityIDs, r.gpuIndexs) {
				slog.Debug("GPU group already exists", "name", r.config.GpuGroupName, "entityIDs", entityIDs)
				r.gpuGroupID = group.GroupID
				return nil
			}
			slog.Warn("GPU group already exists with different entity IDs", "name", r.config.GpuGroupName, "existingEntityIDs", entityIDs, "newEntityIDs", r.gpuIndexs)
			err = r.handler.DestroyGpuGroup(group.GroupID)
			if err != nil {
				slog.Error("Failed to destroy existing GPU group", "name", r.config.GpuGroupName, "err", err)
				return err
			}
			slog.Debug("Destroyed existing GPU group", "name", r.config.GpuGroupName)
			break
		}
	}

	slog.Debug("Creating GPU group", "name", r.config.GpuGroupName)
	groupID, err := r.handler.CreateGpuGroup(r.config.GpuGroupName)
	if err != nil {
		slog.Error("Failed to create GPU group", "name", r.config.GpuGroupName, "err", err)
		return err
	}

	for _, gpuIndex := range r.gpuIndexs {
		if err := r.handler.AddGpuToGroup(groupID, gpuIndex); err != nil {
			slog.Error("Failed to add GPU to group", "groupID", groupID, "gpuIndex", gpuIndex, "err", err)
			return err
		}
		slog.Debug("Added GPU to group", "groupID", groupID, "gpuIndex", gpuIndex)
	}

	r.gpuGroupID = groupID
	slog.Debug("GPU group created successfully", "groupID", groupID, "name", r.config.GpuGroupName)
	return nil
}

func (r *RdcScraper) GetAllGpuGroups() ([]*rdc.GpuGroupInfo, error) {
	slog.Debug("Retrieving all GPU groups")
	allGroupsIDs, err := r.handler.GetAllGpuGroupIDs()
	if err != nil {
		slog.Error("Failed to get all group IDs", "err", err)
		return nil, err
	}

	groups := make([]*rdc.GpuGroupInfo, 0, len(allGroupsIDs))
	for _, groupID := range allGroupsIDs {
		slog.Debug("Retrieving group info", "groupID", groupID)
		group, err := r.handler.GetGpuGroupInfo(groupID)
		if err != nil {
			slog.Error("Failed to get group info", "groupID", groupID, "err", err)
			continue
		}
		groups = append(groups, group)
		slog.Debug("Retrieved group info", "groupID", groupID, "name", group.Name(), "entityIDs", group.ValidEntityIDs())
	}

	slog.Debug("Retrieved all groups", "count", len(groups))
	return groups, nil
}

func (r *RdcScraper) RegisterGaugeVecs(reg *prometheus.Registry, dynamicLabels []string) error {
	slog.Debug("Creating GaugeVecs for field IDs", "fieldIDs", r.fieldIDs)

	r.labels = make(map[rdc.FieldID]map[uint32][]string)

	labels := []string{"gpu_index"}
	if dynamicLabels != nil && len(dynamicLabels) > 0 {
		labels = append(labels, dynamicLabels...)
	}

	for i, fieldID := range r.fieldIDs {
		if _, exists := r.gaugeVecs[fieldID]; exists {
			slog.Debug("GaugeVec already exists", "fieldID", fieldID)
			continue
		}

		entity := r.entities[i]
		opt := prometheus.GaugeOpts{
			Name: entity.PromName,
			Help: entity.Desc,
		}

		if opt.Name == "" {
			name := fieldID.Name()
			opt.Name = strings.ToLower(name)
		}

		if opt.Help == "" {
			opt.Help = "RDC field value for " + opt.Name
		}

		gv := prometheus.NewGaugeVec(opt, labels)
		reg.MustRegister(gv)
		r.gaugeVecs[fieldID] = gv
		slog.Debug("Created GaugeVec", "fieldID", fieldID, "name", opt.Name)

		r.labels[fieldID] = make(map[uint32][]string)
		for _, gpuIndex := range r.gpuIndexs {
			r.labels[fieldID][gpuIndex] = labels
		}
	}

	slog.Debug("All GaugeVecs created successfully", "count", len(r.gaugeVecs))
	return nil
}

func (r *RdcScraper) Scrape(lb labeler.Labeler) error {

	type cachedValue struct {
		gpuIndex uint32
		fieldID  rdc.FieldID
		value    float64
	}
	values := make(chan cachedValue, len(r.gpuIndexs)*len(r.fieldIDs))

	// fetch the latest field values
	wg := sync.WaitGroup{}
	slog.Debug("Scraping field values")
	for i := range r.gpuIndexs {
		wg.Add(1)
		go func(gpuIndex uint32) {
			defer wg.Done()
			for j, fieldID := range r.fieldIDs {
				slog.Debug("Fetching latest field value", "gpuIndex", gpuIndex, "fieldID", fieldID)
				fv, err := r.handler.GetLatestFieldValue(gpuIndex, fieldID)
				if err != nil {
					slog.Error("Failed to get latest field value", "gpuIndex", gpuIndex, "fieldID", fieldID, "err", err)
					continue
				}

				value, _ := fv.FloatValue()
				if scale := r.entities[j].Scale; scale > 0 {
					value *= scale
				}

				slog.Debug("Fetched latest field value", "gpuIndex", gpuIndex, "fieldID", fieldID, "value", value)
				values <- cachedValue{
					fieldID:  fieldID,
					gpuIndex: gpuIndex,
					value:    value,
				}
			}
		}(r.gpuIndexs[i])
	}
	wg.Wait()
	close(values)

	// Merge all values into a map
	results := make(map[rdc.FieldID]map[uint32]float64)
	for val := range values {
		if _, exists := results[val.fieldID]; !exists {
			results[val.fieldID] = make(map[uint32]float64)
		}
		results[val.fieldID][val.gpuIndex] = val.value
	}

	if len(results) == 0 {
		// If no field values were updated, probably need to reconnect to RDC
		slog.Warn("No field values were updated during scrape")
		return errors.New("no field values updated")
	}

	// Update the GaugeVecs with the new values
	slog.Debug("Updating GaugeVecs with new values")
	for fieldID, gpuValues := range results {
		gaugeVec, exists := r.gaugeVecs[fieldID]
		if !exists {
			slog.Warn("GaugeVec does not exist for field ID", "fieldID", fieldID)
			continue
		}

		for gpuIndex, value := range gpuValues {
			slog.Debug("Setting GaugeVec value", "fieldID", fieldID, "gpuIndex", gpuIndex, "value", value)

			labels := make([]string, 1)
			labels[0] = strconv.FormatUint(uint64(gpuIndex), 10) // First label always is gpu_index

			// Add dynamic labels if available
			if lb != nil {
				dynamicLabels := lb.GetLabelsByGpu(int(gpuIndex))
				labels = append(labels, dynamicLabels...)

				oldlabels, _ := r.labels[fieldID][gpuIndex]
				if !reflect.DeepEqual(oldlabels, labels) {
					gaugeVec.DeleteLabelValues(oldlabels...)
				}
			}

			gaugeVec.WithLabelValues(labels...).Set(value)
			r.labels[fieldID][gpuIndex] = labels
		}
	}

	slog.Debug("Scrape completed successfully")
	return nil
}

func (r *RdcScraper) WatchFields() error {

	slog.Debug("Unwatching fields", "fieldGroupID", r.fieldGroupID, "fieldIDs", r.fieldIDs)
	err := r.handler.UnwatchFields(r.gpuGroupID, r.fieldGroupID)
	if err != nil {
		slog.Error("Failed to unwatch fields", "err", err)
		return err
	}

	slog.Debug("Starting to watch fields", "fieldGroupID", r.fieldGroupID, "fieldIDs", r.fieldIDs)
	err = r.handler.WatchFields(r.gpuGroupID, r.fieldGroupID, r.config.MaxiumKeepAge, r.config.MaxiumKeepSamples, r.config.UpdateFrequencey)
	if err != nil {
		slog.Error("Failed to watch fields", "err", err)
		return err
	}

	slog.Debug("Fields are being watched successfully")
	return nil
}
