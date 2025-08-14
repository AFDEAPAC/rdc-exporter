# ====== Application Name ======
APP := rdc-exporter

# Build the application
build:
	go fmt ./...
	@echo "Building $(APP)..."
	mkdir -p ./bin
	rm -f ./bin/$(APP)
	CGO_ENABLED=1 go build -o ./bin/$(APP) ./cmd/rdc-exporter/main.go

# Clean build artifacts
clean:
	rm -rf ./bin