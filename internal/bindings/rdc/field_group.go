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
import "unsafe"

type FieldID C.rdc_field_t

const (
	RDC_FI_GPU_CLOCK      FieldID = C.RDC_FI_GPU_CLOCK
	RDC_FI_GPU_TEMP       FieldID = C.RDC_FI_GPU_TEMP
	RDC_FI_PROF_SM_ACTIVE FieldID = C.RDC_FI_PROF_SM_ACTIVE
)

type FieldGroupInfo struct {
	Count     uint32
	GroupName [C.RDC_MAX_STR_LENGTH]byte
	FieldsIDs [C.RDC_MAX_FIELD_IDS_PER_FIELD_GROUP]FieldID

	GroupID uint32 // Added to store the group ID
}

func NewFieldGroupInfo(groupID uint32, cinfo *C.rdc_field_group_info_t) *FieldGroupInfo {
	var f FieldGroupInfo
	f.Count = uint32(cinfo.count)
	f.GroupID = groupID // Store the group ID
	copy(f.GroupName[:], C.GoBytes(unsafe.Pointer(&cinfo.group_name[0]), C.RDC_MAX_STR_LENGTH))
	for i := 0; i < int(cinfo.count); i++ {
		f.FieldsIDs[i] = FieldID(cinfo.field_ids[i])
	}
	return &f
}

func (f *FieldGroupInfo) Name() string {
	return string(f.GroupName[:])
}

func (f *FieldGroupInfo) ValidFieldIDs() []FieldID {
	validIDs := make([]FieldID, 0, f.Count)
	for i := 0; i < int(f.Count); i++ {
		if f.FieldsIDs[i] != 0 {
			validIDs = append(validIDs, f.FieldsIDs[i])
		}
	}
	return validIDs
}
