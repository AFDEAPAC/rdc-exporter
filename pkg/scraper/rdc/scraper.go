package rdc

import (
	"log/slog"
	"reflect"

	"github.com/ROCm/rdc-exporter/internal/bindings/rdc"
)

type RdcScraper struct {
	handler        *rdc.Handler
	fieldGroupID   uint32
	fieldGroupName string
	fieldIDs       []rdc.FieldID
	gpuGroupID     uint32
	gpuGroupName   string
	gpuIndexs      []uint32

	maxiumKeepAge     float32
	maxiumKeepSamples int32
	updateFrequencey  int64
}

func NewRdcScraper(gpuGroupName string, fieldGroupName string) (*RdcScraper, error) {
	slog.Info("Initializing RDC scraper", "gpuGroupName", gpuGroupName)

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
	gpuIndexs, err := handler.GetAllGpuIndexes()
	if err != nil {
		slog.Error("Failed to get GPU indexs", "err", err)
		return nil, err
	}
	slog.Debug("Found GPU indexes", "count", len(gpuIndexs), "indexes", gpuIndexs)

	scraper := &RdcScraper{
		handler:           handler,
		fieldGroupName:    fieldGroupName,
		fieldIDs:          []rdc.FieldID{rdc.RDC_FI_GPU_CLOCK, rdc.RDC_FI_GPU_TEMP, rdc.RDC_FI_PROF_SM_ACTIVE},
		gpuGroupName:      gpuGroupName,
		gpuIndexs:         gpuIndexs,
		maxiumKeepAge:     3600.0,
		maxiumKeepSamples: 1000,
		updateFrequencey:  10000000,
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

		if group.Name() == r.fieldGroupName {
			fieldIDs := group.ValidFieldIDs()
			if reflect.DeepEqual(fieldIDs, r.fieldIDs) {
				slog.Debug("Field group already exists", "name", r.fieldGroupName, "fieldIDs", fieldIDs)
				r.fieldGroupID = group.GroupID
				return nil
			}
			slog.Warn("Field group already exists with different field IDs", "name", r.fieldGroupName, "existingFieldIDs", fieldIDs, "newFieldIDs", r.fieldIDs)
			if err := r.handler.DestroyFieldGroup(group.GroupID); err != nil {
				slog.Error("Failed to destroy existing field group", "name", r.fieldGroupName, "err", err)
				return err
			}
			slog.Debug("Destroyed existing field group", "name", r.fieldGroupName)
			break
		}
	}

	slog.Debug("Creating field group", "name", r.fieldGroupName)
	groupID, err := r.handler.CreateFieldGroup(r.fieldIDs, r.fieldGroupName)
	if err != nil {
		slog.Error("Failed to create field group", "name", r.fieldGroupName, "err", err)
		return err
	}

	r.fieldGroupID = groupID
	slog.Debug("Field group created successfully", "groupID", groupID, "name", r.fieldGroupName)
	return nil
}

func (r *RdcScraper) CreateGpuGroup() error {

	if r.gpuGroupName == "" {
		slog.Error("GPU group name is empty")
		return nil
	}

	groups, err := r.GetAllGpuGroups()
	if err != nil {
		slog.Error("Failed to get all GPU groups", "err", err)
		return err
	}

	for _, group := range groups {
		if group.Name() == r.gpuGroupName {
			entityIDs := group.ValidEntityIDs()
			if reflect.DeepEqual(entityIDs, r.gpuIndexs) {
				slog.Debug("GPU group already exists", "name", r.gpuGroupName, "entityIDs", entityIDs)
				r.gpuGroupID = group.GroupID
				return nil
			}
			slog.Warn("GPU group already exists with different entity IDs", "name", r.gpuGroupName, "existingEntityIDs", entityIDs, "newEntityIDs", r.gpuIndexs)
			err = r.handler.DestroyGpuGroup(group.GroupID)
			if err != nil {
				slog.Error("Failed to destroy existing GPU group", "name", r.gpuGroupName, "err", err)
				return err
			}
			slog.Debug("Destroyed existing GPU group", "name", r.gpuGroupName)
			break
		}
	}

	slog.Debug("Creating GPU group", "name", r.gpuGroupName)
	groupID, err := r.handler.CreateGpuGroup(r.gpuGroupName)
	if err != nil {
		slog.Error("Failed to create GPU group", "name", r.gpuGroupName, "err", err)
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
	slog.Debug("GPU group created successfully", "groupID", groupID, "name", r.gpuGroupName)
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

func (r *RdcScraper) WatchFields() error {

	slog.Debug("Unwatching fields", "fieldGroupID", r.fieldGroupID, "fieldIDs", r.fieldIDs)
	err := r.handler.UnwatchFields(r.gpuGroupID, r.fieldGroupID)
	if err != nil {
		slog.Error("Failed to unwatch fields", "err", err)
		return err
	}

	slog.Debug("Starting to watch fields", "fieldGroupID", r.fieldGroupID, "fieldIDs", r.fieldIDs)
	err = r.handler.WatchFields(r.gpuGroupID, r.fieldGroupID, r.maxiumKeepAge, r.maxiumKeepSamples, r.updateFrequencey)
	if err != nil {
		slog.Error("Failed to watch fields", "err", err)
		return err
	}

	slog.Debug("Fields are being watched successfully")
	return nil
}
