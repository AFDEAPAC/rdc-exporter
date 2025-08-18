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

type FieldID C.rdc_field_t

func NewFieldIDFromInt(id int) FieldID {
	if id < 0 || id > 0xFFFF {
		return FieldID(0)
	}
	return FieldID(C.rdc_field_t(id))
}

func (f FieldID) Name() string {
	cname := C.field_id_string(C.rdc_field_t(f))
	if cname == nil {
		return ""
	}
	return C.GoString(cname)
}
