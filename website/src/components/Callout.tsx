import type { ReactNode } from "react";

interface CalloutProps {
  kind?: "note" | "caution";
  title: string;
  children: ReactNode;
}

/**
 * Callout renders an emphasized note or caution block inside body content.
 *
 * `kind` selects the visual treatment and the operational severity it signals:
 * - `"note"` (default) uses the cool cyan accent for neutral, informational
 *   asides.
 * - `"caution"` uses the warm AMD accent to flag hardware/operational hazards
 *   the reader can actually trip over, e.g. the profiling PMC packet limit that
 *   silently stalls `/metrics`.
 *
 * It is purely presentational: the dot, border, and title color are derived
 * from `kind`, and `children` supplies the body copy.
 */
export function Callout({ kind = "note", title, children }: CalloutProps) {
  const isCaution = kind === "caution";
  const accent = isCaution ? "border-amd/40 bg-amd/[0.06]" : "border-cyan/30 bg-cyan/[0.05]";
  const dot = isCaution ? "bg-amd" : "bg-cyan";
  const titleColor = isCaution ? "text-amd-2" : "text-cyan";
  return (
    <div className={`rounded-xl border ${accent} p-5`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-sm font-semibold ${titleColor}`}>{title}</span>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}
