import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface SectionProps {
  id: string;
  kicker: string;
  title: string;
  intro?: string;
  children: ReactNode;
  tone?: "warm" | "cool";
}

/**
 * Section is the shared shell for every top-level page section.
 *
 * It renders an anchored, width-constrained container with a gradient kicker, a
 * heading, and an optional intro paragraph, then drops `children` into the body.
 * The header block is wrapped in `Reveal`, so the kicker/title/intro animate in
 * on scroll while the body manages its own reveals.
 *
 * - `id` is the scroll anchor; it must match the corresponding `Nav` link href
 *   so in-page navigation lands on the section (the `scroll-mt` offset accounts
 *   for the fixed header).
 * - `tone` only swaps the accent gradient (`"warm"` = AMD red/orange, `"cool"` =
 *   cyan/iris) and carries no semantic meaning.
 * - `intro` is optional; when omitted no paragraph slot is rendered.
 */
export function Section({
  id,
  kicker,
  title,
  intro,
  children,
  tone = "warm",
}: SectionProps) {
  const accent = tone === "warm" ? "gradient-text" : "gradient-text-cool";
  return (
    <section
      id={id}
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
    >
      <Reveal>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold uppercase tracking-[0.25em] ${accent}`}
          >
            {kicker}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {intro && (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
            {intro}
          </p>
        )}
      </Reveal>
      <div className="mt-12">{children}</div>
    </section>
  );
}
