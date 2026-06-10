---
name: build-docker-image
description: Build the rdc-exporter container image through the Makefile (make image) to verify the whole project — including the cgo RDC bindings that need real rdc.h headers — compiles cleanly. ROCm/Go versions and the image tag (ghcr.io/maple52046/rdc-exporter:v1-rocm<ROCM_VERSION>-<date>) are owned by the Makefile and passed into the Dockerfile via --build-arg; supports --date <YYYYMMDD>, --no-verify (skip the full go build/vet/test pass), --push, and --tag <full-tag> (overwrite only). Use when the user runs /build-docker-image or asks to build the docker image, verify the code compiles via docker, or produce a release image.
disable-model-invocation: true
---

# Build Docker Image — Cursor Entry

This is the Cursor-specific entry point for the `build-docker-image` skill. Its
only job is to wire the skill into Cursor's `/`-command discovery.

The full, IDE-neutral instructions are defined once in:

`skills/build-docker-image/SKILL.md` (relative to the repository root).

When this skill is invoked, read `skills/build-docker-image/SKILL.md` and follow
it exactly. Do not duplicate or fork the steps here — keep this file as a thin
reference so there is a single source of truth.
