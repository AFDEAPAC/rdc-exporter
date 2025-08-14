package rdc

/*
#cgo linux CFLAGS: -I/opt/rocm-6.4.1/include
#cgo linux LDFLAGS: -Wl,-rpath,'$ORIGIN' -Wl,-rpath,/opt/rocm-6.4.1/lib -L/opt/rocm-6.4.1/lib -lrdc_bootstrap -lstdc++ -ldl -lpthread -lm

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include "rdc/rdc.h"
*/
import "C"
import (
	"fmt"
	"unsafe"
)

type Handler struct {
	handle     C.rdc_handle_t
	isEmbedded bool
}

func NewEmbeddedHandler() (*Handler, error) {
	var h C.rdc_handle_t
	mode := C.rdc_operation_mode_t(OperationModeAuto)

	st := C.rdc_start_embedded(mode, &h)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_start_embedded failed: status=%d", int(st))
	}
	return &Handler{handle: h, isEmbedded: true}, nil
}

func (h *Handler) AddGpuToGroup(groupID uint32, gpuIndex uint32) error {
	cGroupID := C.rdc_gpu_group_t(groupID)
	cGpuIndex := C.uint32_t(gpuIndex)

	st := C.rdc_group_gpu_add(h.handle, cGroupID, cGpuIndex)
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_group_gpu_add failed: status=%d", int(st))
	}
	return nil
}

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

func (h *Handler) DestroyGpuGroup(groupID uint32) error {
	st := C.rdc_group_gpu_destroy(h.handle, C.rdc_gpu_group_t(groupID))
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_group_gpu_destroy failed: status=%d", int(st))
	}

	return nil
}

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

func (h *Handler) GetGpuGroupInfo(groupID uint32) (*GpuGroupInfo, error) {
	var gpuInfo C.rdc_group_info_t

	st := C.rdc_group_gpu_get_info(h.handle, C.uint32_t(groupID), &gpuInfo)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_group_gpu_get_info failed: status=%d", int(st))
	}

	return NewGpuGroupInfo(groupID, &gpuInfo), nil
}

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
