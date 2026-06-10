/**
 * ConfigModel visualizes the two-layer configuration model.
 *
 * From the configuration guide: the embedded default catalog plus an optional
 * `--catalog` file are merged (or overwritten) into the effective catalog (the
 * "dictionary"), which is then filtered by the metric-list selection (`-e`/`-f`)
 * to produce the exported Prometheus series, where value = raw reading x scale.
 * Decorative SVG exposed as a single `role="img"` with an `aria-label`; dashed
 * boxes mark the optional `--catalog` input. It is the visual companion to the
 * tables in the `Configuration` section, not an independent source of truth.
 */
export function ConfigModel() {
  return (
    <svg
      viewBox="0 0 1020 380"
      className="h-auto w-full"
      role="img"
      aria-label="Configuration model: catalog merge then filter by metric list into exported series"
    >
      <defs>
        <marker id="cfgA" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#9aa7c0" />
        </marker>
        <marker id="cfgWarm" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0 0L7 3L0 6Z" fill="#FF6A3D" />
        </marker>
        <linearGradient id="cfgOut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      <text x="150" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#22D3EE">
        Catalog — the dictionary
      </text>

      {/* default catalog */}
      <rect x="30" y="58" width="240" height="62" rx="12" fill="rgba(34,211,238,0.06)" stroke="#22D3EE" strokeWidth="1.6" />
      <text x="150" y="84" textAnchor="middle" fontSize="14" fontWeight="700" fill="#e8edf7">default catalog</text>
      <text x="150" y="104" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">embedded in the binary</text>

      {/* user catalog */}
      <rect x="30" y="150" width="240" height="62" rx="12" fill="rgba(34,211,238,0.04)" stroke="#22D3EE" strokeWidth="1.4" strokeDasharray="6 5" />
      <text x="150" y="176" textAnchor="middle" fontSize="14" fontWeight="700" fill="#e8edf7">--catalog file</text>
      <text x="150" y="196" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">optional overrides</text>

      {/* effective catalog */}
      <rect x="340" y="92" width="200" height="86" rx="14" fill="rgba(255,255,255,0.03)" stroke="#2dd4bf" strokeWidth="1.8" />
      <text x="440" y="128" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e8edf7">effective catalog</text>
      <text x="440" y="150" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">merge / overwrite</text>

      {/* metric list */}
      <rect x="340" y="250" width="200" height="70" rx="12" fill="rgba(237,28,36,0.07)" stroke="#FF6A3D" strokeWidth="1.6" />
      <text x="440" y="280" textAnchor="middle" fontSize="14" fontWeight="700" fill="#e8edf7">metric list</text>
      <text x="440" y="300" textAnchor="middle" fontSize="11.5" fill="#9aa7c0">-e / -f · the selection</text>

      {/* filter */}
      <rect x="610" y="118" width="180" height="120" rx="14" fill="rgba(255,255,255,0.03)" stroke="#FFB020" strokeWidth="1.6" />
      <text x="700" y="170" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="#e8edf7">filter by</text>
      <text x="700" y="190" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="#e8edf7">selected fields</text>

      {/* output */}
      <rect x="850" y="128" width="160" height="100" rx="14" fill="rgba(129,140,248,0.08)" stroke="url(#cfgOut)" strokeWidth="2" />
      <text x="930" y="168" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#fff">exported</text>
      <text x="930" y="188" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#fff">series</text>
      <text x="930" y="210" textAnchor="middle" fontSize="11.5" fill="#cdd6ea">value = raw × scale</text>

      {/* arrows */}
      <path d="M270 89 C310 92 312 110 340 120" fill="none" stroke="#9aa7c0" strokeWidth="1.8" markerEnd="url(#cfgA)" className="flow" opacity="0.75" />
      <path d="M270 181 C310 178 312 160 340 150" fill="none" stroke="#9aa7c0" strokeWidth="1.8" markerEnd="url(#cfgA)" className="flow" opacity="0.75" />
      <text x="300" y="232" textAnchor="middle" fontSize="11" fill="#7c84a8">merge / overwrite</text>

      <path d="M540 135 L610 150" fill="none" stroke="#9aa7c0" strokeWidth="2" markerEnd="url(#cfgA)" className="flow" opacity="0.8" />
      <path d="M540 280 C580 270 590 240 640 238" fill="none" stroke="#FF6A3D" strokeWidth="2" markerEnd="url(#cfgWarm)" className="flow" />

      <path d="M790 178 L850 178" fill="none" stroke="#22D3EE" strokeWidth="2.2" markerEnd="url(#cfgA)" className="flow" />
    </svg>
  );
}
