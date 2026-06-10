# Build Docker Image

Build the `rdc-exporter` container image **through the `Makefile`** to verify that
the code — including the cgo layer that binds the ROCm/RDC C library — compiles
cleanly against the real `rdc.h` headers, which are **not** available on the local
host.

Run all commands from the repository root.

## Why This Skill Exists

The inner Go layers (domain, use case, catalog, Prometheus sink) build and test
on any host. The cgo packages cannot: `internal/bindings/rdc`,
`internal/adapter/rdcsource`, and `cmd/rdc-exporter` need
`/opt/rocm/include/rdc/rdc.h`, which only exists inside the ROCm image. Building
the Docker image is therefore the canonical way to prove the **whole** project
compiles.

The `Makefile` is the single source of truth for the build parameters
(`ROCM_VERSION`, `ROCM_DEB`, `GO_VERSION`) and the image tag. This skill drives
the build through `make`, not through a raw `docker build`, so the tag and
build-args always stay consistent with the `Makefile`.

## When to Use This Skill

Read this skill when the task asks to build the Docker image, produce a release
image, or verify that the code compiles via Docker — especially when the user
runs `/build-docker-image`.

## Invocation

```
/build-docker-image [--date <YYYYMMDD>] [--no-verify] [--push] [--tag <full-tag>]
```

| Flag | Required | Values | Default |
| --- | --- | --- | --- |
| `--date <YYYYMMDD>` | no | date stamp | today's date (`make` default) |
| `--no-verify` | no | flag (no value) | off (full verify runs) |
| `--push` | no | flag (no value) | off |
| `--tag <full-tag>` | no (**overwrite only**) | full image reference | the `Makefile`'s derived `IMAGE_TAG` |

Behavior of the flags:

- **Default (no flags):** build with `make image` — the tag and ROCm/Go versions
  come entirely from the `Makefile`. Then confirm the image and its contents and
  run the full-project verification (`make image-verify`).
- `--date <YYYYMMDD>`: pass `BUILD_DATE=<date>` to `make` (overrides the date in
  the derived tag and the `org.opencontainers.image.version` label).
- `--no-verify`: build the image only; skip `make image-verify`.
- `--push`: run `docker push <tag>` after a successful build. Requires the user to
  be logged in (`docker login ghcr.io`); if auth fails, report it and stop.
- `--tag <full-tag>`: **overwrite-only.** Only pass this when the user explicitly
  wants a tag different from the `Makefile`'s derived `IMAGE_TAG`; it maps to
  `make image IMAGE_TAG=<full-tag>`. If omitted, do **not** construct a tag
  yourself — let the `Makefile` decide.

## Naming Convention

The tag is produced by the `Makefile`, not by this skill:

```
ghcr.io/maple52046/rdc-exporter:v1-rocm<ROCM_VERSION>-<BUILD_DATE>
```

- `v1` — image schema version.
- `rocm<ROCM_VERSION>` — `make` variable `ROCM_VERSION` (also passed to the
  Dockerfile as a build-arg, e.g. `rocm7.2.4`).
- `<BUILD_DATE>` — `make` variable `BUILD_DATE` (defaults to today), also written
  to the `org.opencontainers.image.version` label.

To change the ROCm or Go version, edit the variables at the top of the `Makefile`
(`ROCM_VERSION`, `ROCM_DEB`, `GO_VERSION`) — the Dockerfile receives them via
`--build-arg`, so there is nothing to change in the Dockerfile.

## Steps

1. **Resolve the tag.** Decide the make variables from the flags:
   - `MAKE_VARS` = `BUILD_DATE=<date>` if `--date` was given (else nothing).
   - add `IMAGE_TAG=<full-tag>` only if `--tag` was given.

   Capture the resolved tag so later steps can reference it:

   ```bash
   TAG=$(make -s print-image $MAKE_VARS)
   ```

   Confirm `docker` is available (`docker version`).

2. **Build the image.** Long-running (a first build, or one after a ROCm version
   bump, pulls Ubuntu, installs ROCm ~7 min, downloads Go, then compiles). Run it
   in the background and monitor; do not block the whole turn on it.

   ```bash
   make image $MAKE_VARS 2>&1 | tee /tmp/rdc_build.log
   ```

3. **Watch the critical compile step.** The cgo compile happens at the builder
   stage `RUN make`, which runs `CGO_ENABLED=1 go build -o ./bin/rdc-exporter
   ./cmd/rdc-exporter/main.go`. A line like `#NN DONE` after that step (and
   `naming to ${TAG} done` at the end) means success. Watch the log for
   `error`, `undefined:`, `cannot find`, `naming to`, or a non-zero exit.

4. **Confirm the image and contents.**

   ```bash
   docker images ${TAG}
   docker run --rm --entrypoint sh ${TAG} -c \
     "ls -l /opt/rdc-exporter/bin/rdc-exporter /opt/rdc-exporter/catalog-example.yaml"
   ```

   Expect the compiled binary and `catalog-example.yaml` (copied from
   `internal/config/catalog/catalog.yaml`) to be present.

5. **Full-project verification** (skip when `--no-verify` is set). The in-image
   `make` only builds `cmd/rdc-exporter`. To prove the entire module compiles —
   including `cmd/rdc-parser` and every package — run the `Makefile`'s verify
   target, which builds the cached builder stage and runs
   `go build ./...` / `go vet ./...` / `go test ./...` inside it, then cleans up:

   ```bash
   make image-verify
   ```

6. **Push** (only when `--push` is set, after a successful build):

   ```bash
   docker push ${TAG}
   ```

7. **Report.** State the final tag, ROCm version, image ID/size, the result of
   the `RUN make` compile step, and (unless `--no-verify`) the
   `go build`/`vet`/`test` outcome.

## Monitoring Long Builds

- Launch the build in the background and watch `/tmp/rdc_build.log` (or the
  terminal output file) rather than blocking the entire turn.
- Useful watch patterns: `naming to` and `writing image` (success);
  `^#\d+ ERROR`, `undefined:`, `cannot find`, `stream error`, `exited with`
  (failure).
- The first build (or one after a ROCm version bump) is slow because of the ROCm
  apt install; later builds reuse the cache and finish in seconds up to the
  `ADD . /opt/rdc-exporter` step.

### Retrying transient failures

`go mod tidy` (builder stage) downloads modules from `proxy.golang.org` and can
fail on a flaky network with `stream error ... INTERNAL_ERROR` (an HTTP/2 stream
reset, often on a large module such as `gonum`). This is **not** a code error.

- Re-run the **same** `make image`; the ROCm layers are cached, so it resumes
  quickly at `go mod tidy`. Retry up to ~3 times.
- If it keeps failing at the same module, force HTTP/1.1 for Go's downloads by
  adding `ENV GODEBUG=http2client=0` to the **builder** stage just before
  `RUN go mod tidy` in the `Dockerfile` (a small, reversible edit), then rebuild.
- If the network is down or the registry is unreachable, stop and report it — do
  not loop indefinitely.

## Troubleshooting

- **`go mod tidy` `stream error ... INTERNAL_ERROR`:** transient module-download
  failure — see "Retrying transient failures" above. Not a code problem.
- **`rdc.h` not found / cgo errors at `RUN make`:** a real compile error in the
  cgo layer — read the surrounding log lines and fix the Go/cgo code.
- **ROCm `.deb` 404 at the base stage:** the `ROCM_DEB` URL (in the `Makefile`)
  points at a version that does not exist at `repo.radeon.com`; fix `ROCM_DEB`
  and `ROCM_VERSION` in the `Makefile`.
- **`catalog.yaml` copy fails in the final stage:** the source path moved; the
  `Dockerfile` copies `/builder/internal/config/catalog/catalog.yaml`. Keep that
  path in sync with the catalog package location.
- **`UndefinedVar` warnings** for `$C_INCLUDE_PATH`, `$CMAKE_PREFIX_PATH`,
  `$CPLUS_INCLUDE_PATH`, `$LD_LIBRARY_PATH`: pre-existing, non-fatal; they do not
  block the build.

## Notes

- Run all commands from the repository root.
- `<date>` is always `YYYYMMDD`.
- ROCm/Go versions and the image tag are owned by the `Makefile`
  (`ROCM_VERSION`, `ROCM_DEB`, `GO_VERSION`, `IMAGE_TAG`); this skill never
  hardcodes them and only overrides via `make` variables when a flag is given.
