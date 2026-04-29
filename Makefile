APP := rdc-exporter
.PHONY: build clean image
ALL: build

# Build the application
build:
	go fmt ./...
	@echo "Building $(APP)..."
	mkdir -p ./bin
	rm -f ./bin/$(APP)
	CGO_ENABLED=1 go build -o ./bin/$(APP) ./cmd/rdc-exporter/main.go

image:
	docker build -t rdc-exporter:v1-rocm7.2.2-$(shell date +'%Y%m%d') \
		--label org.opencontainers.image.created="$(shell date -u +'%Y-%m-%dT%H:%M:%SZ')" \
		--label org.opencontainers.image.version="$(shell date +'%Y%m%d')" .

# Clean build artifacts
clean:
	rm -rf ./bin