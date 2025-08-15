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
import "fmt"

type OperationMode C.rdc_operation_mode_t

const (
	OperationModeAuto   = OperationMode(C.RDC_OPERATION_MODE_AUTO)
	OperationModeManual = OperationMode(C.RDC_OPERATION_MODE_MANUAL)
)

func Init(flags uint64) error {
	st := C.rdc_init(C.uint64_t(flags))
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_init failed: status=%d", int(st))
	}
	return nil
}
