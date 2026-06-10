import type { Content } from "./types";

/**
 * English locale dictionary. The source-of-truth implementation of the
 * {@link Content} contract that the other locales are translated against.
 */
export const en: Content = {
  langName: "English",

  nav: {
    purpose: "Purpose",
    architecture: "How it works",
    deployment: "Deployment",
    configuration: "Configuration",
    vsNvidia: "vs NVIDIA",
    metrics: "Metrics",
    building: "Building",
  },

  hero: {
    eyebrow: "Prometheus exporter for AMD GPUs",
    titleLead: "RDC",
    titleAccent: "Exporter",
    tagline:
      "A Prometheus exporter for AMD GPUs. It uses the ROCm Data Center Tool (RDC) to collect GPU metrics and exposes them on /metrics — and on Kubernetes it attaches workload labels such as namespace, pod, and container.",
    ctaQuickstart: "Quickstart",
    ctaDocs: "Documentation",
    ctaGithub: "GitHub",
    stats: [
      { title: "ROCm RDC", desc: "Metric source" },
      { title: "/metrics", desc: "Prometheus endpoint" },
      { title: "Kubernetes", desc: "Workload attribution" },
      { title: "Zero config", desc: "Sensible defaults out of the box" },
    ],
  },

  purpose: {
    kicker: "Purpose",
    title: "GPU observability for the AMD stack",
    intro:
      "RDC Exporter turns raw AMD GPU telemetry and profiling counters into Prometheus metrics. It runs next to your GPUs, reads fields through the ROCm Data Center Tool, scales them into friendly units, and serves them on a single /metrics endpoint your monitoring stack already understands.",
    cards: [
      {
        title: "Collect through RDC",
        desc: "Reads GPU fields — clocks, temperature, power, utilization, memory, ECC, and profiling counters — via the ROCm Data Center Tool, refreshed on a fixed five-second cadence.",
      },
      {
        title: "Expose to Prometheus",
        desc: "Every selected field becomes a Prometheus gauge on /metrics. gpu_index is always the first label, so each series maps to one device.",
      },
      {
        title: "Attribute to workloads",
        desc: "On Kubernetes it queries the kubelet pod-resources API and attaches namespace, pod, and container labels to the GPUs a workload actually uses.",
      },
      {
        title: "Sensible defaults",
        desc: "A complete default catalog is compiled into the binary and a default field selection ships out of the box, so it produces useful metrics with zero configuration.",
      },
    ],
    outputCaption: "Example /metrics output on a GPU node",
    workloadNote:
      "When a workload requests GPUs through the AMD device-plugin, the same series gains namespace, pod, and container labels:",
  },

  architecture: {
    kicker: "How it works",
    title: "From RDC fields to a /metrics endpoint",
    intro:
      "RDC Exporter is a single Go binary that runs next to your GPUs. On every scrape it reads raw fields through the ROCm Data Center Tool, scales them into friendly units, attaches workload labels, and publishes the result on /metrics.",
    flowTitle: "The collection cycle",
    flowDesc:
      "Once per scrape interval the exporter runs a single collection pass. Each stage is independent and testable with in-memory fakes — no GPU, RDC library, or Prometheus registry required.",
    flowSteps: [
      { title: "Read samples", desc: "The RDC reader returns one raw, unscaled sample per (GPU, field)." },
      { title: "Refresh labels", desc: "The optional kubelet labeler updates its GPU-to-workload mapping." },
      { title: "Scale + label", desc: "Each reading is multiplied by its scale and assembled into labeled points." },
      { title: "Publish", desc: "The Prometheus sink updates the series; /metrics serves the result." },
    ],
  },

  deployment: {
    kicker: "Deployment",
    title: "From a single docker run to a Kubernetes DaemonSet",
    intro:
      "Start it on one GPU node with Docker, or roll it out cluster-wide as a DaemonSet. Official images are published to GitHub Container Registry (GHCR) and pinned to a ROCm version.",
    dockerTitle: "Quickstart on a GPU node",
    dockerDesc:
      "Expose the GPU devices, add SYS_PTRACE for RDC profiling, publish port 5000, and scrape /metrics.",
    k8sTitle: "Kubernetes",
    k8sDesc:
      "rdc-exporter runs as a DaemonSet on every GPU node. A ConfigMap provides the metric list, and the kubelet pod-resources socket is mounted so metrics can be attributed to Pods. hostNetwork exposes /metrics on the node's port 5000.",
    k8sComponents: [
      {
        title: "node-labeller",
        desc: "Labels nodes from their AMD GPU attributes (beta.amd.com/gpu.*) so selectors can target GPU nodes. It only manages labels.",
      },
      {
        title: "device-plugin",
        desc: "Registers GPUs as the schedulable resource amd.com/gpu so workloads can request them via resources.limits.",
      },
      {
        title: "rdc-exporter",
        desc: "Queries the GPU-to-Pod mapping over the kubelet pod-resources interface. A workload must request amd.com/gpu before its metrics gain pod labels.",
      },
    ],
    imagesTitle: "Release images",
    imagesNote: "Official release images on GHCR:",
    tagFormat: "Tag format: v1-rocm<ROCm-version>-<YYYYMMDD>",
    vllmTitle: "Verify with a real workload",
    vllmDesc:
      "Deploy a vLLM inference service that requests one GPU through the device-plugin, then confirm the exporter attaches the Pod's labels to its GPU series.",
    prereqTitle: "Prerequisites",
    prereqs: [
      { title: "Kubernetes cluster", desc: "A working cluster reachable with kubectl." },
      { title: "pod-resources API", desc: "The kubelet socket exists on every GPU node (path varies by distribution)." },
      { title: "amd64 GPU nodes", desc: "AMD GPUs with the amdgpu driver; /dev/kfd and /dev/dri present." },
    ],
    guideTitle: "Step-by-step rollout",
    guideDesc:
      "The end-to-end path on an existing cluster, from prerequisite components to verified Pod attribution.",
    guideSteps: [
      { title: "Deploy node-labeller & device-plugin", desc: "Apply the official ROCm/k8s-device-plugin manifests so GPU nodes get labels and amd.com/gpu becomes schedulable." },
      { title: "Set the metric list", desc: "Provide the RDC fields to collect through the rdc-exporter-metrics ConfigMap, mounted as metrics.txt." },
      { title: "Match the pod-resources socket", desc: "Point the DaemonSet's hostPath at the node's actual kubelet socket so GPUs can be mapped to Pods." },
      { title: "Deploy & verify", desc: "Create the monitoring namespace, apply the DaemonSet, then curl node:5000/metrics." },
      { title: "Confirm Pod attribution", desc: "Run a workload that requests amd.com/gpu and check its GPU series gain pod, namespace, and container labels." },
    ],
    socketTitle: "pod-resources socket path",
    socketDesc:
      "rdc-exporter maps GPUs to Pods through the kubelet pod-resources socket. The hostPath must match the node's actual kubelet root-dir, which varies by distribution. Confirm it on the node (empty output means the default is used):",
    socketColDistro: "Distribution",
    socketColPath: "Socket path on the node",
    troubleshootTitle: "Troubleshooting",
    troubleshootColSymptom: "Symptom",
    troubleshootColFix: "Likely cause and fix",
    fullGuide: "Read the full Kubernetes deployment guide",
  },

  configuration: {
    kicker: "Configuration",
    title: "Two layers: a dictionary and a selection",
    intro:
      "Configuration is split into two independent layers. The catalog is the dictionary that defines what each metric is — its Prometheus name, HELP text, RDC field id, and unit (scale). The metric list is the selection that decides which of those metrics you actually publish.",
    twoLayerTitle: "The model",
    twoLayer: [
      {
        title: "Catalog — the dictionary",
        desc: "Every metric's identity and unit. A complete default catalog is embedded in the binary; --catalog merges your overrides on top (or replaces it in overwrite mode).",
      },
      {
        title: "Metric list — the selection",
        desc: "The subset to publish, set with -e/--fields or -f/--fields-file. Reference a metric by its enum name, numeric field id, or Prometheus name.",
      },
    ],
    orderTitle: "Startup order",
    order: [
      "Load the catalog: start from the embedded default, then merge --catalog (or overwrite).",
      "Apply the metric list: keep only the fields selected by -e and -f, or a built-in default.",
      "Publish: each metric is a gauge where published value = raw RDC reading × scale.",
    ],
    refTitle: "Selecting metrics: field references",
    refDesc:
      "Each entry in the metric list selects one metric from the catalog. Reference it by any of these three forms — all resolve to the same metric. A reference that matches no catalog entry is silently ignored, which is why # lines act as comments.",
    refColForm: "Reference form",
    refColExample: "Example",
    scaleTitle: "Unit scaling",
    scaleDesc:
      "Each reading is converted with a single multiplication before publishing. A scale of 1 (or any value ≤ 0, normalized to 1) leaves the raw value untouched; a fractional scale re-bases into a friendlier unit. The default catalog already does the common conversions:",
    scaleTableTitle: "Default unit conversions",
    mergeTitle: "Merge vs. overwrite",
    mergeDesc:
      "By default your --catalog is overlaid on the default field by field, so you only list what you change. Add overwrite: true to replace the catalog entirely.",
    mergeMode: "Merge (default): overlay only the fields you change",
    overwriteMode: "Overwrite: your list becomes the entire catalog",
    entryTitle: "Catalog entry reference",
    entryDesc:
      "Each catalog entry is keyed by its RDC metric name. In merge mode only the fields you change are required; in overwrite mode metric, prom_name, and field are all mandatory.",
    entryColKey: "Key",
    entryColReq: "Required",
    entryColMeaning: "Meaning",
    exampleTitle: "Worked example: temperature, power, memory in bytes",
    exampleDesc:
      "Export only temperature, power, and memory usage; keep °C and W defaults, but report memory in raw bytes by overriding just that one scale in a merged catalog.",
    flagsTitle: "Configuration CLI flags",
    fullGuide: "Read the full configuration guide",
  },

  vsNvidia: {
    kicker: "vs NVIDIA",
    title: "How it differs from the DCGM exporter",
    intro:
      "Coming from the NVIDIA stack, the mental model is different. The DCGM exporter uses a single CSV that mixes selection, naming, and help text. RDC Exporter splits these concerns into a catalog (definition + units) and a metric list (selection).",
    colNvidia: "NVIDIA DCGM exporter",
    colRdc: "RDC Exporter",
    rows: [
      { aspect: "Config artifact", nvidia: "One CSV (e.g. default-counters.csv)", rdc: "Catalog YAML (optional) + metric list" },
      { aspect: "What the file does", nvidia: "Selects fields and sets type/help together", rdc: "Catalog = identity + unit; list = selection, kept separate" },
      { aspect: "Metric name", nvidia: "The DCGM field name (CSV's first column)", rdc: "Configurable prom_name, with sensible defaults" },
      { aspect: "Unit conversion", nvidia: "Not in the CSV; done later in rules / Grafana", rdc: "Configured in the catalog; formatted before it is exported" },
      { aspect: "Works with no config", nvidia: "Needs a counters CSV", rdc: "Yes — embedded default catalog + selection" },
      { aspect: "Toggle a metric", nvidia: "Edit the CSV", rdc: "Edit the metric list" },
      { aspect: "Add a non-default field", nvidia: "Add a CSV row", rdc: "Add a catalog entry, then select it" },
    ],
    whyTitle: "Why the split?",
    whyDesc:
      "Selection changes often and is operational — which metrics do I want on this cluster right now? Names and units are stable definitions. Keeping them apart means you flip metrics on and off with a tiny list (or a ConfigMap) without restating names or units, and you re-base a unit exactly once, in the catalog, instead of patching every dashboard and recording rule.",
    mappingNote:
      "Many RDC fields map to a DCGM equivalent — for example RDC_FI_GPU_TEMP ↔ DCGM_FI_DEV_GPU_TEMP and RDC_FI_PROF_SM_ACTIVE ↔ DCGM_FI_PROF_SM_ACTIVE — making migration of dashboards straightforward.",
  },

  metrics: {
    kicker: "Metrics",
    title: "Telemetry and profiling, in two flavors",
    intro:
      "Fields fall into two categories with very different collection costs. Choose what you need; the exporter scales and labels each one for you.",
    telemetryTitle: "Telemetry",
    telemetryDesc:
      "Clocks, temperature, power, utilization, memory, and ECC — sourced from amd-smi / sysfs. Low collection cost and no hardware limit on the count.",
    profilingTitle: "Profiling",
    profilingDesc:
      "RDC_FI_PROF_* fields map to GPU hardware performance counters (PMC). They are powerful but the number collected at once is bounded by a hardware packet limit.",
    defaultTitle: "Verified default selection",
    defaultDesc:
      "A conservative, verified combination from the Kubernetes guide: 10 telemetry + 6 profiling fields that collect reliably together.",
    caveatTitle: "Profiling PMC packet limit",
    caveatDesc:
      "Profiling counters are packed into a single PMC packet. Requesting too many at once can exceed the GPU's packet capacity and make the RDC profiling layer abort in a worker thread — the process keeps running and /metrics keeps serving the last (stale) snapshot, so the failure is hard to spot.",
    caveatList: [
      "Add telemetry fields freely; they have no hardware limit.",
      "Start with a few profiling fields and add gradually, verifying as you go.",
      "On MI355X (gfx950), 6 profiling fields work reliably; ~18 triggers the error.",
      "It is a counter-packing limit, not a permissions issue — privileges and perf_event_paranoid do not fix it.",
    ],
    tableTitle: "Complete RDC metric list",
    tableHint: "Every field the catalog knows about. Filter by category, or show only the default-enabled set.",
    colMetric: "RDC field",
    colProm: "Prometheus name",
    colId: "Field ID",
    colHelp: "Help",
    colDcgm: "DCGM equivalent",
    colEnable: "Default",
    filterAll: "All",
    groupCore: "Core",
    groupPcie: "PCIe",
    groupEcc: "ECC",
    groupXgmi: "XGMI",
    groupProfiling: "Profiling",
    groupEvents: "Events",
    groupHealth: "Health",
    enabledOnly: "Default-enabled only",
    countLabel: "fields shown",
    fullList: "Open the full metric list",
  },

  building: {
    kicker: "Building",
    title: "Build from source",
    intro:
      "The Makefile owns the ROCm, Go, and image-tag build parameters. The key value is ROCM_DEB — the amdgpu-install package URL used to configure the ROCm apt repository. Keep ROCM_VERSION and ROCM_DEB in sync.",
    steps: [
      { title: "make build", desc: "Compile the rdc-exporter binary." },
      { title: "make image", desc: "Build the container image with the configured ROCm/Go versions." },
      { title: "make image-verify", desc: "Compile, vet, and test the whole module inside the builder stage." },
    ],
    note: "Override versions from the command line when needed:",
  },

  footer: {
    builtBy: "Built by",
    team: "AMD aFDE team (DCGPU System Eng TWN, AMD Inc.)",
    author: "Chen-Hao Ku <Bill.Ku@amd.com>",
    disclaimer:
      "This site summarizes the project's documentation and source. For authoritative details, always refer to the repository docs.",
    docsHeading: "Documentation",
    docConfig: "Configuration guide",
    docDeploy: "Kubernetes deployment guide",
    docMetrics: "Full metric list",
    resourcesHeading: "Resources",
    rocmRdc: "ROCm Data Center Tool (RDC)",
    devicePlugin: "AMD GPU device-plugin",
    vllm: "vLLM",
  },

  common: {
    copy: "Copy",
    copied: "Copied",
    note: "Note",
    caution: "Caution",
    backToTop: "Back to top",
  },
};
