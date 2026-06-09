---
name: build-docker-image
description: Build the rdc-exporter container image from the repository Dockerfile (ROCm 7.2.2 base) to verify the whole project — including the cgo RDC bindings that need real rdc.h headers — compiles cleanly, tagging it ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.2-<date>; supports --date <YYYYMMDD>, --tag <full-tag>, --no-verify (skip the full go build/vet/test pass), and --push. Use when the user runs /build-docker-image or asks to build the docker image, verify the code compiles via docker, or produce a release image.
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
