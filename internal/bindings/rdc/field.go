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

// FieldID is the RDC field identifier, mirroring the C rdc_field_t enum. It is
// the binding-layer counterpart to the domain's metric.FieldID; adapters convert
// between the two at the boundary.
type FieldID C.rdc_field_t

// NewFieldIDFromInt converts a plain integer field id (as configured in the
// catalog) into a FieldID.
//
// Values outside the valid rdc_field_t range (0..0xFFFF) are clamped to FieldID(0)
// rather than producing an out-of-range C enum, so a misconfigured field id fails
// safe instead of corrupting later RDC calls.
func NewFieldIDFromInt(id int) FieldID {
	if id < 0 || id > 0xFFFF {
		return FieldID(0)
	}
	return FieldID(C.rdc_field_t(id))
}

// Name returns the RDC enum name for the field, for example RDC_FI_GPU_CLOCK, by
// calling the C field_id_string helper. It returns an empty string when RDC does
// not recognize the field. The returned Go string is a copy and does not alias C
// memory.
func (f FieldID) Name() string {
	cname := C.field_id_string(C.rdc_field_t(f))
	if cname == nil {
		return ""
	}
	return C.GoString(cname)
}
