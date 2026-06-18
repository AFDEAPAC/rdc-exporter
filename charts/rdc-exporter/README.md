# rdc-exporter Helm chart

Deploys [`rdc-exporter`](https://github.com/maple52046/rdc-exporter) as a DaemonSet
on AMD GPU nodes to collect GPU metrics via the ROCm Data Center Tool (RDC) and
expose them for Prometheus.

The chart reproduces the runtime contract of the upstream DaemonSet example: a
privileged, host-networked DaemonSet that mounts `/dev/kfd` and `/dev/dri`, reads
the metric field list from a ConfigMap, and (optionally) associates GPUs with
Pods through the kubelet pod-resources socket.

## Prerequisites

- A Kubernetes cluster with AMD GPU nodes (the `amdgpu` driver, `/dev/kfd` and
  `/dev/dri/*` present).
- The AMD GPU device-plugin deployed if you want Pod/namespace/container labels.
- The kubelet pod-resources API enabled on GPU nodes.

## Install

```bash
helm install rdc-exporter ./charts/rdc-exporter \
  -n monitoring --create-namespace
```

### k0s clusters

k0s uses a non-standard kubelet root-dir, so override the host socket path:

```bash
helm install rdc-exporter ./charts/rdc-exporter \
  -n monitoring --create-namespace \
  --set kubelet.podResourcesSocket=/var/lib/k0s/kubelet/pod-resources/kubelet.sock
```

## Uninstall

```bash
helm uninstall rdc-exporter -n monitoring
```

## Key values

| Key | Default | Description |
| --- | --- | --- |
| `image.repository` | `ghcr.io/maple52046/rdc-exporter` | Container image repository. |
| `image.tag` | `""` (chart appVersion) | Image tag. |
| `listenPort` | `5000` | Port `/metrics` is served on (`-l :PORT`). |
| `hostNetwork` | `true` | Serve `/metrics` on the node IP. |
| `kubelet.enabled` | `true` | Enable GPU-to-Pod association (`-k`). |
| `kubelet.podResourcesSocket` | `/var/lib/kubelet/pod-resources/kubelet.sock` | Host socket path (set to the k0s path on k0s). |
| `kubelet.mountPath` | `/var/lib/kubelet/pod-resources/kubelet.sock` | In-container socket path and the value passed to `-k`. |
| `metrics.enabled` | `true` | Render a ConfigMap with `metrics.txt` and pass it via `-f`. |
| `metrics.existingConfigMap` | `""` | Use an existing ConfigMap (must have a `metrics.txt` key). |
| `metrics.fields` | 10 telemetry + 6 profiling | RDC fields to collect. |
| `devices.kfd` / `devices.dri` | `/dev/kfd` / `/dev/dri` | Host GPU device nodes. |
| `securityContext` | privileged + `SYS_PTRACE` | Required for RDC collection. |
| `tolerations` | `[{operator: Exists}]` | Schedule on all nodes (including control-plane/GPU taints). |
| `updateStrategy` | RollingUpdate, `maxUnavailable: 100%` | DaemonSet rollout strategy. |
| `debug` | `false` | Verbose logging (`-d`). |
| `gpuIndexes` | `[]` | Restrict to specific GPU indexes (`-i`). |
| `selfMonitoring` | `false` | Register Go/Process collectors (`--self-monitoring`). |
| `extraArgs` | `[]` | Extra container args. |
| `service.enabled` | `false` | Create a Service (usually unnecessary with hostNetwork). |
| `serviceMonitor.enabled` | `false` | Create a Prometheus Operator ServiceMonitor. |

## Profiling field limit

Profiling fields (`RDC_FI_PROF_*`) map to GPU hardware PMC counters packed into a
single packet. Requesting too many at once can exceed the GPU's PMC capacity and
silently wedge collection (the pod stays `Running` but `/metrics` stops updating).
Start with a small profiling set and add fields gradually. See
`docs/issues/0001-profiling-fields-pmc-packet-overflow.md` in the main repository.
