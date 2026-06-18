# Helm Deployment for rdc-exporter

## 1. Purpose

Provide a Helm-based way to deploy `rdc-exporter` as a DaemonSet on AMD GPU
nodes, and document it alongside the existing raw-manifest method. This
consolidates two related plans: creating and deploying the `charts/rdc-exporter`
Helm chart, and updating the project documentation so Helm and the raw manifest
are presented as two equal deployment options.

## 2. Source Scope

Consolidated from the following manuscripts under `docs/plans/manuscripts/`:

- `helm_daemonset_deploy_4e82138a.plan.md` — create the `charts/rdc-exporter`
  Helm chart that reproduces the existing DaemonSet, then install and verify it
  on a k0s test host.
- `docs_add_helm_deploy_4f2143de.plan.md` — add Helm deployment instructions to
  the trilingual Kubernetes deployment guides and the main README.

## 3. Consolidated Background

`rdc-exporter` was previously deployed with a hand-written manifest
(`example/rdc-exporter-daemonset.yml`): a privileged, host-networked DaemonSet
that mounts `/dev/kfd` and `/dev/dri`, reads its metric field list from a
ConfigMap, and (optionally) associates GPUs with Pods via the kubelet
pod-resources socket. The goal is to package that same runtime contract as a
reusable Helm chart and document it.

Test host state (probed):

- k0s single control-plane node, `v1.35.4+k0s`, 8 allocatable GPUs,
  device-plugin already running.
- kubelet root-dir = `/var/lib/k0s/kubelet`, so the pod-resources socket is
  `/var/lib/k0s/kubelet/pod-resources/kubelet.sock` (non-standard path).
- A pre-existing `monitoring` namespace and raw-manifest `rdc-exporter`
  DaemonSet (image `v1-rocm7.2.4-20260610`).
- Helm not installed; host can reach get.helm.sh, `/usr/local/bin` is writable,
  and `k0s kubeconfig admin` works.

## 4. Confirmed Decisions

- Chart lives at `charts/rdc-exporter`.
- The chart reproduces the example DaemonSet semantics exactly (DaemonSet,
  hostNetwork, privileged + SYS_PTRACE, `/dev/kfd` + `/dev/dri`, pod-resources
  socket, metrics ConfigMap, tolerate all taints, RollingUpdate
  `maxUnavailable: 100%`).
- Reuse the existing prebuilt GHCR image; do not rebuild (the test host has no
  ROCm toolchain).
- Namespace is not templated; it is controlled by `helm install -n monitoring
  --create-namespace` (Helm convention).
- The chart default socket uses the standard kubelet path; the k0s path is
  applied at deploy time via `--set`, keeping the chart generic.
- Service and ServiceMonitor are disabled by default (with hostNetwork,
  Prometheus scrapes the node IP:5000 directly).
- Install Helm on the test host and perform a real `helm install` using the k0s
  admin kubeconfig.
- The old `monitoring` namespace (raw-manifest DaemonSet + ConfigMap) may be
  deleted and replaced by the Helm release (user approved).
- In the documentation, Helm and the raw manifest are presented as two equal
  options.
- Documentation scope: all three deployment guides (`README.md`,
  `README_zhtw.md`, `README_zhcn.md`) plus the main `README.md`; the chart
  README is kept as-is.
- The deployment guide Section 5 subsections 5.2-5.5 are not renumbered, so the
  existing cross-references stay valid.

## 5. Architecture and Design Principles

- The chart is a thin packaging layer over the proven manifest; behavior parity
  with `example/rdc-exporter-daemonset.yml` is the design constraint.
- Common runtime settings are surfaced as chart values; container args are
  assembled dynamically from those values.
- Keep the chart distribution-agnostic: distribution-specific details (such as
  the k0s socket path) are deploy-time overrides, not chart defaults.
- Documentation mirrors this: shared topics (metrics list, socket path,
  profiling limit) apply to both methods, with per-value mappings noted for
  Helm.

## 6. Functional Scope

Chart (`charts/rdc-exporter`):

- `Chart.yaml` (`name: rdc-exporter`, `type: application`,
  `appVersion: "v1-rocm7.2.4-20260610"`), `values.yaml`, `.helmignore`,
  `README.md`.
- `templates/`: `_helpers.tpl`, `NOTES.txt`, `configmap.yaml` (renders
  `metrics.txt` from `metrics.fields`; can be disabled or replaced by
  `metrics.existingConfigMap`), `daemonset.yaml` (core), `serviceaccount.yaml`
  (`serviceAccount.create` default true), `service.yaml` and
  `servicemonitor.yaml` (both default off).

Documentation:

- Deployment guides Section 5 restructured to present Method A (Helm) and
  Method B (raw manifest) as equal options, with Helm value mappings in 5.2/5.3
  and Helm deploy + verify commands in 5.5.
- Main README: a `Helm chart` row in the Documentation table and a Helm
  quickstart in the Kubernetes quickstart.

## 7. Constraints and Rules

- Do not rebuild the container image; reuse the existing GHCR tag.
- Do not modify the existing manifest YAML or the chart content while updating
  docs.
- Do not renumber deployment-guide sections 5.2-5.5 (keeps cross-references at
  lines 22/108/223/429/430 valid).
- Keep the three language versions synchronized and semantically consistent.
- Deletion of the old namespace happens only with user approval.

## 8. Data Model and Format Notes

Key `values.yaml` fields:

- `image.repository: ghcr.io/maple52046/rdc-exporter`, `image.tag: ""` (empty
  uses `appVersion`), `image.pullPolicy: IfNotPresent`.
- `listenPort: 5000`, `hostNetwork: true`.
- `kubelet.enabled: true`, `kubelet.podResourcesSocket:
  /var/lib/kubelet/pod-resources/kubelet.sock` (host path),
  `kubelet.mountPath: /var/lib/kubelet/pod-resources/kubelet.sock` (in-container
  path and `-k` value).
- `metrics.enabled: true`, `metrics.fields` (default 10 telemetry + 6 profiling,
  the same conservative set as the example), `metrics.mountPath:
  /etc/rdc-exporter`, optional `metrics.existingConfigMap`.
- `devices.kfd: /dev/kfd`, `devices.dri: /dev/dri`.
- `securityContext`: `privileged: true`, `capabilities.add: [SYS_PTRACE]`.
- `tolerations: [{operator: Exists}]`, `nodeSelector: {}`, `affinity: {}`,
  `resources: {}`.
- `updateStrategy`: `RollingUpdate`, `maxUnavailable: 100%`.
- `debug: false`, `gpuIndexes: []`, `selfMonitoring: false`, `extraArgs: []`.

Volumes/volumeMounts match the example: `dev-kfd` (CharDevice), `dev-dri`
(Directory), `pod-resources-socket` (Socket, readOnly), `metrics` (configMap,
readOnly); the socket and metrics mounts are gated by `kubelet.enabled` and
`metrics.enabled` respectively.

## 9. CLI / API / Config Notes

Container args are assembled from values:

```text
-l :{{ listenPort }}
-k {{ kubelet.mountPath }}              # when kubelet.enabled
-f {{ metrics.mountPath }}/metrics.txt  # when metrics.enabled
-d                                      # when debug
-i {{ join "," gpuIndexes }}            # when gpuIndexes is non-empty
--self-monitoring                       # when selfMonitoring
{{ extraArgs... }}
```

Install (standard):

```bash
helm install rdc-exporter ./charts/rdc-exporter -n monitoring --create-namespace
```

Install (k0s socket override):

```bash
helm install rdc-exporter ./charts/rdc-exporter -n monitoring --create-namespace \
  --set kubelet.podResourcesSocket=/var/lib/k0s/kubelet/pod-resources/kubelet.sock
```

## 10. Implementation Plan

1. Build the chart scaffold (`Chart.yaml`, `values.yaml`, `.helmignore`,
   `README.md`, `_helpers.tpl`, `NOTES.txt`).
2. Write templates (`daemonset.yaml`, `configmap.yaml`, `serviceaccount.yaml`,
   optional `service.yaml` + `servicemonitor.yaml` off by default) matching the
   example semantics.
3. Install Helm on the test host and set up the k0s admin kubeconfig.
4. Copy the chart to the host; run `helm lint` and `helm template` with the k0s
   socket override.
5. Delete the existing `monitoring` namespace (old DaemonSet + ConfigMap).
6. `helm install` into `monitoring` with the k0s socket override; verify the
   DaemonSet pod is Running and `/metrics` responds.
7. Documentation: update the three deployment guides (Section 5: Method A/B,
   value mappings, deploy + verify) and the main README (Documentation table row
   + Helm quickstart).

## 11. Non-goals

- Rebuilding or republishing the container image.
- Creating a Service or ServiceMonitor by default.
- Adding RBAC beyond a plain ServiceAccount.
- Rewriting the existing raw manifest or removing it as an option.
- Introducing remote/non-embedded RDC handler support or other runtime changes.

## 12. Open Questions

- None outstanding from the source plans. Distribution-specific socket paths
  beyond standard kubelet and k0s are handled generically via
  `kubelet.podResourcesSocket` overrides rather than enumerated defaults.

## 13. Future Work

- Provide a `values-k0s.yaml` example file for the k0s socket override.
- Add a backlink from the chart README to the deployment guide.
- Consider publishing the chart to a Helm repository (e.g., OCI registry or
  GitHub Pages) for `helm repo add` / `helm install` by chart name.
- Consider an optional liveness/readiness signal to detect the profiling PMC
  packet overflow condition where `/metrics` silently stops updating.
