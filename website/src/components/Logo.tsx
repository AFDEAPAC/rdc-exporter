import { useId } from "react";

/**
 * Logo is the inline SVG chip mark used in the nav and footer.
 *
 * It is inlined (rather than an `<img>`) so it stays self-contained in the
 * single-file build and scales crisply at any `size`. The gradient `id`s are
 * namespaced per instance via `useId` because the mark is rendered more than
 * once on the page; without unique ids the second instance's `url(#...)` fills
 * would resolve against the first instance's `<defs>`. Decorative only, so it is
 * `aria-hidden` and relies on the adjacent text for its accessible name.
 *
 * - `size` sets both width and height in pixels (the viewBox is fixed at 48).
 */
export function Logo({ size = 30 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const warm = `logoWarm-${uid}`;
  const cool = `logoCool-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="floaty"
    >
      <defs>
        <linearGradient id={warm} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ED1C24" />
          <stop offset="0.5" stopColor="#FF6A3D" />
          <stop offset="1" stopColor="#FFB020" />
        </linearGradient>
        <linearGradient id={cool} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <rect
        x="9"
        y="9"
        width="30"
        height="30"
        rx="7"
        stroke={`url(#${warm})`}
        strokeWidth="2.5"
      />
      <rect x="17" y="17" width="14" height="14" rx="3" fill={`url(#${cool})`} />
      {[14, 24, 34].map((p) => (
        <g key={p} stroke={`url(#${warm})`} strokeWidth="2.5" strokeLinecap="round">
          <line x1={p} y1="3" x2={p} y2="9" />
          <line x1={p} y1="39" x2={p} y2="45" />
          <line x1="3" y1={p} x2="9" y2={p} />
          <line x1="39" y1={p} x2="45" y2={p} />
        </g>
      ))}
    </svg>
  );
}
