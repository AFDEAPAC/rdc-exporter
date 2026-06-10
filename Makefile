APP          := rdc-exporter

## ROCm / Go build parameters — single source of truth, passed into the Dockerfile
## via --build-arg. Override on the command line, e.g. `make image ROCM_VERSION=7.2.5`.
ROCM_VERSION ?= 7.2.4
ROCM_DEB     ?= https://repo.radeon.com/amdgpu-install/7.2.4/ubuntu/noble/amdgpu-install_7.2.4.70204-1_all.deb
GO_VERSION   ?= 1.26.4

## Image naming
BUILD_DATE   ?= $(shell date +'%Y%m%d')
IMAGE_REPO   ?= ghcr.io/maple52046/rdc-exporter
IMAGE_TAG    ?= $(IMAGE_REPO):v1-rocm$(ROCM_VERSION)-$(BUILD_DATE)

## Build args shared by the image targets
DOCKER_BUILD_ARGS := --build-arg ROCM_DEB="$(ROCM_DEB)" \
	--build-arg ROCM_VERSION="$(ROCM_VERSION)" \
	--build-arg GO_VERSION="$(GO_VERSION)"

.PHONY: build clean image image-verify print-image
ALL: build

# Build the application
build:
	go fmt ./...
	@echo "Building $(APP)..."
	mkdir -p ./bin
	rm -f ./bin/$(APP)
	CGO_ENABLED=1 go build -o ./bin/$(APP) ./cmd/rdc-exporter/main.go

# Build the container image (ROCm/Go versions come from the variables above)
image:
	docker build $(DOCKER_BUILD_ARGS) \
		--build-arg BUILD_DATE="$(BUILD_DATE)" \
		-t $(IMAGE_TAG) \
		--label org.opencontainers.image.created="$(shell date -u +'%Y-%m-%dT%H:%M:%SZ')" \
		--label org.opencontainers.image.version="$(BUILD_DATE)" .

# Verify the whole module compiles inside the builder stage (incl. cmd/rdc-parser)
image-verify:
	docker build --target builder $(DOCKER_BUILD_ARGS) -t $(APP)-builder:tmp .
	docker run --rm $(APP)-builder:tmp sh -c "cd /opt/$(APP) && CGO_ENABLED=1 go build ./... && CGO_ENABLED=1 go vet ./... && CGO_ENABLED=1 go test ./..."
	docker rmi $(APP)-builder:tmp

# Print the resolved image tag (used by tooling / the build-docker-image skill)
print-image:
	@echo $(IMAGE_TAG)

# Clean build artifacts
clean:
	rm -rf ./bin
