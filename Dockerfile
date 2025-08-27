# syntax=docker/dockerfile:1
FROM ubuntu:22.04 AS base

## Basic arguments and environment parameters
ARG GRPC_ROOT="/opt/grpc"
ENV DEBIAN_FRONTEND=noninteractive
ENV _GLIBCXX_USE_CXX11_ABI=1

## Setup ROCm repo
ARG ROCM_DEB="https://repo.radeon.com/amdgpu-install/6.3.3/ubuntu/jammy/amdgpu-install_6.3.60303-1_all.deb"
RUN apt update && \
    apt install -y wget && \
    wget -O /tmp/amdgpu-install.deb ${ROCM_DEB} && \
    apt install -y /tmp/amdgpu-install.deb && \
    rm -f /tmp/amdgpu-install.deb && \
    apt clean && \
    echo 'Acquire::https::repo.radeon.com::Verify-Peer "false";' | tee /etc/apt/apt.conf.d/99radeon && \
    apt update

## Setup ROCm environment
ARG ROCM_VERSION="6.3.3"
ENV ROCM_HOME="/opt/rocm-${ROCM_VERSION}"
ENV CMAKE_PREFIX_PATH="$ROCM_HOME/lib/cmake:${CMAKE_PREFIX_PATH:-/usr/local/lib/cmake}"
ENV CPLUS_INCLUDE_PATH="$ROCM_HOME/include:${CPLUS_INCLUDE_PATH:-/usr/local/include}"
ENV LD_LIBRARY_PATH="$ROCM_HOME/lib:${LD_LIBRARY_PATH:-/usr/local/lib}"
ENV PATH="$ROCM_HOME/bin:$PATH"

WORKDIR /opt

FROM base AS builder

## Install basic packages
RUN apt update && \
    apt install -y build-essential cmake git && \
    apt clean

## Download and install Go
ARG GO_VERSION="1.24.5"
RUN wget -qO- https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz | tar -C /usr/local -xzf -
ENV PATH="/usr/local/go/bin:$PATH"

## Build grpc
FROM builder AS grpc-builder

ARG GRPC_VERSION="v1.72.2"
WORKDIR /srv/grpc
RUN git clone -b ${GRPC_VERSION} --single-branch https://github.com/grpc/grpc.git .
RUN git submodule update --init --recursive
RUN cmake -B build \
    -DgRPC_INSTALL=ON \
    -DgRPC_BUILD_TESTS=OFF \
    -DBUILD_SHARED_LIBS=ON \
    -DCMAKE_INSTALL_PREFIX=$GRPC_ROOT \
    -DCMAKE_INSTALL_LIBDIR=lib \
    -DCMAKE_BUILD_TYPE=Release
RUN make -C build install -j $(nproc)

## Build rocprofiler-sdk (with patch)
FROM builder AS rocmpkg-builder

## Build RocProfiler SDK
RUN apt install -y hipcc hsa-amd-aqlprofile libdrm-dev libdw-dev libelf-dev libsqlite3-dev rocm-device-libs
ARG ROCPROF_BRANCH="amd-staging_deprecated"
ARG ROCPROF_COMMIT="3aaffc4"
WORKDIR /opt/rocprofiler-sdk
RUN git clone -b ${ROCPROF_BRANCH} --single-branch https://github.com/ROCm/rocprofiler-sdk.git .
RUN git checkout ${ROCPROF_COMMIT}
RUN --mount=type=bind,source=docker/patchs/0001-bewelton-rocprofile-sdk-patch.patch,target=/tmp/0001-bewelton-rocprofile-sdk-patch.patch,ro \
    GIT_COMMITTER_NAME="Benjamin Welton" \
    GIT_COMMITTER_EMAIL="bewelton@amd.com" \
    git am --committer-date-is-author-date < /tmp/0001-bewelton-rocprofile-sdk-patch.patch
RUN git submodule update --init --recursive
WORKDIR /opt/rocprofiler-sdk/build
RUN cmake .. \
    -DROCPROFILER_BUILD_TESTS=0 \
    -DROCPROFILER_BUILD_SAMPLES=0 \
    -DCMAKE_EXPORT_COMPILE_COMMANDS=TRUE \
    -DCMAKE_MODULE_PATH="${ROCM_HOME}/hip/cmake;${ROCM_HOME}/lib/cmake" \
    -DCMAKE_PREFIX_PATH="/llvm;${ROCM_HOME}" \
    -DCMAKE_INSTALL_PREFIX=${ROCM_HOME} \
    -DCMAKE_SHARED_LINKER_FLAGS="-Wl,--enable-new-dtags -Wl,--rpath,${ROCM_HOME}/lib" \
    -DCMAKE_INSTALL_RPATH= \
    -DCMAKE_INSTALL_RPATH_USE_LINK_PATH=FALSE \
    -DCPACK_PACKAGING_INSTALL_PREFIX=${ROCM_HOME} \
    -DCPACK_GENERATOR="DEB;RPM" \
    -DCPACK_OBJCOPY_EXECUTABLE=${ROCM_HOME}/llvm/bin/llvm-objcopy \
    -DCPACK_READELF_EXECUTABLE=${ROCM_HOME}/llvm/bin/llvm-readelf \
    -DCPACK_STRIP_EXECUTABLE=${ROCM_HOME}/llvm/bin/llvm-strip \
    -DCPACK_OBJDUMP_EXECUTABLE=${ROCM_HOME}/llvm/bin/llvm-objdump \
    -DHIP_ROOT_DIR=${ROCM_HOME} \
    -DROCPROFILER_UNSAFE_NO_VERSION_CHECK=ON \
    -DROCPROFILER_BUILD_DEVELOPER=OFF \
    -DROCPROFILER_MEMCHECK= \
    -DROCPROFILER_ENABLE_CLANG_TIDY=OFF \
    -DROCPROFILER_BUILD_TYPES=debug \
    -DROCPROFILER_BUILD_DEBUG=ON \
    -DCMAKE_HIP_COMPILER=${ROCM_HOME}/bin/amdclang++
RUN cmake --build . -j$(nproc)
RUN make install -j$(nproc)
RUN make install -j$(nproc) DESTDIR=/exports

## Install grpc
COPY --from=grpc-builder ${GRPC_ROOT} ${GRPC_ROOT}

## Build RDC
RUN apt install -y amd-smi-lib libcap-dev && apt clean
ARG RDC_BRANCH="rocm-6.3.x"
WORKDIR /opt/rdc
RUN git clone -b ${RDC_BRANCH} --single-branch https://github.com/ROCm/rdc.git .
RUN --mount=type=bind,source=docker/patchs/0001-Profiler-Remove-buffer-to-fix-memory-leaks.patch,target=/tmp/0001-Profiler-Remove-buffer-to-fix-memory-leaks.patch,ro \
    GIT_COMMITTER_NAME="Galantsev, Dmitrii" \
    GIT_COMMITTER_EMAIL="dmitrii.galantsev@amd.com" \
    git am --committer-date-is-author-date < /tmp/0001-Profiler-Remove-buffer-to-fix-memory-leaks.patch
RUN git submodule update --init --recursive
RUN cmake -B build -DGRPC_ROOT="$GRPC_ROOT" -DBUILD_PROFILER=ON -DBUILD_RVS=OFF -DCMAKE_INSTALL_PREFIX=${ROCM_HOME}
RUN make -C build -j $(nproc)
RUN make -C build install -j $(nproc)
RUN make -C build install -j $(nproc) DESTDIR=/exports

## Build rdc-exporter
WORKDIR /opt/rdc-exporter
ADD . /opt/rdc-exporter
RUN go mod tidy

# (Temporarily) patch rdc header and remove unsupported fields
RUN sed -i '362,365d' $ROCM_HOME/include/rdc/rdc.h
RUN sed -i '22,31d' pkg/catalog/catalog.yaml

RUN make

## Final output
FROM base

LABEL org.opencontainers.image.title="rdc-exporter" \
      org.opencontainers.image.authors="DCGPU System Eng TWN, AMD Inc." \
      org.opencontainers.image.description="RDC Exporter for AMD GPU" \
      org.opencontainers.image.source="https://github.com/ROCm/rdc-exporter" \
      org.opencontainers.image.vendor="AMD Inc." \
      org.opencontainers.image.version="20250822" \
      com.amd.rocm.version="${ROCM_VERSION}"

# Install basic ROCm packages
RUN apt update && \
    apt install -y amd-smi-lib comgr hip-runtime-amd hsa-amd-aqlprofile libhsa-runtime64-1 libdw1 && \
    apt clean

# Install RocProfiler SDK and RDC
COPY --from=rocmpkg-builder /exports/opt/rocm-6.3.3 /opt/rocm-6.3.3
ENV HSA_TOOLS_LIB=$ROCM_HOME/lib/librocprofiler64.so

# Install RDC exporter
WORKDIR /opt/rdc-exporter
RUN --mount=type=bind,from=rocmpkg-builder,source=/opt/rdc-exporter,target=/builder,ro \
    mkdir -p bin && \
    cp /builder/bin/rdc-exporter bin/rdc-exporter && \
    cp /builder/pkg/catalog/catalog.yaml catalog-example.yaml && \
    chmod +x bin/rdc-exporter
ENV PATH="/opt/rdc-exporter/bin:$PATH"

EXPOSE 5000
ENTRYPOINT ["/opt/rdc-exporter/bin/rdc-exporter"]
