interface NodeDef {
  title: string;
  sub: string;
  tone: "warm" | "cool";
}

const nodes: NodeDef[] = [
  { title: "GPU Node", sub: "AMD GPUs", tone: "warm" },
  { title: "ROCm RDC", sub: "field source", tone: "warm" },
  { title: "rdc-exporter", sub: "scale + label", tone: "warm" },
  { title: "/metrics", sub: "Prometheus gauge", tone: "cool" },
  { title: "Prometheus", sub: "scrape + store", tone: "cool" },
  { title: "Grafana", sub: "visualize", tone: "cool" },
];

const NODE_W = 150;
const NODE_H = 92;
const STEP = 210;
const START = 20;
const CY = 100;

/**
 * OverviewPipeline is the hero data-flow diagram.
 *
 * It draws the end-to-end path AMD GPUs -> ROCm RDC -> rdc-exporter -> /metrics
 * -> Prometheus -> Grafana, with the warm (AMD) half feeding the cool
 * (monitoring) half; animated dots travel each connector to suggest a live
 * stream. The whole graphic is purely decorative SVG, so it is exposed to
 * assistive tech as a single `role="img"` with a descriptive `aria-label`
 * instead of readable text nodes. Node titles are technical proper nouns kept in
 * English; the localized explanation lives in the surrounding section prose.
 */
export function OverviewPipeline() {
  return (
    <svg
      viewBox="0 0 1240 200"
      className="h-auto w-full"
      role="img"
      aria-label="RDC Exporter data pipeline from AMD GPUs through Prometheus to Grafana"
    >
      <defs>
        <linearGradient id="ovWarm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ED1C24" />
          <stop offset="1" stopColor="#FF6A3D" />
        </linearGradient>
        <linearGradient id="ovCool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="ovLink" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF6A3D" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      {nodes.slice(0, -1).map((_n, i) => {
        const x1 = START + i * STEP + NODE_W;
        const x2 = START + (i + 1) * STEP;
        const warm = nodes[i + 1].tone === "warm";
        const stroke = warm ? "url(#ovWarm)" : "url(#ovLink)";
        return (
          <g key={`link-${i}`}>
            <line
              x1={x1}
              y1={CY}
              x2={x2}
              y2={CY}
              stroke={stroke}
              strokeWidth="2"
              className="flow"
              opacity="0.7"
            />
            <circle r="3.5" fill={warm ? "#FF6A3D" : "#22D3EE"}>
              <animate
                attributeName="cx"
                from={x1}
                to={x2}
                dur="1.8s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
              <animate attributeName="cy" values={`${CY};${CY}`} dur="1.8s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      {nodes.map((n, i) => {
        const x = START + i * STEP;
        const y = CY - NODE_H / 2;
        const grad = n.tone === "warm" ? "url(#ovWarm)" : "url(#ovCool)";
        return (
          <g key={n.title}>
            <rect
              x={x}
              y={y}
              width={NODE_W}
              height={NODE_H}
              rx="14"
              fill="rgba(255,255,255,0.025)"
              stroke={grad}
              strokeWidth="1.8"
            />
            <rect x={x} y={y} width="4" height={NODE_H} rx="2" fill={grad} />
            <text
              x={x + NODE_W / 2}
              y={CY - 6}
              textAnchor="middle"
              fontSize="17"
              fontWeight="700"
              fill="#e8edf7"
            >
              {n.title}
            </text>
            <text
              x={x + NODE_W / 2}
              y={CY + 16}
              textAnchor="middle"
              fontSize="12.5"
              fill="#9aa7c0"
            >
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
