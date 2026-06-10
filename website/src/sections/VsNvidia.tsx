import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CodeBlock } from "../components/CodeBlock";
import { snippets } from "../content/data";

/**
 * VsNvidia contrasts RDC Exporter with NVIDIA's DCGM exporter (`#vs-nvidia`).
 *
 * Renders the localized comparison table (`t.vsNvidia.rows`, keyed by aspect)
 * plus a worked illustration of the core design difference: a single DCGM CSV
 * row versus RDC Exporter splitting identity/unit (catalog) from selection
 * (metric list). The three side-by-side `snippets` are language-neutral and are
 * meant to be read together as before/after. Table/explanation copy is localized.
 */
export function VsNvidia() {
  const { t } = useI18n();
  return (
    <Section id="vs-nvidia" kicker={t.vsNvidia.kicker} title={t.vsNvidia.title} intro={t.vsNvidia.intro}>
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint" />
                  <th className="px-4 py-3 text-sm font-semibold text-muted">{t.vsNvidia.colNvidia}</th>
                  <th className="px-4 py-3 text-sm font-semibold">
                    <span className="gradient-text">{t.vsNvidia.colRdc}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.vsNvidia.rows.map((r) => (
                  <tr key={r.aspect} className="border-t border-line align-top">
                    <td className="px-4 py-3 text-sm font-semibold text-ink">{r.aspect}</td>
                    <td className="px-4 py-3 text-sm leading-relaxed text-faint">{r.nvidia}</td>
                    <td className="px-4 py-3 text-sm leading-relaxed text-muted">{r.rdc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Reveal>
          <div className="h-full rounded-2xl border border-line bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold text-ink">{t.vsNvidia.whyTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.vsNvidia.whyDesc}</p>
            <p className="mt-4 rounded-lg border border-cyan/25 bg-cyan/[0.05] p-3 text-sm leading-relaxed text-muted">
              {t.vsNvidia.mappingNote}
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid gap-4">
            <CodeBlock code={snippets.dcgmCsv} label="DCGM — one CSV row" />
            <div className="flex items-center justify-center text-faint">
              <span className="rounded-full border border-line px-3 py-1 text-xs">RDC Exporter splits this in two</span>
            </div>
            <CodeBlock code={snippets.rdcCatalog} label="catalog — identity + unit" />
            <CodeBlock code={snippets.rdcList} label="metric list — selection" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
