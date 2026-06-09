package rdc

/*
#cgo linux CFLAGS: -I/opt/rocm/include
#cgo linux LDFLAGS: -Wl,-rpath,'$ORIGIN' -Wl,-rpath,/opt/rocm/lib -L/opt/rocm/lib -lrdc_bootstrap -lstdc++ -ldl -lpthread -lm

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include "rdc/rdc.h"
static inline rdc_field_type_t get_field_type(rdc_field_value* v) {
    return v->type;
}
*/
import "C"
import "unsafe"

// FieldType is the discriminant for the value carried in a FieldValue, mirroring
// the RDC rdc_field_type_t enum.
type FieldType int

const (
	// Integer indicates the value is held in FieldValueData.IntValue.
	Integer FieldType = iota
	// Double indicates the value is held in FieldValueData.DoubleValue.
	Double
	// String indicates the value is held in FieldValueData.StringValue.
	String
	// Blob indicates an opaque value the exporter does not interpret.
	Blob
)

// FieldValueData holds the decoded payload of a field reading. Only the member
// selected by FieldValue.Type is meaningful; the others hold zero values.
type FieldValueData struct {
	// IntValue is set when the field type is Integer.
	IntValue int64
	// DoubleValue is set when the field type is Double.
	DoubleValue float64
	// StringValue is set when the field type is String, sized by the RDC max
	// string length.
	StringValue [C.RDC_MAX_STR_LENGTH]byte
}

// FieldValue is a Go-owned copy of a single RDC field reading.
//
// It captures the field, RDC status, timestamp, value type, and decoded value.
// All C data is copied into Go memory by NewFieldValue, so a FieldValue is safe
// to retain after the originating C buffer is gone.
type FieldValue struct {
	// FieldID is the field this reading is for.
	FieldID FieldID
	// Status is the RDC status code for the reading.
	Status int
	// Timestamp is the RDC sample timestamp.
	Timestamp uint64
	// Type selects which member of Value is valid.
	Type FieldType
	// Value holds the decoded reading.
	Value FieldValueData
}

// NewFieldValue decodes a C rdc_field_value into a Go-owned FieldValue.
//
// The C union is read through the type discriminant: integer and double values
// are reinterpreted from the union storage with unsafe.Pointer, and string values
// are copied out with GoBytes. Blob and unknown types are accepted but leave
// Value zeroed because the exporter only consumes numeric fields. The input
// pointer is not retained.
func NewFieldValue(val *C.rdc_field_value) *FieldValue {
	v := &FieldValue{
		FieldID:   FieldID(val.field_id),
		Status:    int(val.status),
		Type:      FieldType(C.get_field_type(val)), // Use helper function to get type
		Timestamp: uint64(val.ts),
	}

	switch v.Type {
	case Integer:
		v.Value.IntValue = *(*int64)(unsafe.Pointer(&val.value))
	case Double:
		v.Value.DoubleValue = *(*float64)(unsafe.Pointer(&val.value))
	case String:
		copy(v.Value.StringValue[:], C.GoBytes(unsafe.Pointer(&val.value), C.RDC_MAX_STR_LENGTH))
	case Blob:
		// Handle blob type if needed
	default:
		// Unsupported type, handle error or log
	}

	return v
}

// FloatValue returns the reading as a float64 and whether it was numeric.
//
// Double values are returned as-is and Integer values are converted; for String,
// Blob, or unknown types it returns (0, false) so callers can distinguish a
// genuine zero from a non-numeric field.
func (v *FieldValue) FloatValue() (float64, bool) {
	switch v.Type {
	case Double:
		return v.Value.DoubleValue, true
	case Integer:
		return float64(v.Value.IntValue), true
	}
	return 0, false
}
