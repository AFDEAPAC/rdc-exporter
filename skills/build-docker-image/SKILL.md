# Build Docker Image

Build the `rdc-exporter` container image from the repository `Dockerfile` to
verify that the code — including the cgo layer that binds the ROCm/RDC C library
— compiles cleanly against the real `rdc.h` headers, which are **not** available
on the local host.

Run all commands from the repository root.

## Why This Skill Exists

The inner Go layers (domain, use case, catalog, Prometheus sink) build and test
on any host. The cgo packages cannot: `internal/bindings/rdc`,
`internal/adapter/rdcsource`, and `cmd/rdc-exporter` need
`/opt/rocm/include/rdc/rdc.h`, which only exists inside the ROCm image. Building
the Docker image is therefore the canonical way to prove the **whole** project
compiles.

## When to Use This Skill

Read this skill when the task asks to build the Docker image, produce a release
image, or verify that the code compiles via Docker — especially when the user
runs `/build-docker-image`.

## Invocation

```
/build-docker-image [--date <YYYYMMDD>] [--tag <full-tag>] [--no-verify] [--push]
```

| Flag | Required | Values | Default |
| --- | --- | --- | --- |
| `--date <YYYYMMDD>` | no | date stamp | today's date |
| `--tag <full-tag>` | no | full image reference | `ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.2-<date>` |
| `--no-verify` | no | flag (no value) | off (full verify runs) |
| `--push` | no | flag (no value) | off |

Behavior of the flags:

- **Default (no flags):** build the image tagged
  `ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.2-<date>` (where `<date>` is today
  as `YYYYMMDD`), pass `BUILD_DATE=<date>`, monitor the build, confirm the image
  and its contents, then run the full-project verification step.
- `--date <YYYYMMDD>`: override the date stamp used in both the tag suffix and
  the `BUILD_DATE` build-arg.
- `--tag <full-tag>`: use this exact image reference instead of the default
  naming convention. `BUILD_DATE` still uses `--date` (or today).
- `--no-verify`: build the image only; skip the extra `go build ./...` /
  `go vet ./...` / `go test ./...` pass in the builder stage.
- `--push`: run `docker push <tag>` after a successful build (requires the user
  to be authenticated to the registry).

## Naming Convention

The tag pattern is fixed:

```
ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.2-<YYYYMMDD>
```

- `v1` — image schema version.
- `rocm7.2.2` — the ROCm base version (matches `Dockerfile` `ROCM_VERSION`).
- `<YYYYMMDD>` — build date; also passed as `BUILD_DATE` so it lands in the
  `org.opencontainers.image.version` label.

The `Makefile` `image` target builds a similar tag without the
`ghcr.io/maple52046` prefix and without `BUILD_DATE`; prefer the explicit
`docker build` below so the registry prefix and version label are correct.

## Steps

1. **Resolve date and tag.** Set `DATE` from `--date` or today (`date +%Y%m%d`).
   Set `TAG` from `--tag`, else
   `ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.2-${DATE}`. Confirm `docker` is
   available (`docker version`).

2. **Build the image.** This is long-running (first build pulls Ubuntu, installs
   ROCm ~7 min, downloads Go, then compiles). Run it in the background and
   monitor; do not block the whole turn on it.

   ```bash
   docker build --build-arg BUILD_DATE=${DATE} -t ${TAG} . 2>&1 | tee /tmp/rdc_build.log
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

5. **Full-project verification** (skip when `--no-verify` is set). `make` only
   builds `cmd/rdc-exporter`. To prove the entire module compiles — including
   `cmd/rdc-parser` and every package — reuse the cached builder stage:

   ```bash
   docker build --target builder -t rdc-exporter-builder:tmp .
   docker run --rm rdc-exporter-builder:tmp sh -c \
     "cd /opt/rdc-exporter && CGO_ENABLED=1 go build ./... && CGO_ENABLED=1 go vet ./... && CGO_ENABLED=1 go test ./..."
   ```

   The first `docker build --target builder` is near-instant when the full build
   already populated the cache. Then remove the temp image:

   ```bash
   docker rmi rdc-exporter-builder:tmp
   ```

6. **Push** (only when `--push` is set, after a successful build):

   ```bash
   docker push ${TAG}
   ```

7. **Report.** State the final tag, image ID/size, the result of the `RUN make`
   compile step, and (unless `--no-verify`) the `go build`/`vet`/`test` outcome.

## Monitoring Long Builds

- Launch the build in the background and watch `/tmp/rdc_build.log` (or the
  terminal output file) rather than blocking the entire turn.
- Useful watch patterns: `naming to` and `writing image` (success);
  `^#\d+ ERROR`, `undefined:`, `cannot find`, `exited with` (failure).
- The first build is slow because of the ROCm apt install; later builds reuse
  the cache and finish in seconds up to the `ADD . /opt/rdc-exporter` step.

## Troubleshooting

- **`rdc.h` not found / cgo errors at `RUN make`:** a real compile error in the
  cgo layer — read the surrounding log lines and fix the Go/cgo code.
- **`catalog.yaml` copy fails in the final stage:** the source path moved; the
  `Dockerfile` copies `/builder/internal/config/catalog/catalog.yaml`. Keep that
  path in sync with the catalog package location.
- **`UndefinedVar` warnings** for `$C_INCLUDE_PATH`, `$CMAKE_PREFIX_PATH`,
  `$CPLUS_INCLUDE_PATH`, `$LD_LIBRARY_PATH`: pre-existing, non-fatal; they do not
  block the build.

## Notes

- Run all commands from the repository root.
- `<date>` is always `YYYYMMDD`.
- ROCm base version lives in `Dockerfile` (`ROCM_VERSION`, default `7.2.2`); if it
  changes, update the `rocm7.2.2` segment of the tag to match.
