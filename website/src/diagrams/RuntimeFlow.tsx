interface FlowNode {
  id: string;
  title: string;
  sub: string;
  x: number;
  w: number;
  color: string;
}

const Y = 150;
const H = 80;
const CY = Y + H / 2;

const main: FlowNode[] = [
  { id: "reader", title: "RDC reader", sub: "ReadSamples()", x: 30, w: 190, color: "#ED1C24" },
  { id: "usecase", title: "collect use case", sub: "scale + labels", x: 300, w: 220, color: "#FF6A3D" },
  { id: "sink", title: "Prometheus sink", sub: "Publish()", x: 600, w: 190, color: "#22D3EE" },
  { id: "metrics", title: "/metrics", sub: "HTTP :5000", x: 870, w: 170, color: "#818CF8" },
];

/** Renders one labeled pipeline box for {@link RuntimeFlow} at the node's own x/width. */
function Node({ n }: { n: FlowNode }) {
  return (
    <g>
      <rect
        x={n.x}
        y={Y}
        width={n.w}
        height={H}
        rx="14"
        fill="rgba(255,255,255,0.025)"
        stroke={n.color}
        strokeWidth="1.8"
      />
      <rect x={n.x} y={Y} width="4" height={H} rx="2" fill={n.color} />
      <text x={n.x + n.w / 2} y={CY - 4} textAnchor="middle" fontSize="17" fontWeight="700" fill="#e8edf7">
        {n.title}
      </text>
      <text x={n.x + n.w / 2} y={CY + 18} textAnchor="middle" fontSize="13" fill="#9aa7c0">
        {n.sub}
      </text>
    </g>
  );
}

/**
 * RuntimeFlow diagrams one collection cycle as wired in the Go source.
 *
 * It mirrors `cmd/rdc-exporter/main.go` and
 * `internal/usecase/collect/collect.go`: the RDC reader feeds the collect use
 * case (which also refreshes the optional kubelet labeler), the use case scales
 * and labels samples, the Prometheus sink publishes them, and `/metrics` serves
 * the result; a dashed loop arrow marks the fixed five-second scrape interval.
 * Decorative SVG exposed as a single `role="img"` with an `aria-label`; the
 * kubelet-labeler box is dashed to signal it is optional. Box labels are
 * source-level identifiers kept verbatim in English.
 */
export function RuntimeFlow() {
  return (
    <svg
      viewBox="0 0 1070 340"
      className="h-auto w-full"
      role="img"
      aria-label="Runtime collection cycle: reader, use case, sink, metrics endpoint, looping every five seconds"
    >
      <defs>
        <marker id="rfArrow" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#9aa7c0" />
        </marker>
        <marker id="rfArrowWarm" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#FF6A3D" />
        </marker>
      </defs>

      {/* kubelet labeler feeding the use case */}
      <rect x="300" y="28" width="220" height="62" rx="12" fill="rgba(129,140,248,0.08)" stroke="#818cf8" strokeWidth="1.6" strokeDasharray="6 5" />
      <text x="410" y="54" textAnchor="middle" fontSize="15" fontWeight="700" fill="#a9b2ee">
        kubelet labeler
      </text>
      <text x="410" y="74" textAnchor="middle" fontSize="12" fill="#7c84a8">
        Refresh() · LabelsFor() · optional
      </text>
      <line x1="410" y1="90" x2="410" y2={Y} stroke="#818cf8" strokeWidth="1.8" markerEnd="url(#rfArrow)" className="flow" />

      {/* main pipeline connectors */}
      {main.slice(0, -1).map((n, i) => {
        const x1 = n.x + n.w;
        const x2 = main[i + 1].x;
        return (
          <g key={`c-${n.id}`}>
            <line x1={x1} y1={CY} x2={x2 - 4} y2={CY} stroke="#9aa7c0" strokeWidth="2" markerEnd="url(#rfArrow)" className="flow" opacity="0.7" />
            <circle r="3.5" fill={main[i + 1].color}>
              <animate attributeName="cx" from={x1} to={x2 - 6} dur="1.6s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${CY};${CY}`} dur="1.6s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      {main.map((n) => (
        <Node key={n.id} n={n} />
      ))}

      {/* every-5s loop back to the reader */}
      <path
        d={`M955 ${Y + H} C955 300 955 300 760 300 L240 300 C120 300 120 300 120 ${Y + H}`}
        fill="none"
        stroke="#FF6A3D"
        strokeWidth="2"
        strokeDasharray="6 6"
        markerEnd="url(#rfArrowWarm)"
        className="flow"
        opacity="0.85"
      />
      <text x="540" y="294" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="#FFB020">
        every 5s · scrapeInterval
      </text>
    </svg>
  );
}
