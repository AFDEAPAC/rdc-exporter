package rdcsource

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"reflect"
	"sync"

	"github.com/ROCm/rdc-exporter/internal/bindings/rdc"
	"github.com/ROCm/rdc-exporter/internal/domain/metric"
)

// Reader collects the latest values of a fixed set of RDC fields for a fixed set
// of GPUs and exposes them as domain samples.
//
// Reader owns an embedded RDC session: it initializes the library, creates (or
// reuses) the GPU and field groups, and starts the field watch when constructed.
// The caller owns its lifecycle and must call Close to release the RDC handler.
// A Reader is intended to be driven by a single collection loop; ReadSamples
// fans out concurrent reads internally but is not meant to be called from
// multiple goroutines at once.
type Reader struct {
	// handler is the embedded RDC session; nil after Close.
	handler *rdc.Handler
	// config holds the group names and watch parameters.
	config *Config
	// fieldIDs are the RDC fields watched and read, in registration order.
	fieldIDs []rdc.FieldID

	// fieldGroupID and gpuGroupID identify the RDC-side groups this reader uses.
	fieldGroupID uint32
	gpuGroupID   uint32
	// gpuIndexes are the GPUs to read, after optional filtering.
	gpuIndexes []uint32
}

// New initializes an RDC session and returns a Reader ready to collect samples.
//
// gpuFilter optionally restricts collection to the given host GPU indexes; a nil
// or empty filter collects every GPU RDC reports. Out-of-range indexes are
// warned and skipped, and a filter that selects no valid GPU is an error.
// fieldIDs are the domain fields to watch, converted to RDC field identifiers
// here so callers never handle cgo types. On any setup failure the partially
// initialized RDC handle is abandoned; callers should treat a non-nil error as
// "reader unavailable" and not call Close.
func New(config *Config, gpuFilter []int, fieldIDs []metric.FieldID) (*Reader, error) {
	slog.Info("Initializing RDC field reader", "gpuGroupName", config.GPUGroupName)

	if err := rdc.Init(0); err != nil {
		return nil, fmt.Errorf("initialize RDC: %w", err)
	}

	handler, err := rdc.NewEmbeddedHandler()
	if err != nil {
		return nil, fmt.Errorf("start embedded RDC handler: %w", err)
	}

	hostGPUs, err := handler.GetAllGpuIndexes()
	if err != nil {
		return nil, fmt.Errorf("get GPU indexes: %w", err)
	}
	slog.Debug("Discovered GPUs from RDC", "count", len(hostGPUs), "indexes", hostGPUs)

	gpuIndexes, err := filterGPUIndexes(hostGPUs, gpuFilter)
	if err != nil {
		return nil, err
	}

	rdcFieldIDs := make([]rdc.FieldID, len(fieldIDs))
	for i, id := range fieldIDs {
		rdcFieldIDs[i] = rdc.NewFieldIDFromInt(int(id))
	}

	reader := &Reader{
		handler:    handler,
		config:     config,
		fieldIDs:   rdcFieldIDs,
		gpuIndexes: gpuIndexes,
	}

	if err := reader.createGPUGroup(); err != nil {
		return nil, err
	}
	if err := reader.createFieldGroup(); err != nil {
		return nil, err
	}
	if err := reader.watchFields(); err != nil {
		return nil, err
	}

	slog.Info("RDC field reader initialized successfully")
	return reader, nil
}

// Close stops the embedded RDC session and releases its handle. It must be
// called exactly once for a Reader that New returned successfully.
func (r *Reader) Close() error {
	if err := r.handler.Stop(); err != nil {
		return fmt.Errorf("stop RDC handler: %w", err)
	}
	slog.Info("RDC field reader closed")
	return nil
}

// ReadSamples returns the latest cached value of every watched field for every
// selected GPU.
//
// Reads are fanned out one goroutine per GPU; each goroutine reads all fields
// sequentially and publishes successful readings to a buffered channel sized for
// the full GPU-by-field matrix, so the workers never block and all goroutines
// are joined before the channel is drained. A failed individual read is logged
// and skipped rather than failing the whole collection. The returned samples
// carry raw, unscaled values; scaling and labelling happen in the use case. An
// empty result is returned without error so the caller can decide how to treat a
// stale RDC link. ReadSamples returns early if ctx is already cancelled.
func (r *Reader) ReadSamples(ctx context.Context) ([]metric.Sample, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	type reading struct {
		gpuIndex uint32
		fieldID  rdc.FieldID
		value    float64
	}
	values := make(chan reading, len(r.gpuIndexes)*len(r.fieldIDs))

	var wg sync.WaitGroup
	for _, gpuIndex := range r.gpuIndexes {
		wg.Add(1)
		go func(gpuIndex uint32) {
			defer wg.Done()
			for _, fieldID := range r.fieldIDs {
				if ctx.Err() != nil {
					return
				}
				fv, err := r.handler.GetLatestFieldValue(gpuIndex, fieldID)
				if err != nil {
					slog.Error("Failed to get latest field value", "gpuIndex", gpuIndex, "fieldID", fieldID, "err", err)
					continue
				}
				value, _ := fv.FloatValue()
				values <- reading{gpuIndex: gpuIndex, fieldID: fieldID, value: value}
			}
		}(gpuIndex)
	}
	wg.Wait()
	close(values)

	samples := make([]metric.Sample, 0, len(r.gpuIndexes)*len(r.fieldIDs))
	for v := range values {
		samples = append(samples, metric.Sample{
			GPUIndex: metric.GPUIndex(v.gpuIndex),
			FieldID:  metric.FieldID(v.fieldID),
			Value:    v.value,
		})
	}
	return samples, nil
}

// filterGPUIndexes narrows the host GPU list to the requested filter, preserving
// host order. An empty filter keeps every host GPU. Indexes outside the host
// range are skipped with a warning; a filter that matches nothing is an error so
// the exporter does not start collecting from zero GPUs.
func filterGPUIndexes(hostGPUs []uint32, gpuFilter []int) ([]uint32, error) {
	if len(gpuFilter) == 0 {
		return hostGPUs, nil
	}

	wanted := make(map[uint32]bool, len(gpuFilter))
	for _, idx := range gpuFilter {
		if idx < 0 || idx >= len(hostGPUs) {
			slog.Warn("Invalid GPU index provided, skipping", "index", idx)
			continue
		}
		wanted[uint32(idx)] = true
	}

	filtered := make([]uint32, 0, len(gpuFilter))
	for _, idx := range hostGPUs {
		if wanted[idx] {
			filtered = append(filtered, idx)
		}
	}
	if len(filtered) == 0 {
		return nil, errors.New("no valid GPU indexes provided")
	}
	return filtered, nil
}

// createGPUGroup reuses an existing RDC GPU group with the configured name when
// it already contains exactly the wanted GPUs, otherwise it recreates the group.
// An empty group name is treated as "nothing to do" to mirror the historical
// guard, though the default config always supplies a name.
func (r *Reader) createGPUGroup() error {
	if r.config.GPUGroupName == "" {
		slog.Error("GPU group name is empty")
		return nil
	}

	groups, err := r.allGPUGroups()
	if err != nil {
		return err
	}

	for _, group := range groups {
		if group.Name() != r.config.GPUGroupName {
			continue
		}
		if reflect.DeepEqual(group.ValidEntityIDs(), r.gpuIndexes) {
			slog.Debug("Reusing existing GPU group", "name", r.config.GPUGroupName)
			r.gpuGroupID = group.GroupID
			return nil
		}
		slog.Warn("GPU group exists with different members, recreating", "name", r.config.GPUGroupName)
		if err := r.handler.DestroyGpuGroup(group.GroupID); err != nil {
			return fmt.Errorf("destroy stale GPU group %q: %w", r.config.GPUGroupName, err)
		}
		break
	}

	groupID, err := r.handler.CreateGpuGroup(r.config.GPUGroupName)
	if err != nil {
		return fmt.Errorf("create GPU group %q: %w", r.config.GPUGroupName, err)
	}
	for _, gpuIndex := range r.gpuIndexes {
		if err := r.handler.AddGpuToGroup(groupID, gpuIndex); err != nil {
			return fmt.Errorf("add GPU %d to group: %w", gpuIndex, err)
		}
	}

	r.gpuGroupID = groupID
	slog.Debug("Created GPU group", "groupID", groupID, "name", r.config.GPUGroupName)
	return nil
}

// createFieldGroup reuses an existing RDC field group with the configured name
// when it already watches exactly the wanted fields, otherwise it recreates the
// group so the watch matches the current configuration.
func (r *Reader) createFieldGroup() error {
	allGroupIDs, err := r.handler.GetAllFieldGroupIDs()
	if err != nil {
		return fmt.Errorf("get field group IDs: %w", err)
	}

	for _, groupID := range allGroupIDs {
		group, err := r.handler.GetFieldGroupInfo(groupID)
		if err != nil {
			slog.Error("Failed to get field group info", "groupID", groupID, "err", err)
			continue
		}
		if group.Name() != r.config.FieldGroupName {
			continue
		}
		if reflect.DeepEqual(group.ValidFieldIDs(), r.fieldIDs) {
			slog.Debug("Reusing existing field group", "name", r.config.FieldGroupName)
			r.fieldGroupID = group.GroupID
			return nil
		}
		slog.Warn("Field group exists with different fields, recreating", "name", r.config.FieldGroupName)
		if err := r.handler.DestroyFieldGroup(group.GroupID); err != nil {
			return fmt.Errorf("destroy stale field group %q: %w", r.config.FieldGroupName, err)
		}
		break
	}

	groupID, err := r.handler.CreateFieldGroup(r.fieldIDs, r.config.FieldGroupName)
	if err != nil {
		return fmt.Errorf("create field group %q: %w", r.config.FieldGroupName, err)
	}

	r.fieldGroupID = groupID
	slog.Debug("Created field group", "groupID", groupID, "name", r.config.FieldGroupName)
	return nil
}

// allGPUGroups returns the info for every GPU group RDC currently knows about. A
// group whose info cannot be read is skipped rather than failing the lookup, so
// one bad group does not prevent reuse detection.
func (r *Reader) allGPUGroups() ([]*rdc.GpuGroupInfo, error) {
	allGroupIDs, err := r.handler.GetAllGpuGroupIDs()
	if err != nil {
		return nil, fmt.Errorf("get GPU group IDs: %w", err)
	}

	groups := make([]*rdc.GpuGroupInfo, 0, len(allGroupIDs))
	for _, groupID := range allGroupIDs {
		group, err := r.handler.GetGpuGroupInfo(groupID)
		if err != nil {
			slog.Error("Failed to get GPU group info", "groupID", groupID, "err", err)
			continue
		}
		groups = append(groups, group)
	}
	return groups, nil
}

// watchFields (re)establishes the RDC field watch for the reader's groups. It
// unwatches first so a restart with the same group names does not stack watches,
// then watches with the configured retention and update frequency.
func (r *Reader) watchFields() error {
	if err := r.handler.UnwatchFields(r.gpuGroupID, r.fieldGroupID); err != nil {
		return fmt.Errorf("unwatch fields: %w", err)
	}
	if err := r.handler.WatchFields(r.gpuGroupID, r.fieldGroupID, r.config.MaxKeepAge, r.config.MaxKeepSamples, r.config.UpdateFrequency); err != nil {
		return fmt.Errorf("watch fields: %w", err)
	}
	slog.Debug("Watching fields", "gpuGroupID", r.gpuGroupID, "fieldGroupID", r.fieldGroupID)
	return nil
}
