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

type GpuGroupInfo struct {
	Count     uint32
	GroupName [C.RDC_MAX_STR_LENGTH]byte
	EntityIDs [C.RDC_GROUP_MAX_ENTITIES]uint32

	GroupID uint32 // Added to store the group ID
}

type GpuGroupType C.rdc_group_type_t

const (
	GpuGroupTypeDefault = GpuGroupType(C.RDC_GROUP_DEFAULT)
	GpuGroupTypeEmpty   = GpuGroupType(C.RDC_GROUP_EMPTY)
)

func NewGpuGroupInfo(groupID uint32, cinfo *C.rdc_group_info_t) *GpuGroupInfo {
	var g GpuGroupInfo
	g.Count = uint32(cinfo.count)
	g.GroupID = groupID // Store the group ID
	copy(g.GroupName[:], C.GoBytes(unsafe.Pointer(&cinfo.group_name[0]), C.RDC_MAX_STR_LENGTH))
	for i := 0; i < int(g.Count) && i < int(C.RDC_GROUP_MAX_ENTITIES); i++ {
		g.EntityIDs[i] = uint32(cinfo.entity_ids[i])
	}
	return &g
}

func (g *GpuGroupInfo) Name() string {
	return string(g.GroupName[:])
}

// ValidEntityIDs returns a slice of valid entity IDs in the group.
func (g *GpuGroupInfo) ValidEntityIDs() []uint32 {
	return g.EntityIDs[:g.Count]
}
