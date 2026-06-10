/**
 * K8sTopology mirrors the deployment guide's data flow on a single GPU node.
 *
 * It shows the device-plugin registering GPUs with the kubelet, a workload Pod
 * requesting them (so the kubelet records the assignment), node-labeller
 * labeling the node, and rdc-exporter both reading the GPU devices and querying
 * the kubelet pod-resources API for the GPU-to-Pod mapping before exposing
 * `/metrics` to Prometheus. Decorative SVG exposed as a single `role="img"` with
 * an `aria-label` summarizing the actors; box and edge labels are
 * Kubernetes/AMD proper nouns kept verbatim in English.
 */
export function K8sTopology() {
  return (
    <svg
      viewBox="0 0 980 520"
      className="h-auto w-full"
      role="img"
      aria-label="Kubernetes topology: device-plugin, node-labeller, kubelet pod-resources, rdc-exporter DaemonSet, and a workload Pod on a GPU node"
    >
      <defs>
        <marker id="k8sA" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#9aa7c0" />
        </marker>
        <marker id="k8sWarm" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#FF6A3D" />
        </marker>
        <marker id="k8sCool" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#22D3EE" />
        </marker>
      </defs>

      {/* GPU Node container */}
      <rect x="20" y="60" width="690" height="430" rx="20" fill="rgba(255,255,255,0.015)" stroke="#2b3a5c" strokeWidth="1.6" />
      <text x="44" y="92" fontSize="16" fontWeight="700" fill="#9aa7c0">
        GPU Node
      </text>
      <text x="44" y="112" fontSize="12" fill="#6b7891">
        kubernetes.io/arch=amd64 · /dev/kfd · /dev/dri
      </text>

      {/* device-plugin */}
      <g>
        <rect x="55" y="130" width="220" height="66" rx="12" fill="rgba(255,255,255,0.03)" stroke="#FFB020" strokeWidth="1.6" />
        <text x="165" y="160" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e8edf7">device-plugin</text>
        <text x="165" y="180" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">registers amd.com/gpu</text>
      </g>

      {/* node-labeller */}
      <g>
        <rect x="55" y="214" width="220" height="66" rx="12" fill="rgba(255,255,255,0.03)" stroke="#FFB020" strokeWidth="1.6" />
        <text x="165" y="244" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e8edf7">node-labeller</text>
        <text x="165" y="264" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">labels beta.amd.com/gpu.*</text>
      </g>

      {/* workload Pod */}
      <g>
        <rect x="450" y="130" width="230" height="80" rx="12" fill="rgba(34,211,238,0.06)" stroke="#22D3EE" strokeWidth="1.6" />
        <text x="565" y="162" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e8edf7">Workload Pod</text>
        <text x="565" y="183" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">requests amd.com/gpu: N</text>
        <text x="565" y="200" textAnchor="middle" fontSize="11" fill="#6b7891">e.g. vLLM</text>
      </g>

      {/* rdc-exporter */}
      <g>
        <rect x="300" y="250" width="250" height="104" rx="14" fill="rgba(237,28,36,0.08)" stroke="url(#k8sExp)" strokeWidth="2" />
        <linearGradient id="k8sExp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ED1C24" />
          <stop offset="1" stopColor="#FF6A3D" />
        </linearGradient>
        <text x="425" y="288" textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">rdc-exporter</text>
        <text x="425" y="310" textAnchor="middle" fontSize="12.5" fill="#cdd6ea">DaemonSet · privileged</text>
        <text x="425" y="330" textAnchor="middle" fontSize="12" fill="#9aa7c0">RDC collect → /metrics</text>
      </g>

      {/* kubelet hub */}
      <g>
        <rect x="120" y="400" width="430" height="74" rx="14" fill="rgba(255,255,255,0.03)" stroke="#818cf8" strokeWidth="1.8" />
        <text x="335" y="432" textAnchor="middle" fontSize="16" fontWeight="700" fill="#e8edf7">kubelet</text>
        <text x="335" y="454" textAnchor="middle" fontSize="12" fill="#9aa7c0">pod-resources API · kubelet.sock</text>
      </g>

      {/* Prometheus (off-node) */}
      <g>
        <rect x="760" y="262" width="190" height="84" rx="14" fill="rgba(34,211,238,0.06)" stroke="#22D3EE" strokeWidth="1.6" />
        <text x="855" y="296" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e8edf7">Prometheus</text>
        <text x="855" y="316" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">scrape node:5000</text>
      </g>

      {/* arrows */}
      {/* device-plugin -> kubelet */}
      <path d="M165 196 L165 400" fill="none" stroke="#9aa7c0" strokeWidth="1.8" markerEnd="url(#k8sA)" className="flow" opacity="0.75" />
      <text x="175" y="320" fontSize="11.5" fill="#7c84a8">register GPUs</text>

      {/* workload Pod -> kubelet (scheduling records) */}
      <path d="M565 210 C565 360 470 360 440 400" fill="none" stroke="#9aa7c0" strokeWidth="1.8" markerEnd="url(#k8sA)" className="flow" opacity="0.75" />
      <text x="582" y="300" fontSize="11.5" fill="#7c84a8">scheduling records GPUs</text>

      {/* rdc-exporter -> kubelet (query mapping) */}
      <path d="M380 354 L350 400" fill="none" stroke="#FF6A3D" strokeWidth="2" markerEnd="url(#k8sWarm)" className="flow" />
      <text x="200" y="392" fontSize="11.5" fill="#FFB020">query GPU→Pod mapping</text>

      {/* rdc-exporter -> workload Pod (reads /dev) */}
      <path d="M470 250 C480 224 500 216 520 210" fill="none" stroke="#FF6A3D" strokeWidth="2" markerEnd="url(#k8sWarm)" className="flow" />
      <text x="486" y="240" fontSize="11.5" fill="#FFB020">reads /dev/kfd,/dri</text>

      {/* rdc-exporter -> Prometheus (/metrics) */}
      <path d="M550 300 L760 300" fill="none" stroke="#22D3EE" strokeWidth="2" markerEnd="url(#k8sCool)" className="flow" />
      <text x="655" y="292" textAnchor="middle" fontSize="12" fontWeight="600" fill="#22D3EE">/metrics</text>
    </svg>
  );
}
