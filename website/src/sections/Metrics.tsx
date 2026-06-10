import { useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { Callout } from "../components/Callout";
import {
  DOCS,
  metricRows,
  recommendedProfiling,
  recommendedTelemetry,
  type MetricGroup,
} from "../content/data";

const groupColor: Record<MetricGroup, string> = {
  core: "text-cyan",
  pcie: "text-teal",
  ecc: "text-amd-2",
  xgmi: "text-iris",
  profiling: "text-ember",
  events: "text-faint",
  health: "text-amd",
};

/**
 * Metrics is the full RDC field catalog browser (`#metrics`).
 *
 * Above the table it summarizes the recommended telemetry/profiling sets and a
 * caution about the profiling PMC packet limit; below, it renders every row of
 * `metricRows` (transcribed from `docs/metrics.md`) in a scrollable,
 * sticky-header table. Two pieces of local UI state drive an in-place filter
 * over that data, recomputed via `useMemo`:
 * - `group`: the active category chip (or `"all"`), matched against `m.group`.
 * - `enabledOnly`: when on, restricts to fields in the default-enabled set
 *   (`m.enabled`, i.e. Enable = Y in the docs).
 *
 * Filtering is purely client-side and never mutates `metricRows`; the count
 * label reflects filtered vs. total. The "full list" link points at the
 * canonical `DOCS.metrics`. The default-enabled tallies (10 telemetry +
 * 6 profiling) are shown as fixed headline numbers from the guide.
 */
export function Metrics() {
  const { t } = useI18n();
  const [group, setGroup] = useState<MetricGroup | "all">("all");
  const [enabledOnly, setEnabledOnly] = useState(false);

  const groups: { id: MetricGroup; label: string }[] = [
    { id: "core", label: t.metrics.groupCore },
    { id: "pcie", label: t.metrics.groupPcie },
    { id: "ecc", label: t.metrics.groupEcc },
    { id: "xgmi", label: t.metrics.groupXgmi },
    { id: "profiling", label: t.metrics.groupProfiling },
    { id: "events", label: t.metrics.groupEvents },
    { id: "health", label: t.metrics.groupHealth },
  ];

  const filtered = useMemo(
    () =>
      metricRows.filter(
        (m) => (group === "all" || m.group === group) && (!enabledOnly || m.enabled),
      ),
    [group, enabledOnly],
  );

  const chipBase =
    "rounded-full border px-3 py-1 text-xs font-medium transition";
  const chipFor = (active: boolean) =>
    active
      ? `${chipBase} border-cyan/50 bg-cyan/10 text-cyan`
      : `${chipBase} border-line bg-white/[0.02] text-muted hover:text-ink`;

  return (
    <Section id="metrics" kicker={t.metrics.kicker} title={t.metrics.title} intro={t.metrics.intro} tone="cool">
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-cyan/25 bg-cyan/[0.04] p-6">
            <h3 className="text-lg font-semibold text-cyan">{t.metrics.telemetryTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.metrics.telemetryDesc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {recommendedTelemetry.map((m) => (
                <span key={m} className="rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-muted">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="h-full rounded-2xl border border-ember/25 bg-ember/[0.05] p-6">
            <h3 className="text-lg font-semibold text-ember">{t.metrics.profilingTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.metrics.profilingDesc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {recommendedProfiling.map((m) => (
                <span key={m} className="rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-muted">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <div className="h-full rounded-2xl border border-line bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-ink">{t.metrics.defaultTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.metrics.defaultDesc}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-cyan">10</span>
                <span className="text-xs text-faint">telemetry</span>
              </div>
              <span className="text-2xl text-faint">+</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-ember">6</span>
                <span className="text-xs text-faint">profiling</span>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <Callout kind="caution" title={t.metrics.caveatTitle}>
            <p>{t.metrics.caveatDesc}</p>
            <ul className="mt-3 space-y-1.5">
              {t.metrics.caveatList.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amd" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Callout>
        </Reveal>
      </div>

      {/* Full metric table with category filters */}
      <div className="mt-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-ink">{t.metrics.tableTitle}</h3>
              <p className="mt-2 text-sm text-muted">{t.metrics.tableHint}</p>
            </div>
            <a
              href={DOCS.metrics}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-cyan transition hover:text-teal"
            >
              {t.metrics.fullList} →
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setGroup("all")} className={chipFor(group === "all")}>
              {t.metrics.filterAll}
            </button>
            {groups.map((g) => (
              <button key={g.id} type="button" onClick={() => setGroup(g.id)} className={chipFor(group === g.id)}>
                {g.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEnabledOnly((v) => !v)}
              className={`${chipFor(enabledOnly)} ml-auto`}
              aria-pressed={enabledOnly}
            >
              {enabledOnly ? "✓ " : ""}
              {t.metrics.enabledOnly}
            </button>
            <span className="text-xs text-faint">
              {filtered.length} / {metricRows.length} {t.metrics.countLabel}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-xs uppercase tracking-wider text-faint">
                    <th className="bg-surface-2 px-4 py-3 font-semibold">{t.metrics.colMetric}</th>
                    <th className="bg-surface-2 px-4 py-3 font-semibold">{t.metrics.colProm}</th>
                    <th className="bg-surface-2 px-4 py-3 font-semibold">{t.metrics.colId}</th>
                    <th className="bg-surface-2 px-4 py-3 font-semibold">{t.metrics.colEnable}</th>
                    <th className="bg-surface-2 px-4 py-3 font-semibold">{t.metrics.colHelp}</th>
                    <th className="bg-surface-2 px-4 py-3 font-semibold">{t.metrics.colDcgm}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.metric} className="border-t border-line">
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className={`font-mono text-[12px] ${groupColor[m.group]}`}>{m.metric}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-ink">{m.prom}</td>
                      <td className="px-4 py-2.5 text-muted">{m.id}</td>
                      <td className="px-4 py-2.5">
                        {m.enabled ? (
                          <span className="font-semibold text-cyan">✓</span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{m.help}</td>
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-faint">{m.dcgm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
