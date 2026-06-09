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

// FieldGroupInfo is a Go-owned copy of an RDC field group's membership.
//
// The fixed-size arrays mirror the C struct layout; Count is the number of valid
// entries in FieldsIDs. GroupID is not part of the C struct: it is the id used to
// look the group up, carried here so callers can correlate the info with its
// group when scanning all groups.
type FieldGroupInfo struct {
	// Count is the number of valid field IDs in FieldsIDs.
	Count uint32
	// GroupName is the RDC group name, NUL-padded to the RDC max string length.
	GroupName [C.RDC_MAX_STR_LENGTH]byte
	// FieldsIDs is the fixed-capacity field membership; only the first Count
	// entries are meaningful.
	FieldsIDs [C.RDC_MAX_FIELD_IDS_PER_FIELD_GROUP]FieldID

	// GroupID is the id used to fetch this info, stored for correlation.
	GroupID uint32
}

// NewFieldGroupInfo copies a C rdc_field_group_info_t into a Go-owned
// FieldGroupInfo, tagging it with groupID. The group name and the first count
// field IDs are copied into Go memory so the result does not alias the C struct.
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

// Name returns the group name as a Go string, including any trailing NUL padding
// from the fixed-size C buffer. Callers that compare against an unpadded name
// must account for this.
func (f *FieldGroupInfo) Name() string {
	return string(f.GroupName[:])
}

// ValidFieldIDs returns the group's field IDs, dropping the zero padding so the
// result can be compared against a configured field list.
func (f *FieldGroupInfo) ValidFieldIDs() []FieldID {
	validIDs := make([]FieldID, 0, f.Count)
	for i := 0; i < int(f.Count); i++ {
		if f.FieldsIDs[i] != 0 {
			validIDs = append(validIDs, f.FieldsIDs[i])
		}
	}
	return validIDs
}
