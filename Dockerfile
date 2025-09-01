# syntax=docker/dockerfile:1
FROM ubuntu:22.04 AS base

## Basic arguments and environment parameters
ENV DEBIAN_FRONTEND=noninteractive
ENV _GLIBCXX_USE_CXX11_ABI=1

## Setup ROCm repo
ARG ROCM_DEB="https://artifactory-cdn.amd.com/artifactory/list/amdgpu-deb/amdgpu-install-internal_7.0-22.04-1_all.deb"
RUN apt update && \
    apt install -y wget && \
    wget -O /tmp/amdgpu-install.deb ${ROCM_DEB} && \
    apt install -y /tmp/amdgpu-install.deb && \
    rm -f /tmp/amdgpu-install.deb && \
    apt clean && \
    echo 'Acquire::https::repo.radeon.com::Verify-Peer "false";' | tee /etc/apt/apt.conf.d/99radeon && \
    apt update
RUN amdgpu-repo --amdgpu-build=2204044 --rocm-build=compute-rocm-rel-7.0/38

## Install ROCm packages for building
RUN apt update && \
    apt install -y rdc rocprofiler-sdk && \
    apt clean

## Setup ROCm environment
ARG ROCM_VERSION="7.0.0"
ENV ROCM_HOME="/opt/rocm-${ROCM_VERSION}"
ENV CMAKE_PREFIX_PATH="$ROCM_HOME/lib/cmake:${CMAKE_PREFIX_PATH:-/usr/local/lib/cmake}"
ENV CPLUS_INCLUDE_PATH="$ROCM_HOME/include:${CPLUS_INCLUDE_PATH:-/usr/local/include}"
ENV LD_LIBRARY_PATH="$ROCM_HOME/lib:${LD_LIBRARY_PATH:-/usr/local/lib}"
ENV PATH="$ROCM_HOME/bin:$PATH"

WORKDIR /opt

FROM base AS builder

## Install basic packages
RUN apt update && \
    apt install -y make && \
    apt clean

## Download and install Go
ARG GO_VERSION="1.24.6"
RUN wget -qO- https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz | tar -C /usr/local -xzf -
ENV PATH="/usr/local/go/bin:$PATH"

## Build rdc-exporter
WORKDIR /opt/rdc-exporter
ADD . /opt/rdc-exporter
RUN go mod tidy
RUN make

## Final output
FROM base

LABEL org.opencontainers.image.title="rdc-exporter" \
      org.opencontainers.image.authors="DCGPU System Eng TWN, AMD Inc." \
      org.opencontainers.image.description="RDC Exporter for AMD GPU" \
      org.opencontainers.image.source="https://github.com/ROCm/rdc-exporter" \
      org.opencontainers.image.vendor="AMD Inc." \
      org.opencontainers.image.version="20250901" \
      com.amd.rocm.version="${ROCM_VERSION}"

# Install basic ROCm packages
RUN apt update && \
    apt install -y amd-smi-lib comgr hip-runtime-amd hsa-amd-aqlprofile libhsa-runtime64-1 libdw1 && \
    apt clean

# Remove internal AMD repo
RUN apt purge -y amdgpu-install-internal && \
    rm -f /etc/apt/apt.conf.d/99radeon && \
    apt update

# Install RDC exporter
WORKDIR /opt/rdc-exporter
RUN --mount=type=bind,from=builder,source=/opt/rdc-exporter,target=/builder,ro \
    mkdir -p bin && \
    cp /builder/bin/rdc-exporter bin/rdc-exporter && \
    cp /builder/pkg/catalog/catalog.yaml catalog-example.yaml && \
    chmod +x bin/rdc-exporter
ENV PATH="/opt/rdc-exporter/bin:$PATH"

EXPOSE 5000
ENTRYPOINT ["/opt/rdc-exporter/bin/rdc-exporter"]
