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

// GpuGroupInfo is a Go-owned copy of an RDC GPU group's membership.
//
// The fixed-size arrays mirror the C struct; Count is the number of valid GPU
// entity IDs in EntityIDs. GroupID is not part of the C struct: it is the id used
// to fetch this info, carried so callers can correlate it when scanning groups.
type GpuGroupInfo struct {
	// Count is the number of valid entries in EntityIDs.
	Count uint32
	// GroupName is the RDC group name, NUL-padded to the RDC max string length.
	GroupName [C.RDC_MAX_STR_LENGTH]byte
	// EntityIDs is the fixed-capacity GPU membership; only the first Count
	// entries are meaningful.
	EntityIDs [C.RDC_GROUP_MAX_ENTITIES]uint32

	// GroupID is the id used to fetch this info, stored for correlation.
	GroupID uint32
}

// GpuGroupType mirrors the RDC rdc_group_type_t enum used when creating a GPU
// group.
type GpuGroupType C.rdc_group_type_t

const (
	// GpuGroupTypeDefault creates a group pre-populated with all GPUs.
	GpuGroupTypeDefault = GpuGroupType(C.RDC_GROUP_DEFAULT)
	// GpuGroupTypeEmpty creates an empty group GPUs are added to explicitly.
	GpuGroupTypeEmpty = GpuGroupType(C.RDC_GROUP_EMPTY)
)

// NewGpuGroupInfo copies a C rdc_group_info_t into a Go-owned GpuGroupInfo,
// tagging it with groupID. The name and the first count entity IDs are copied into
// Go memory so the result does not alias the C struct.
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

// Name returns the group name as a Go string, including any trailing NUL padding
// from the fixed-size C buffer. Callers comparing against an unpadded name must
// account for this.
func (g *GpuGroupInfo) Name() string {
	return string(g.GroupName[:])
}

// ValidEntityIDs returns the group's GPU entity IDs, limited to the first Count
// entries so the zero padding is excluded.
func (g *GpuGroupInfo) ValidEntityIDs() []uint32 {
	return g.EntityIDs[:g.Count]
}
