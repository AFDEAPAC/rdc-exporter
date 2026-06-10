// Language-neutral reference data: shell/YAML snippets, RDC field identifiers,
// release images, and reference tables. These values mirror the repository docs
// and source verbatim (README, docs/configuration, docs/deployment, docs/metrics,
// Makefile, cmd/rdc-exporter/main.go) and must not be paraphrased. Technical
// help text is kept in canonical English because it matches the metric HELP the
// exporter actually emits; narrative copy is localized in the locale modules.

/**
 * Most recent published container image reference.
 *
 * Mirrors the `latest`-flagged row in `releaseImages` and is the tag used in the
 * quickstart snippets; bump both together when a new image ships.
 */
export const LATEST_IMAGE = "ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.4-20260610";

/**
 * Canonical GitHub repository URL.
 *
 * Base for every in-repo link on the site (doc links in `DOCS`, the footer doc
 * tree links, and the nav/CTA GitHub buttons), so links resolve regardless of
 * where the static bundle is hosted.
 */
export const GITHUB_URL = "https://github.com/maple52046/rdc-exporter";

/** Canonical GitHub links to the authoritative guides this site summarizes. */
export const DOCS = {
  metrics: `${GITHUB_URL}/blob/main/docs/metrics.md`,
  deployment: `${GITHUB_URL}/blob/main/docs/deployment/k8s/README.md`,
  configuration: `${GITHUB_URL}/blob/main/docs/configuration/README.md`,
} as const;

/**
 * Language-neutral code samples rendered by `CodeBlock` across the sections.
 *
 * Each value is a verbatim shell / YAML / Prometheus example copied from the
 * repository docs and source (README, docs/configuration, docs/deployment,
 * Makefile, cmd/rdc-exporter). They are treated as canonical reference text, not
 * paraphrasable copy, and are intentionally not localized so a reader copies the
 * exact command. `as const` keeps each key a string literal type. Keys are
 * referenced by name in the sections, so renaming one is a breaking change.
 */
export const snippets = {
  dockerRun: `docker run -dit --name rdc-exporter \\
  --device=/dev/kfd \\
  --device=/dev/dri \\
  --cap-add SYS_PTRACE \\
  -p 5000:5000 \\
  ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.4-20260610

curl localhost:5000/metrics`,

  metricsOutput: `# HELP gpu_memory_usage Memory usage of the GPU instance
# TYPE gpu_memory_usage gauge
gpu_memory_usage{gpu_index="0"} 1335.6769279999999
gpu_memory_usage{gpu_index="1"} 1335.611392`,

  workloadOutput: `gpu_memory_usage{container="vllm",gpu_index="0",namespace="default",pod="vllm-qwen-..."} 287252.5`,

  fieldsInline: `rdc-exporter -e RDC_FI_GPU_CLOCK,812`,

  fieldsFile: `cat > metrics.txt <<EOF
RDC_FI_GPU_CLOCK
812
EOF

rdc-exporter -f metrics.txt`,

  gpuIndexes: `rdc-exporter -i 0,1`,

  scaleYaml: `metrics:
  - metric: RDC_FI_GPU_MEMORY_TOTAL
    scale: 1`,

  catalogRun: `rdc-exporter --catalog catalog.yml`,

  mergeYaml: `metrics:
  # rename + re-describe, keep the default unit conversion
  - metric: RDC_FI_GPU_TEMP
    prom_name: gpu_temperature_celsius
    desc: GPU edge temperature in Celsius
  # remove a metric from the effective catalog
  - metric: RDC_FI_GPU_CLOCK
    disabled: true`,

  overwriteYaml: `overwrite: true
metrics:
  - metric: RDC_FI_GPU_TEMP
    prom_name: gpu_temp
    field: "201"
    scale: 0.001
    desc: GPU temperature in Celsius`,

  k8sApply: `kubectl create namespace monitoring
kubectl -n monitoring apply -f example/rdc-exporter-daemonset.yml
curl localhost:5000/metrics`,

  daemonsetArgs: `args:
  - "-k"
  - "/var/lib/kubelet/pod-resources/kubelet.sock"
  - "-f"
  - "/etc/rdc-exporter/metrics.txt"
securityContext:
  privileged: true
  capabilities:
    add: ["SYS_PTRACE"]`,

  vllmVerify: `curl -s localhost:5000/metrics | grep 'pod="vllm-qwen'`,

  dcgmCsv: `DCGM_FI_DEV_GPU_TEMP, gauge, GPU temperature (in C).`,

  rdcCatalog: `metrics:
  - metric: RDC_FI_GPU_TEMP
    prom_name: gpu_temp
    field: "201"
    scale: 0.001          # milli-°C -> °C, handled here, not downstream
    desc: GPU temperature in Celsius`,

  rdcList: `RDC_FI_GPU_TEMP`,

  makeBuild: `make build
make image
make image-verify`,

  makeOverride: `make image \\
  ROCM_VERSION=7.2.4 \\
  ROCM_DEB=https://repo.radeon.com/amdgpu-install/7.2.4/ubuntu/noble/amdgpu-install_7.2.4.70204-1_all.deb \\
  GO_VERSION=1.26.4`,

  socketCheck: `# empty output means the default /var/lib/kubelet is used
ps -ewwo args | grep -o 'root-dir=[^ ]*'`,

  rolloutRestart: `kubectl -n monitoring edit configmap rdc-exporter-metrics
kubectl -n monitoring rollout restart daemonset/rdc-exporter`,

  workedCatalog: `# catalog.yaml — keep memory in raw bytes (merge mode)
metrics:
  - metric: RDC_FI_GPU_MEMORY_USAGE
    scale: 1`,

  workedList: `# metrics.txt — temperature, power, memory only
RDC_FI_GPU_TEMP
RDC_FI_POWER_USAGE
RDC_FI_GPU_MEMORY_USAGE`,

  workedRun: `rdc-exporter --catalog ./catalog.yaml -f ./metrics.txt`,

  fieldsCombined: `rdc-exporter -e 100,812,gpu_temp`,
} as const;

/**
 * One published container image row for the deployment release table.
 *
 * `image` is the full pullable reference, `rocm` the bundled ROCm version, and
 * `date` the build date (`YYYY-MM-DD`). `latest` marks the row rendered with the
 * "latest" badge; at most one row should set it.
 */
export interface ReleaseImage {
  image: string;
  rocm: string;
  date: string;
  latest?: boolean;
}

/**
 * Published images shown in the deployment release table, newest first.
 *
 * The rendered order is the array order; keep the newest (and the single
 * `latest` row) at the front. Must stay consistent with `LATEST_IMAGE`.
 */
export const releaseImages: ReleaseImage[] = [
  {
    image: "ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.4-20260610",
    rocm: "7.2.4",
    date: "2026-06-10",
    latest: true,
  },
  {
    image: "ghcr.io/maple52046/rdc-exporter:v1-rocm7.2.2-20260609",
    rocm: "7.2.2",
    date: "2026-06-09",
  },
];

/**
 * One row of the unit-scaling reference: how a raw RDC reading becomes the
 * exported Prometheus value.
 *
 * `prom` is the Prometheus name, `field` the numeric RDC field id, `rawUnit` the
 * unit RDC reports in, `scale` the multiplier the exporter applies (kept as a
 * string to render the literal catalog value, e.g. `"0.000001"`), and `unit` the
 * resulting human unit. The relationship is value = raw x scale.
 */
export interface ScaleRow {
  prom: string;
  field: string;
  rawUnit: string;
  scale: string;
  unit: string;
}

/**
 * Default scale/unit conversions shown in the Configuration section, mirrored
 * from the configuration guide.
 */
export const scaleRows: ScaleRow[] = [
  { prom: "gpu_clock", field: "100", rawUnit: "Hz", scale: "0.000001", unit: "MHz" },
  { prom: "gpu_temp", field: "201", rawUnit: "milli-°C", scale: "0.001", unit: "°C" },
  { prom: "power_usage", field: "300", rawUnit: "µW", scale: "0.000001", unit: "W" },
  { prom: "gpu_memory_usage", field: "501", rawUnit: "bytes", scale: "0.000001", unit: "MB" },
  { prom: "gpu_memory_total", field: "502", rawUnit: "bytes", scale: "0.000001", unit: "MB" },
];

/**
 * One CLI flag row for the configuration flag reference table.
 *
 * `flag` is the long form, `short` the single-letter alias (or `"—"` when none),
 * `def` the default value shown literally (`"—"` when there is no default), and
 * `purpose` a one-line description. The em dash placeholders are display
 * sentinels, not real values.
 */
export interface FlagRow {
  flag: string;
  short: string;
  def: string;
  purpose: string;
}

/** Documented `rdc-exporter` CLI flags, mirrored from the configuration guide. */
export const flagRows: FlagRow[] = [
  { flag: "--fields", short: "-e", def: "—", purpose: "Comma-separated field references to export." },
  { flag: "--fields-file", short: "-f", def: "—", purpose: "File with one field reference per line." },
  { flag: "--catalog", short: "—", def: "—", purpose: "Path to a catalog YAML file (merged onto the default)." },
  { flag: "--gpu-indexes", short: "-i", def: "all GPUs", purpose: "Comma-separated GPU indexes to scrape, e.g. 0,1,2." },
  { flag: "--listen-address", short: "-l", def: ":5000", purpose: "Address the /metrics endpoint listens on." },
  { flag: "--kubelet", short: "-k", def: "—", purpose: "kubelet pod-resources socket path for Pod/namespace/container labels." },
  { flag: "--debug", short: "-d", def: "false", purpose: "Enable debug logging." },
  { flag: "--self-monitoring", short: "—", def: "false", purpose: "Export Go/process self-metrics." },
];

/**
 * One distribution-to-socket-path mapping for the kubelet pod-resources table.
 *
 * `distro` names the Kubernetes distribution/setup and `path` is the host path
 * to its `kubelet.sock`, which rdc-exporter must hostPath-mount to resolve
 * Pod/namespace/container labels.
 */
export interface SocketRow {
  distro: string;
  path: string;
}

/** kubelet pod-resources socket paths by distribution (docs/deployment/k8s, 5.3). */
export const socketRows: SocketRow[] = [
  { distro: "Standard kubelet (e.g. kubeadm)", path: "/var/lib/kubelet/pod-resources/kubelet.sock" },
  { distro: "k0s", path: "/var/lib/k0s/kubelet/pod-resources/kubelet.sock" },
];

/**
 * One symptom-to-fix entry for the deployment troubleshooting matrix.
 *
 * `symptom` is the observable failure an operator sees; `fix` is the likely
 * cause and remediation. Both are canonical English copied from the guide.
 */
export interface TroubleRow {
  symptom: string;
  fix: string;
}

/** Troubleshooting matrix mirrored from docs/deployment/k8s (Section 7). */
export const troubleshootRows: TroubleRow[] = [
  {
    symptom: "Pod cannot schedule: Insufficient amd.com/gpu",
    fix: "The device-plugin is not deployed, or the node's allocatable.amd.com/gpu is 0. Deploying only the node-labeller is not enough.",
  },
  {
    symptom: "device-plugin / node-labeller / rdc-exporter Pods stay Pending",
    fix: "An untolerated node taint (common on single-node or control-plane nodes). Remove the taint or add a matching toleration.",
  },
  {
    symptom: "/metrics has only gpu_index, missing pod / namespace / container",
    fix: "The workload did not request GPUs through the device-plugin, or the pod-resources socket hostPath is wrong (see 5.3).",
  },
  {
    symptom: "rdc-exporter Pod is Running, but /metrics stops updating",
    fix: "Too many RDC_FI_PROF_* fields exceeded the GPU PMC packet limit. Reduce them and run rollout restart.",
  },
  {
    symptom: "No amd.com/gpu.* labels appear on the node",
    fix: "Confirm the node has an AMD GPU and driver (/dev/kfd exists) and that the node-labeller is privileged with /sys and /dev mounted.",
  },
];

/**
 * One field-reference form for the configuration reference table.
 *
 * `form` names the way a metric can be referenced and `example` is a concrete
 * value; the three forms are interchangeable when selecting fields (`-e`/`-f`).
 */
export interface RefForm {
  form: string;
  example: string;
}

/** The three interchangeable field-reference forms (docs/configuration, 2.1). */
export const refForms: RefForm[] = [
  { form: "RDC field enum name", example: "RDC_FI_GPU_CLOCK" },
  { form: "Numeric RDC field id", example: "100" },
  { form: "Prometheus name (prom_name)", example: "gpu_clock" },
];

/**
 * One catalog-entry field for the catalog reference table.
 *
 * `key` is the YAML key, `required` whether it is mandatory (kept as a string so
 * footnote markers like `"yes¹"` render), and `meaning` its semantics. Mirrors
 * the catalog schema in the configuration guide.
 */
export interface CatalogEntryRow {
  key: string;
  required: string;
  meaning: string;
}

/** Catalog entry reference (docs/configuration, 3.6). */
export const catalogEntryRows: CatalogEntryRow[] = [
  { key: "metric", required: "yes", meaning: "RDC field enum name, e.g. RDC_FI_GPU_TEMP. The stable key used to merge user entries onto the default." },
  { key: "field", required: "yes", meaning: "Numeric RDC field id as a string, e.g. \"201\"." },
  { key: "prom_name", required: "yes¹", meaning: "Exported Prometheus metric name, e.g. gpu_temp." },
  { key: "scale", required: "no", meaning: "Multiplier applied to the raw reading (default 1)." },
  { key: "desc", required: "no", meaning: "Prometheus HELP text." },
  { key: "disabled", required: "no", meaning: "When true, removes the metric from the effective catalog." },
];

/**
 * Recommended baseline telemetry fields (the 10 in the Kubernetes guide's
 * conservative set).
 *
 * Rendered as chips in the Metrics section to suggest a safe starting metric
 * list. These are always-available telemetry fields, distinct from the
 * profiling fields in `recommendedProfiling` that are subject to the PMC limit.
 */
export const recommendedTelemetry = [
  "RDC_FI_GPU_CLOCK",
  "RDC_FI_MEM_CLOCK",
  "RDC_FI_MEMORY_TEMP",
  "RDC_FI_GPU_TEMP",
  "RDC_FI_POWER_USAGE",
  "RDC_FI_GPU_UTIL",
  "RDC_FI_GPU_MEMORY_USAGE",
  "RDC_FI_GPU_MEMORY_TOTAL",
  "RDC_FI_ECC_CORRECT_TOTAL",
  "RDC_FI_ECC_UNCORRECT_TOTAL",
];

/**
 * Recommended baseline profiling fields (the 6 in the Kubernetes guide's
 * conservative set).
 *
 * Rendered as chips alongside `recommendedTelemetry`. Profiling fields consume
 * GPU PMC packets, so this list is deliberately small — adding too many
 * `RDC_FI_PROF_*` fields can exceed the packet limit and stall `/metrics`.
 */
export const recommendedProfiling = [
  "RDC_FI_PROF_OCCUPANCY_PERCENT",
  "RDC_FI_PROF_GPU_UTIL_PERCENT",
  "RDC_FI_PROF_TENSOR_ACTIVE_PERCENT",
  "RDC_FI_PROF_ACTIVE_CYCLES",
  "RDC_FI_PROF_ELAPSED_CYCLES",
  "RDC_FI_PROF_EVAL_FLOPS_16",
];

/**
 * UI filter bucket for a metric, derived from its RDC field-id range.
 *
 * This is a presentation-only grouping for the category chips in the Metrics
 * section (not an RDC concept); it does not map 1:1 to the doc's section
 * headings. Each value must have a matching color in `groupColor` and a label in
 * the locale dictionaries.
 */
export type MetricGroup = "core" | "pcie" | "ecc" | "xgmi" | "profiling" | "events" | "health";

/**
 * One RDC field row backing the full metrics table.
 *
 * `metric` is the RDC field enum name, `prom` the exported Prometheus name, `id`
 * the numeric field id, `help` the Prometheus HELP text (kept in canonical
 * English to match what the exporter emits), and `dcgm` the closest NVIDIA DCGM
 * field (`"—"` when there is no equivalent). `group` is the UI filter bucket and
 * `enabled` whether the field is in the default-enabled set.
 */
export interface MetricRow {
  metric: string;
  prom: string;
  id: string;
  help: string;
  dcgm: string;
  group: MetricGroup;
  /** true when the field is in the default-enabled set (Enable = Y in docs/metrics.md). */
  enabled: boolean;
}

/**
 * The complete RDC field catalog, transcribed verbatim from `docs/metrics.md`.
 *
 * This is the single source of truth for the Metrics table and its filters; the
 * UI never mutates it. `help`/`dcgm`/`id` are copied as-is from the doc table
 * (including the doc's own typos in HELP strings), `enabled` mirrors the Enable
 * column, and `group` is the derived UI bucket. Keep in sync with the doc when
 * fields change.
 */
export const metricRows: MetricRow[] = [
  { metric: "RDC_FI_GPU_CLOCK", prom: "gpu_clock", id: "100", help: "Current GPU clock frequencies", dcgm: "DCGM_FI_DEV_SM_CLOCK", group: "core", enabled: true },
  { metric: "RDC_FI_MEM_CLOCK", prom: "mem_clock", id: "101", help: "Current Memory clock frequencies", dcgm: "DCGM_FI_DEV_MEM_CLOCK", group: "core", enabled: true },
  { metric: "RDC_FI_MEMORY_TEMP", prom: "memory_temp", id: "200", help: "Memory temperature in millidegrees Celsius", dcgm: "DCGM_FI_DEV_MEMORY_TEMP", group: "core", enabled: true },
  { metric: "RDC_FI_GPU_TEMP", prom: "gpu_temp", id: "201", help: "GPU temperature in millidegrees Celsius", dcgm: "DCGM_FI_DEV_GPU_TEMP", group: "core", enabled: true },
  { metric: "RDC_FI_POWER_USAGE", prom: "power_usage", id: "300", help: "Power usage in microwatts", dcgm: "DCGM_FI_DEV_POWER_USAGE", group: "core", enabled: true },
  { metric: "RDC_FI_PCIE_TX", prom: "pcie_tx", id: "400", help: "PCIe Tx utilization in bytes/second", dcgm: "DCGM_FI_DEV_PCIE_TX_THROUGHPUT", group: "pcie", enabled: false },
  { metric: "RDC_FI_PCIE_RX", prom: "pcie_rx", id: "401", help: "PCIe Rx utilization in bytes/second", dcgm: "DCGM_FI_DEV_PCIE_RX_THROUGHPUT", group: "pcie", enabled: false },
  { metric: "RDC_FI_PCIE_BANDWIDTH", prom: "pcie_bandwidth", id: "403", help: "PCIe bandwidth in Mbps", dcgm: "—", group: "pcie", enabled: false },
  { metric: "RDC_FI_GPU_UTIL", prom: "gpu_util", id: "500", help: "GPU busy percentage", dcgm: "DCGM_FI_DEV_GPU_UTIL", group: "core", enabled: true },
  { metric: "RDC_FI_GPU_MEMORY_USAGE", prom: "gpu_memory_usage", id: "501", help: "Memory usage of the GPU instance in bytes", dcgm: "—", group: "core", enabled: true },
  { metric: "RDC_FI_GPU_MEMORY_TOTAL", prom: "gpu_memory_total", id: "502", help: "Total memory of the GPU instance", dcgm: "—", group: "core", enabled: true },
  { metric: "RDC_FI_GPU_MM_ENC_UTIL", prom: "gpu_mm_enc_util", id: "503", help: "Mutilmedia encoder busy percentage", dcgm: "DCGM_FI_DEV_ENC_UTIL", group: "core", enabled: false },
  { metric: "RDC_FI_GPU_MM_DEC_UTIL", prom: "gpu_mm_dec_util", id: "504", help: "Mutilmedia decoder busy percentage", dcgm: "DCGM_FI_DEV_DEC_UTIL", group: "core", enabled: false },
  { metric: "RDC_FI_GPU_MEMORY_ACTIVITY", prom: "gpu_mem_util", id: "505", help: "Memory busy percentage", dcgm: "DCGM_FI_DEV_MEM_COPY_UTIL", group: "core", enabled: false },
  { metric: "RDC_FI_GPU_MEMORY_MAX_BANDWIDTH", prom: "gpu_mem_max_bandwidth", id: "506", help: "Memory max bandwidth", dcgm: "—", group: "core", enabled: false },
  { metric: "RDC_FI_GPU_MEMORY_CUR_BANDWIDTH", prom: "gpu_mem_cur_bandwidth", id: "507", help: "Memory current bandwidth", dcgm: "—", group: "core", enabled: false },
  { metric: "RDC_FI_GPU_BUSY_PERCENT", prom: "gpu_busy_percent", id: "508", help: "GPU busy percentage", dcgm: "—", group: "core", enabled: false },
  { metric: "RDC_FI_GPU_PAGE_RETRIED", prom: "gpu_page_retried", id: "550", help: "Retried page of the GPU instance", dcgm: "—", group: "core", enabled: false },
  { metric: "RDC_FI_ECC_CORRECT_TOTAL", prom: "ecc_correct", id: "600", help: "Accumulated Single Error Correction", dcgm: "—", group: "ecc", enabled: true },
  { metric: "RDC_FI_ECC_UNCORRECT_TOTAL", prom: "ecc_uncorrect", id: "601", help: "Accumulated Double Error Detection", dcgm: "DCGM_FI_DEV_ECC_DBE_VOL_TOTAL", group: "ecc", enabled: true },
  { metric: "RDC_FI_ECC_SDMA_UE", prom: "ecc_sdma_ue", id: "604", help: "SDMA Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_GFX_CE", prom: "ecc_gfx_ce", id: "605", help: "GFX Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_GFX_UE", prom: "ecc_gfx_ue", id: "606", help: "GFX Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MMHUB_CE", prom: "ecc_mmhub_ce", id: "607", help: "MMHUB Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MMHUB_UE", prom: "ecc_mmhub_ue", id: "608", help: "MMHUB Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_ATHUB_CE", prom: "ecc_athub_ce", id: "609", help: "ATHUB Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_ATHUB_UE", prom: "ecc_athub_ue", id: "610", help: "ATHUB Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_PCIE_BIF_CE", prom: "ecc_pcie_bif_ce", id: "611", help: "PCIE_BIF Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_PCIE_BIF_UE", prom: "ecc_pcie_bif_ue", id: "612", help: "PCIE_BIF Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_HDP_CE", prom: "ecc_hdp_ce", id: "613", help: "HDP Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_HDP_UE", prom: "ecc_hdp_ue", id: "614", help: "HDP Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_XGMI_WAFL_CE", prom: "ecc_xgmi_wafl_ce", id: "615", help: "XGMI_WAFL Correctable Error", dcgm: "DCGM_FI_DEV_NVSWITCH_NON_FATAL_ERRORS", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_XGMI_WAFL_UE", prom: "ecc_xgmi_wafl_ue", id: "616", help: "XGMI_WAFL Uncorrectable Error", dcgm: "DCGM_FI_DEV_NVSWITCH_FATAL_ERRORS", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_DF_CE", prom: "ecc_df_ce", id: "617", help: "DF Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_DF_UE", prom: "ecc_df_ue", id: "618", help: "DF Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_SMN_CE", prom: "ecc_smn_ce", id: "619", help: "SMN Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_SMN_UE", prom: "ecc_smn_ue", id: "620", help: "SMN Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_SEM_CE", prom: "ecc_sem_ce", id: "621", help: "SEM Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_SEM_UE", prom: "ecc_sem_ue", id: "622", help: "SEM Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MP0_CE", prom: "ecc_mp0_ce", id: "623", help: "MP0 Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MP0_UE", prom: "ecc_mp0_ue", id: "624", help: "MP0 Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MP1_CE", prom: "ecc_mp1_ce", id: "625", help: "MP1 Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MP1_UE", prom: "ecc_mp1_ue", id: "626", help: "MP1 Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_FUSE_CE", prom: "ecc_fuse_ce", id: "627", help: "FUSE Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_FUSE_UE", prom: "ecc_fuse_ue", id: "628", help: "FUSE Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_UMC_CE", prom: "ecc_umc_ce", id: "629", help: "UMC Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_UMC_UE", prom: "ecc_umc_ue", id: "630", help: "UMC Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MCA_CE", prom: "ecc_mca_ce", id: "631", help: "MCA Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MCA_UE", prom: "ecc_mca_ue", id: "632", help: "MCA Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_VCN_CE", prom: "ecc_vcn_ce", id: "633", help: "VCN Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_VCN_UE", prom: "ecc_vcn_ue", id: "634", help: "VCN Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_JPEG_CE", prom: "ecc_jpeg_ce", id: "635", help: "JPEG Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_JPEG_UE", prom: "ecc_jpeg_ue", id: "636", help: "JPEG Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_IH_CE", prom: "ecc_ih_ce", id: "637", help: "IH Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_IH_UE", prom: "ecc_ih_ue", id: "638", help: "IH Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MPIO_CE", prom: "ecc_mpio_ce", id: "639", help: "MPIO Correctable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_ECC_MPIO_UE", prom: "ecc_mpio_ue", id: "640", help: "MPIO Uncorrectable Error", dcgm: "—", group: "ecc", enabled: false },
  { metric: "RDC_FI_XGMI_0_READ_KB", prom: "xgmi_0_read", id: "700", help: "XGMI0 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_1_READ_KB", prom: "xgmi_1_read", id: "701", help: "XGMI1 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_2_READ_KB", prom: "xgmi_2_read", id: "702", help: "XGMI2 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_3_READ_KB", prom: "xgmi_3_read", id: "703", help: "XGMI3 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_4_READ_KB", prom: "xgmi_4_read", id: "704", help: "XGMI4 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_5_READ_KB", prom: "xgmi_5_read", id: "705", help: "XGMI5 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_6_READ_KB", prom: "xgmi_6_read", id: "706", help: "XGMI6 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_7_READ_KB", prom: "xgmi_7_read", id: "707", help: "XGMI7 accumulated data read size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_0_WRITE_KB", prom: "xgmi_0_write", id: "708", help: "XGMI0 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_1_WRITE_KB", prom: "xgmi_1_write", id: "709", help: "XGMI1 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_2_WRITE_KB", prom: "xgmi_2_write", id: "710", help: "XGMI2 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_3_WRITE_KB", prom: "xgmi_3_write", id: "711", help: "XGMI3 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_4_WRITE_KB", prom: "xgmi_4_write", id: "712", help: "XGMI4 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_5_WRITE_KB", prom: "xgmi_5_write", id: "713", help: "XGMI5 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_6_WRITE_KB", prom: "xgmi_6_write", id: "714", help: "XGMI6 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_7_WRITE_KB", prom: "xgmi_7_write", id: "715", help: "XGMI7 accumulated data write size (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_TOTAL_READ_KB", prom: "xgmi_total_read", id: "716", help: "XGMI accumlated data read size across all lanes (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_XGMI_TOTAL_WRITE_KB", prom: "xgmi_total_write", id: "717", help: "XGMI accumlated data write size across all lanes (KB)", dcgm: "—", group: "xgmi", enabled: false },
  { metric: "RDC_FI_PROF_OCCUPANCY_PERCENT", prom: "occupancy_percent", id: "800", help: "Percent of GPU occupancy", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_ACTIVE_CYCLES", prom: "active_cycles", id: "801", help: "Number of Active Cycles", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_ACTIVE_WAVES", prom: "active_waves", id: "802", help: "Number of Active Waves", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_ELAPSED_CYCLES", prom: "elapsed_cycles", id: "803", help: "Number of Elapsed Cycles over all SMs", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_TENSOR_ACTIVE_PERCENT", prom: "tensor_percent", id: "804", help: "Percent of Active Pipe Tensors", dcgm: "DCGM_FI_PROF_PIPE_TENSOR_ACTIVE", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_GPU_UTIL_PERCENT", prom: "gpu_util_percent", id: "805", help: "Percent of GPU Utilization", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_MEM_R_BW", prom: "mem_r_bw", id: "806", help: "Fetched from video memory kb / ms", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_MEM_W_BW", prom: "mem_w_bw", id: "807", help: "Written to video memory kb / ms", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_FLOPS_16", prom: "flops_16", id: "808", help: "Number of fp16 OPS / ms", dcgm: "AMPF_FI_FROF_FP16_TFPS_USED", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_FLOPS_32", prom: "flops_32", id: "809", help: "Number of fp32 OPS / ms", dcgm: "AMPF_FI_FROF_FP32_TFPS_USED", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_FLOPS_64", prom: "flops_64", id: "810", help: "Number of fp64 OPS / ms", dcgm: "AMPF_FI_FROF_FP64_TFPS_USED", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_VALU_PIPE_ISSUE_UTIL", prom: "valu_utilization", id: "811", help: "Percent of Active Pipe VALU", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_SM_ACTIVE", prom: "valubusy", id: "812", help: "Ratio of Cycles with active warp on SM", dcgm: "DCGM_FI_PROF_SM_ACTIVE", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_OCC_PER_ACTIVE_CU", prom: "occ_cu", id: "813", help: "Mean occ per active compute unit", dcgm: "DCGM_FI_PROF_SM_OCCUPANCY", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_OCC_ELAPSED", prom: "occ_cu_elapsed", id: "814", help: "Mean occ per active cu over elapsed", dcgm: "—", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_FLOPS_16_PERCENT", prom: "flops_16_percent", id: "815", help: "Number of fp16 OPS percent of max", dcgm: "DCGM_FI_PROF_PIPE_FP16_ACTIVE", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_FLOPS_32_PERCENT", prom: "flops_32_percent", id: "816", help: "Number of fp32 OPS percent of max", dcgm: "DCGM_FI_PROF_PIPE_FP32_ACTIVE", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_EVAL_FLOPS_64_PERCENT", prom: "flops_64_percent", id: "817", help: "Number of fp64 OPS percent of max", dcgm: "DCGM_FI_PROF_PIPE_FP64_ACTIVE", group: "profiling", enabled: true },
  { metric: "RDC_FI_PROF_CPC_CPC_STAT_BUSY", prom: "cpc_cpc_stat_busy", id: "818", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_STAT_IDLE", prom: "cpc_cpc_stat_idle", id: "819", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_STAT_STALL", prom: "cpc_cpc_stat_stall", id: "820", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_TCIU_BUSY", prom: "cpc_cpc_tciu_busy", id: "821", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_TCIU_IDLE", prom: "cpc_cpc_tciu_idle", id: "822", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_UTCL2IU_BUSY", prom: "cpc_cpc_utcl2iu_busy", id: "823", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_UTCL2IU_IDLE", prom: "cpc_cpc_utcl2iu_idle", id: "824", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CPC_UTCL2IU_STALL", prom: "cpc_cpc_utcl2iu_stall", id: "825", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_ME1_BUSY_FOR_PACKET_DECODE", prom: "cpc_me1_busy_for_packet_decode", id: "826", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_ME1_DC0_SPI_BUSY", prom: "cpc_me1_dc0_spi_busy", id: "827", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_UTCL1_STALL_ON_TRANSLATION", prom: "cpc_utcl1_stall_on_translation", id: "828", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_ALWAYS_COUNT", prom: "cpc_always_count", id: "829", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_ADC_VALID_CHUNK_NOT_AVAIL", prom: "cpc_adc_valid_chunk_not_avail", id: "830", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_ADC_DISPATCH_ALLOC_DONE", prom: "cpc_adc_dispatch_alloc_done", id: "831", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_ADC_VALID_CHUNK_END", prom: "cpc_adc_valid_chunk_end", id: "832", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_SYNC_FIFO_FULL_LEVEL", prom: "cpc_sync_fifo_full_level", id: "833", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_SYNC_FIFO_FULL", prom: "cpc_sync_fifo_full", id: "834", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_GD_BUSY", prom: "cpc_gd_busy", id: "835", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_TG_SEND", prom: "cpc_tg_send", id: "836", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_WALK_NEXT_CHUNK", prom: "cpc_walk_next_chunk", id: "837", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_STALLED_BY_SE0_SPI", prom: "cpc_stalled_by_se0_spi", id: "838", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_STALLED_BY_SE1_SPI", prom: "cpc_stalled_by_se1_spi", id: "839", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_STALLED_BY_SE2_SPI", prom: "cpc_stalled_by_se2_spi", id: "840", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_STALLED_BY_SE3_SPI", prom: "cpc_stalled_by_se3_spi", id: "841", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_LTE_ALL", prom: "cpc_lte_all", id: "842", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_SYNC_WRREQ_FIFO_BUSY", prom: "cpc_sync_wrreq_fifo_busy", id: "843", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CANE_BUSY", prom: "cpc_cane_busy", id: "844", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPC_CANE_STALL", prom: "cpc_cane_stall", id: "845", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CMP_UTCL1_STALL_ON_TRANSLATION", prom: "cpf_cmp_utcl1_stall_on_translation", id: "846", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CPF_STAT_BUSY", prom: "cpf_cpf_stat_busy", id: "847", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CPF_STAT_IDLE", prom: "cpf_cpf_stat_idle", id: "848", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CPF_STAT_STALL", prom: "cpf_cpf_stat_stall", id: "849", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CPF_TCIU_BUSY", prom: "cpf_cpf_tciu_busy", id: "850", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CPF_TCIU_IDLE", prom: "cpf_cpf_tciu_idle", id: "851", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_CPF_CPF_TCIU_STALL", prom: "cpf_cpf_tciu_stall", id: "852", help: "—", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_SIMD_UTILIZATION", prom: "simd_utilization", id: "853", help: "Fraction of time the SIMDs are being utilized", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_FI_PROF_KFD_ID", prom: "prof_kfd_id", id: "854", help: "GPU_ID from rocprofiler, same as KFD_ID", dcgm: "—", group: "profiling", enabled: false },
  { metric: "RDC_EVNT_XGMI_0_NOP_TX", prom: "xgmi_nop_0", id: "1000", help: "NOPs sent to neighbor 0", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_0_REQ_TX", prom: "xgmi_req_0", id: "1001", help: "Outgoing requests to neighbor 0", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_0_RESP_TX", prom: "xgmi_res_0", id: "1002", help: "Outgoing responses to neighbor 0", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_0_BEATS_TX", prom: "xgmi_bts_0", id: "1003", help: "Data sent to neighbor 0 (32 byte pkts)", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_1_NOP_TX", prom: "xgmi_nop_1", id: "1004", help: "NOPs sent to neighbor 1", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_1_REQ_TX", prom: "xgmi_req_1", id: "1005", help: "Outgoing requests to neighbor 1", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_1_RESP_TX", prom: "xgmi_res_1", id: "1006", help: "Outgoing responses to neighbor 1", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_1_BEATS_TX", prom: "xgmi_bts_1", id: "1007", help: "Data sent to neighbor 1 (32 byte pkts)", dcgm: "DCGM_FI_PROF_NVLINK_TX_BYTES", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_0_THRPUT", prom: "xgmi_0_t", id: "1500", help: "Tx throughput to XGMI neighbor 0 in b/s", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_1_THRPUT", prom: "xgmi_1_t", id: "1501", help: "Tx throughput to XGMI neighbor 1 in b/s", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_2_THRPUT", prom: "xgmi_2_t", id: "1502", help: "Tx throughput to XGMI neighbor 2 in b/s", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_3_THRPUT", prom: "xgmi_3_t", id: "1503", help: "Tx throughput to XGMI neighbor 3 in b/s", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_4_THRPUT", prom: "xgmi_4_t", id: "1504", help: "Tx throughput to XGMI neighbor 4 in b/s", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_XGMI_5_THRPUT", prom: "xgmi_5_t", id: "1505", help: "Tx throughput to XGMI neighbor 5 in b/s", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_VMFAULT", prom: "vm_page_fault", id: "2000", help: "VM page fault", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_THERMAL_THROTTLE", prom: "thermal_throt", id: "2002", help: "Clk freq decrease due to temp", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_PRE_RESET", prom: "gpu_pre_reset", id: "2003", help: "GPU reset is about to occur", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_POST_RESET", prom: "gpu_post_reset", id: "2004", help: "GPU reset just occurred", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_MIGRATE_START", prom: "migrate_start", id: "2005", help: "GPU migrate has started", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_MIGRATE_END", prom: "migrate_end", id: "2006", help: "GPU migrate has ended", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_PAGE_FAULT_START", prom: "page_fault_start", id: "2007", help: "GPU page fault started", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_PAGE_FAULT_END", prom: "page_fault_end", id: "2008", help: "GPU page fault ended", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_QUEUE_EVICTION", prom: "queue_evicition", id: "2009", help: "GPU queue eviction occured", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_QUEUE_RESTORE", prom: "queue_restore", id: "2010", help: "GPU queue restore occured", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_UNMAP_FROM_GPU", prom: "unmap_from_gpu", id: "2011", help: "GPU unmap occured", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_PROCESS_START", prom: "process_start", id: "2012", help: "GPU process started", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_EVNT_NOTIF_PROCESS_END", prom: "process_end", id: "2013", help: "GPU process ended", dcgm: "—", group: "events", enabled: false },
  { metric: "RDC_HEALTH_XGMI_ERROR", prom: "xgmi_error", id: "3000", help: "XGMI one or more errors detected", dcgm: "—", group: "health", enabled: false },
  { metric: "RDC_HEALTH_PCIE_REPLAY_COUNT", prom: "pcie_replay_count", id: "3001", help: "Total PCIE replay count", dcgm: "DCGM_FI_DEV_PCIE_REPLAY_COUNTER", group: "health", enabled: false },
  { metric: "RDC_HEALTH_RETIRED_PAGE_NUM", prom: "retired_page_num", id: "3002", help: "Retired page number", dcgm: "DCGM_FI_DEV_RETIRED_DBE", group: "health", enabled: true },
  { metric: "RDC_HEALTH_PENDING_PAGE_NUM", prom: "pending_page_num", id: "3003", help: "Pending page number", dcgm: "DCGM_FI_DEV_RETIRED_PENDING", group: "health", enabled: false },
  { metric: "RDC_HEALTH_RETIRED_PAGE_LIMIT", prom: "retired_page_limit", id: "3004", help: "Retired page limit", dcgm: "—", group: "health", enabled: false },
  { metric: "RDC_HEALTH_EEPROM_CONFIG_VALID", prom: "eeprom_config_valid", id: "3005", help: "Verify checksum of EEPROM", dcgm: "—", group: "health", enabled: false },
  { metric: "RDC_HEALTH_POWER_THROTTLE_TIME", prom: "power_throttle_time", id: "3006", help: "Power throttle status counter", dcgm: "DCGM_FI_DEV_POWER_VIOLATION", group: "health", enabled: false },
  { metric: "RDC_HEALTH_THERMAL_THROTTLE_TIME", prom: "thermal_throttle_time", id: "3007", help: "Total time(ms) in thermal throttle status", dcgm: "DCGM_FI_DEV_THERMAL_VIOLATION", group: "health", enabled: false },
];
