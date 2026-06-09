package rdc

/*
#cgo linux CFLAGS: -I/opt/rocm/include
#cgo linux LDFLAGS: -Wl,-rpath,'$ORIGIN' -Wl,-rpath,/opt/rocm/lib -L/opt/rocm/lib -lrdc_bootstrap -lstdc++ -ldl -lpthread -lm

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include "rdc/rdc.h"
*/
import "C"
import (
	"fmt"
	"time"
	"unsafe"
)

// Handler is a live RDC session backed by a C rdc_handle_t.
//
// All RDC group, watch, and read operations go through a Handler. It owns a C
// resource and is therefore not garbage-collected away: the caller must call
// Stop to release it. A Handler is not safe for concurrent mutation of RDC
// groups, but concurrent read calls (GetLatestFieldValue) for different GPUs are
// how the exporter uses it.
type Handler struct {
	// handle is the C session handle; it is zeroed by Stop.
	handle C.rdc_handle_t
	// isEmbedded records that this process started an embedded RDC instance and
	// must stop it (rather than only disconnecting) during Stop.
	isEmbedded bool
}

// NewEmbeddedHandler starts an embedded RDC instance inside this process and
// returns a Handler for it.
//
// Embedded mode runs RDC in-process rather than talking to a separate daemon, so
// the returned Handler owns the embedded instance and Stop will shut it down.
// The operation mode is automatic. It returns an error with the RDC status code
// if the embedded instance cannot be started.
func NewEmbeddedHandler() (*Handler, error) {
	var h C.rdc_handle_t
	mode := C.rdc_operation_mode_t(OperationModeAuto)

	st := C.rdc_start_embedded(mode, &h)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_start_embedded failed: status=%d", int(st))
	}
	return &Handler{handle: h, isEmbedded: true}, nil
}

// AddGpuToGroup adds the GPU at gpuIndex to the GPU group identified by groupID.
// It returns an error carrying the RDC status code on failure.
func (h *Handler) AddGpuToGroup(groupID uint32, gpuIndex uint32) error {
	cGroupID := C.rdc_gpu_group_t(groupID)
	cGpuIndex := C.uint32_t(gpuIndex)

	st := C.rdc_group_gpu_add(h.handle, cGroupID, cGpuIndex)
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_group_gpu_add failed: status=%d", int(st))
	}
	return nil
}

// CreateFieldGroup creates an RDC field group named groupName containing
// fieldIDs and returns its group ID.
//
// The C string for groupName is freed before returning. The field IDs are copied
// into a C array for the call; the returned group ID is owned by RDC and is
// released with DestroyFieldGroup. It returns an error with the RDC status code
// on failure.
func (h *Handler) CreateFieldGroup(fieldIDs []FieldID, groupName string) (uint32, error) {
	cGroupName := C.CString(groupName)
	defer C.free(unsafe.Pointer(cGroupName))

	count := C.uint32_t(len(fieldIDs))
	cFieldIDs := make([]C.rdc_field_t, count)
	for i, id := range fieldIDs {
		cFieldIDs[i] = C.rdc_field_t(id)
	}

	var groupID C.rdc_field_grp_t
	st := C.rdc_group_field_create(h.handle, count, &cFieldIDs[0], cGroupName, &groupID)
	if st != C.RDC_ST_OK {
		return 0, fmt.Errorf("rdc_group_field_create failed: status=%d", int(st))
	}

	return uint32(groupID), nil
}

// CreateGpuGroup creates an empty RDC GPU group named groupName and returns its
// group ID. GPUs are added afterwards with AddGpuToGroup. The group is released
// with DestroyGpuGroup. It returns an error with the RDC status code on failure.
func (h *Handler) CreateGpuGroup(groupName string) (uint32, error) {
	cGroupName := C.CString(groupName)
	defer C.free(unsafe.Pointer(cGroupName))

	var groupID C.uint32_t
	st := C.rdc_group_gpu_create(
		h.handle,
		C.rdc_group_type_t(GpuGroupTypeEmpty),
		cGroupName,
		&groupID,
	)
	if st != C.RDC_ST_OK {
		return 0, fmt.Errorf("rdc_group_gpu_create failed: status=%d", int(st))
	}
	return uint32(groupID), nil
}

// DestroyFieldGroup releases the field group identified by groupID. It returns
// an error with the RDC status code on failure.
func (h *Handler) DestroyFieldGroup(groupID uint32) error {
	st := C.rdc_group_field_destroy(h.handle, C.rdc_field_grp_t(groupID))
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_group_field_destroy failed: status=%d", int(st))
	}
	return nil
}

// DestroyGpuGroup releases the GPU group identified by groupID. It returns an
// error with the RDC status code on failure.
func (h *Handler) DestroyGpuGroup(groupID uint32) error {
	st := C.rdc_group_gpu_destroy(h.handle, C.rdc_gpu_group_t(groupID))
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_group_gpu_destroy failed: status=%d", int(st))
	}

	return nil
}

// GetAllFieldGroupIDs returns the IDs of every field group currently known to
// RDC. The fixed-size C array is sized by RDC_MAX_NUM_GROUPS and only the first
// count entries are copied out. It returns an error with the RDC status code on
// failure.
func (h *Handler) GetAllFieldGroupIDs() ([]uint32, error) {
	var groupIDs [C.RDC_MAX_NUM_GROUPS]C.rdc_field_grp_t
	var count C.uint32_t

	st := C.rdc_group_field_get_all_ids(h.handle, &groupIDs[0], &count)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_group_field_get_all_ids failed: status=%d", int(st))
	}

	ids := make([]uint32, int(count))
	for i := 0; i < int(count); i++ {
		ids[i] = uint32(groupIDs[i])
	}
	return ids, nil
}

// GetAllGpuGroupIDs returns the IDs of every GPU group currently known to RDC.
// Only the first count entries of the RDC_MAX_NUM_GROUPS-sized C array are copied
// out. It returns an error with the RDC status code on failure.
func (h *Handler) GetAllGpuGroupIDs() ([]uint32, error) {
	var groupIDs [C.RDC_MAX_NUM_GROUPS]C.rdc_gpu_group_t
	var count C.uint32_t

	st := C.rdc_group_get_all_ids(h.handle, &groupIDs[0], &count)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_group_get_all_ids failed: status=%d", int(st))
	}

	ids := make([]uint32, int(count))
	for i := 0; i < int(count); i++ {
		ids[i] = uint32(groupIDs[i])
	}
	return ids, nil
}

// GetAllGpuIndexes returns the device indexes of every GPU RDC can see on the
// host. Only the first count entries of the RDC_MAX_NUM_DEVICES-sized C array are
// copied out. It returns an error with the RDC status code on failure.
func (h *Handler) GetAllGpuIndexes() ([]uint32, error) {
	var count C.uint32_t
	var gpuIndexes [C.RDC_MAX_NUM_DEVICES]C.uint32_t

	st := C.rdc_device_get_all(h.handle, &gpuIndexes[0], &count)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_device_get_all failed: status=%d", int(st))
	}

	indexes := make([]uint32, int(count))
	for i := 0; i < int(count); i++ {
		indexes[i] = uint32(gpuIndexes[i])
	}
	return indexes, nil
}

// GetFieldGroupInfo returns the name and field membership of the field group
// identified by groupID. The returned info is a Go copy; it returns an error with
// the RDC status code on failure.
func (h *Handler) GetFieldGroupInfo(groupID uint32) (*FieldGroupInfo, error) {
	var groupInfo C.rdc_field_group_info_t
	cGroupID := C.rdc_field_grp_t(groupID)

	st := C.rdc_group_field_get_info(h.handle, cGroupID, &groupInfo)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_group_field_get_info failed: status=%d", int(st))
	}

	return NewFieldGroupInfo(groupID, &groupInfo), nil
}

// GetGpuGroupInfo returns the name and GPU membership of the GPU group
// identified by groupID. The returned info is a Go copy; it returns an error with
// the RDC status code on failure.
func (h *Handler) GetGpuGroupInfo(groupID uint32) (*GpuGroupInfo, error) {
	var gpuInfo C.rdc_group_info_t

	st := C.rdc_group_gpu_get_info(h.handle, C.uint32_t(groupID), &gpuInfo)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_group_gpu_get_info failed: status=%d", int(st))
	}

	return NewGpuGroupInfo(groupID, &gpuInfo), nil
}

// GetLatestFieldValue returns the most recent cached value of fieldId for the
// GPU at gpuIndex.
//
// A field that RDC has not yet sampled (status RDC_ST_NOT_FOUND) is not treated
// as an error: a zero-valued Double FieldValue stamped with the current time is
// returned so a not-yet-populated field reads as zero rather than failing the
// whole collection. Any other non-OK status is returned as an error with the RDC
// status code. This method is safe to call concurrently for different GPUs.
func (h *Handler) GetLatestFieldValue(gpuIndex uint32, fieldId FieldID) (*FieldValue, error) {
	cGpuIndex := C.uint32_t(gpuIndex)
	cFieldId := C.rdc_field_t(fieldId)
	var value C.rdc_field_value

	st := C.rdc_field_get_latest_value(h.handle, cGpuIndex, cFieldId, &value)
	switch st {
	case C.RDC_ST_OK:
		return NewFieldValue(&value), nil
	case C.RDC_ST_NOT_FOUND:
		now := time.Now().Unix()
		empty := &FieldValue{
			FieldID:   FieldID(cFieldId),
			Status:    int(C.RDC_ST_NOT_FOUND),
			Timestamp: uint64(now),
			Type:      Double,
			Value:     FieldValueData{DoubleValue: 0.0},
		}
		return empty, nil
	}

	return nil, fmt.Errorf("rdc_field_get_latest_value failed: status=%d", int(st))
}

// Stop releases the RDC session and zeroes the handle.
//
// For an embedded handler it shuts the embedded RDC instance down. Stop must be
// called exactly once to free the C resource; calling it on an already-stopped
// handler returns an error because the handle is nil. After Stop the Handler must
// not be used again.
func (h *Handler) Stop() error {
	if h.handle == nil {
		return fmt.Errorf("rdc handle is nil")
	}

	if h.isEmbedded {
		st := C.rdc_stop_embedded(h.handle)
		if st != C.RDC_ST_OK {
			return fmt.Errorf("rdc_stop_embedded failed: status=%d", int(st))
		}
	}

	var zero C.rdc_handle_t
	h.handle = zero
	return nil
}

// UnwatchFields stops watching the field group for the GPU group.
//
// A NOT_FOUND status is tolerated so unwatching a combination that was never
// watched (for example on first startup) is a no-op rather than an error; this
// lets WatchFields be preceded by an unconditional unwatch to avoid stacking
// duplicate watches across restarts. Other non-OK statuses are returned as
// errors.
func (h *Handler) UnwatchFields(gpuGroupID, fieldGroupID uint32) error {
	cGpuGroupID := C.rdc_gpu_group_t(gpuGroupID)
	cFieldGroupID := C.rdc_field_grp_t(fieldGroupID)

	st := C.rdc_field_unwatch(h.handle, cGpuGroupID, cFieldGroupID)
	if st != C.RDC_ST_OK && st != C.RDC_ST_NOT_FOUND {
		return fmt.Errorf("rdc_field_unwatch failed: status=%d", int(st))
	}
	return nil
}

// WatchFields starts watching the field group for the GPU group so RDC caches
// samples for later reads.
//
// updateFreq is the sampling period in microseconds; maxKeepAge (seconds) and
// maxKeepSamples bound how long and how many samples RDC retains. These control
// the freshness and retention of values returned by GetLatestFieldValue. It
// returns an error with the RDC status code on failure.
func (h *Handler) WatchFields(gpuGroupID, fieldGroupID uint32, maxKeepAge float32, maxKeepSamples int32, updateFreq int64) error {
	cGpuGroupID := C.rdc_gpu_group_t(gpuGroupID)
	cFieldGroupID := C.rdc_field_grp_t(fieldGroupID)
	cMaxKeepAge := C.double(maxKeepAge)
	cMaxKeepSamples := C.uint32_t(maxKeepSamples)
	cUpdateFreq := C.uint64_t(updateFreq)

	st := C.rdc_field_watch(
		h.handle,
		cGpuGroupID,
		cFieldGroupID,
		cUpdateFreq,
		cMaxKeepAge,
		cMaxKeepSamples,
	)
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_field_watch failed: status=%d", int(st))
	}
	return nil
}
