// Package rdc is the cgo binding for the ROCm Data Center (RDC) C library.
//
// It is the outermost Frameworks and Drivers layer: the only place that includes
// rdc/rdc.h, links librdc_bootstrap, and handles unsafe pointer conversions
// between C and Go. It exposes thin Go wrappers (a Handler plus value types) so
// the interface-adapter layer can talk to RDC without touching cgo directly. No
// inner layer may import this package; doing so would pull the RDC C ABI into
// the domain. The wrappers translate every C status into a Go error and copy C
// data into Go-owned memory so callers never hold a C pointer.
//
// Building this package requires the RDC headers and libraries under /opt/rocm
// and, at runtime, a host with the RDC daemon/GPUs available; it cannot be built
// or tested on a machine without the ROCm toolchain.
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

// OperationMode selects how RDC advances its internal field updates. It mirrors
// the C rdc_operation_mode_t enum.
type OperationMode C.rdc_operation_mode_t

const (
	// OperationModeAuto lets RDC update watched fields on its own schedule.
	OperationModeAuto = OperationMode(C.RDC_OPERATION_MODE_AUTO)
	// OperationModeManual requires the caller to drive field updates explicitly.
	OperationModeManual = OperationMode(C.RDC_OPERATION_MODE_MANUAL)
)

// Init initializes the RDC library for the process.
//
// It must be called once before any handler is started; flags are passed through
// to rdc_init unchanged. It returns an error carrying the RDC status code when
// initialization fails.
func Init(flags uint64) error {
	st := C.rdc_init(C.uint64_t(flags))
	if st != C.RDC_ST_OK {
		return fmt.Errorf("rdc_init failed: status=%d", int(st))
	}
	return nil
}
