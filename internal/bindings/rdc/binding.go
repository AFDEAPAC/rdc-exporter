package rdc

/*
#cgo linux CFLAGS: -I/opt/rocm-6.4.1/include
#cgo linux LDFLAGS: -Wl,-rpath,'$ORIGIN' -Wl,-rpath,/opt/rocm-6.4.1/lib -L/opt/rocm-6.4.1/lib -lrdc_bootstrap -lstdc++ -ldl -lpthread -lm

#include <stdbool.h>
#include <stdint.h>
#include "rdc/rdc.h"
*/
import "C"
import "fmt"

type OperationMode C.rdc_operation_mode_t

const (
	OperationModeAuto   = OperationMode(C.RDC_OPERATION_MODE_AUTO)
	OperationModeManual = OperationMode(C.RDC_OPERATION_MODE_MANUAL)
)

type Handle struct {
	h C.rdc_handle_t
}

func Init(flags uint64) error {
	st := C.rdc_init(C.uint64_t(flags))
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_init failed: status=%d", int(st))
	}
	return nil
}

func StartEmbedded(mode OperationMode) (*Handle, error) {
	var h C.rdc_handle_t
	st := C.rdc_start_embedded(C.rdc_operation_mode_t(mode), &h)
	if st != C.RDC_ST_OK {
		return nil, fmt.Errorf("rdc_start_embedded failed: status=%d", int(st))
	}
	return &Handle{h: h}, nil
}

func StopEmbedded(handle *Handle) error {
	if handle == nil {
		return fmt.Errorf("rdc handle is nil")
	}
	st := C.rdc_stop_embedded(handle.h)
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_stop_embedded failed: status=%d", int(st))
	}
	var zero C.rdc_handle_t
	handle.h = zero
	return nil
}
