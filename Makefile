# ====== Application Name ======
APP := rdc-exporter

# ====== Paths ======
ROCMPFX := /opt/rocm-6.4.1
RDC_INC := $(ROCMPFX)/include
RDC_LIB := $(ROCMPFX)/lib
RDC_SO  := $(RDC_LIB)/librdc_bootstrap.so

# ====== Targets ======
ALL: checks build

# 1) Check if headers can be compiled by the C compiler (including stdbool.h as a prerequisite)
check-headers:
    @echo '[check-headers] checking C includes...'
    @echo '#include <stdbool.h>\n#include <stdint.h>\n#include "rdc/rdc.h"\nint main(){return 0;}' \
    | gcc -I$(RDC_INC) -xc - -o /dev/null
    @echo '  OK'

# 2) Check if .so exists and exports key symbols (rdc_init / rdc_start_embedded)
check-symbols:
    @echo '[check-symbols] checking $(RDC_SO) exports...'
    @test -f $(RDC_SO)
    @nm -D $(RDC_SO) | egrep ' rd(c_)?(init|start_embedded|stop_embedded)$$' || true
    @echo '  (If a symbol is missing, it may not exist or the function name is different. Please compare with rdc.h)'

# 3) Try to link a minimal test program (link only, do not execute)
check-link:
    @echo '[check-link] linking test with librdc_bootstrap.so...'
    @echo 'int main(){return 0;}' | gcc -Wl,-rpath,'$$ORIGIN' -Wl,-rpath,$(RDC_LIB) -L$(RDC_LIB) -lrdc_bootstrap -lstdc++ -ldl -lpthread -lm -xc - -o /tmp/rdc_link_test
    @echo '  OK'

# Run all checks
checks: check-headers check-symbols check-link

# Build the application
build:
    go fmt ./...
    @echo "Building $(APP)..."
    mkdir -p ./bin
    rm -f ./bin/$(APP)
    CGO_ENABLED=1 go build -o ./bin/$(APP) ./cmd/main.go

# Clean build artifacts
clean:
    rm -rf ./bin