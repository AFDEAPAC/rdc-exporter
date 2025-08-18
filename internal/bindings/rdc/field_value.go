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

type FieldType int

const (
	Integer FieldType = iota
	Double
	String
	Blob
)

type FieldValueData struct {
	IntValue    int64
	DoubleValue float64
	StringValue [C.RDC_MAX_STR_LENGTH]byte
}

type FieldValue struct {
	FieldID   FieldID
	Status    int
	Timestamp uint64
	Type      FieldType
	Value     FieldValueData
}

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

func (v *FieldValue) FloatValue() (float64, bool) {
	switch v.Type {
	case Double:
		return v.Value.DoubleValue, true
	case Integer:
		return float64(v.Value.IntValue), true
	}
	return 0, false
}
