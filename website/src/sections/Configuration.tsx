import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CodeBlock } from "../components/CodeBlock";
import { ConfigModel } from "../diagrams/ConfigModel";
import { catalogEntryRows, DOCS, flagRows, refForms, scaleRows, snippets } from "../content/data";

/**
 * Configuration explains the catalog/metric-list configuration model
 * (`#configuration`).
 *
 * Opens with the `ConfigModel` diagram, then documents, in order: the two-layer
 * model (default catalog + optional `--catalog`), the startup resolution order
 * (`t.configuration.order`), the three interchangeable field-reference forms
 * (`refForms`), the scale/unit conversions (`scaleRows`), merge-vs-overwrite
 * behavior, the catalog-entry key reference (`catalogEntryRows`), a worked
 * three-file example, and the full CLI flag table (`flagRows`). Reference tables
 * and snippets are language-neutral data sourced from the configuration guide;
 * only prose is localized. Uses the cool tone and links out to
 * `DOCS.configuration` for the authoritative reference.
 */
export function Configuration() {
  const { t } = useI18n();
  return (
    <Section
      id="configuration"
      kicker={t.configuration.kicker}
      title={t.configuration.title}
      intro={t.configuration.intro}
      tone="cool"
    >
      <Reveal>
        <div className="glass rounded-2xl p-5 sm:p-7">
          <ConfigModel />
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {t.configuration.twoLayer.map((l, i) => (
          <Reveal key={l.title} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-line bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold text-ink">{l.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{l.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Startup order */}
      <Reveal>
        <div className="mt-8 rounded-2xl border border-line bg-white/[0.02] p-6">
          <h3 className="text-base font-semibold text-ink">{t.configuration.orderTitle}</h3>
          <ol className="mt-4 space-y-3">
            {t.configuration.order.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-muted">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan/20 to-iris/20 text-xs font-bold text-cyan">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {/* Field references */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.configuration.refTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.configuration.refDesc}</p>
        </Reveal>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-faint">
                      <th className="px-4 py-3 font-semibold">{t.configuration.refColForm}</th>
                      <th className="px-4 py-3 font-semibold">{t.configuration.refColExample}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refForms.map((r) => (
                      <tr key={r.form} className="border-t border-line">
                        <td className="px-4 py-3 text-muted">{r.form}</td>
                        <td className="px-4 py-3 font-mono text-[12.5px] text-cyan">{r.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <CodeBlock code={snippets.fieldsCombined} label="-e / --fields" />
            <div className="mt-4">
              <CodeBlock code={snippets.fieldsFile} label="-f / --fields-file" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Scale */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.configuration.scaleTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.configuration.scaleDesc}</p>
        </Reveal>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="border-b border-line bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-ink">
                {t.configuration.scaleTableTitle}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-faint">
                      <th className="px-4 py-2.5 font-semibold">prom_name</th>
                      <th className="px-4 py-2.5 font-semibold">field</th>
                      <th className="px-4 py-2.5 font-semibold">raw</th>
                      <th className="px-4 py-2.5 font-semibold">scale</th>
                      <th className="px-4 py-2.5 font-semibold">unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scaleRows.map((r) => (
                      <tr key={r.prom} className="border-t border-line">
                        <td className="px-4 py-2.5 font-mono text-[12.5px] text-cyan">{r.prom}</td>
                        <td className="px-4 py-2.5 text-muted">{r.field}</td>
                        <td className="px-4 py-2.5 text-muted">{r.rawUnit}</td>
                        <td className="px-4 py-2.5 font-mono text-[12.5px] text-ember">{r.scale}</td>
                        <td className="px-4 py-2.5 font-semibold text-ink">{r.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <CodeBlock code={snippets.scaleYaml} label="catalog.yml" />
            <div className="mt-4">
              <CodeBlock code={snippets.catalogRun} label="run" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Merge vs overwrite */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.configuration.mergeTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.configuration.mergeDesc}</p>
        </Reveal>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <CodeBlock code={snippets.mergeYaml} label="merge (default)" caption={t.configuration.mergeMode} />
          </Reveal>
          <Reveal delay={0.1}>
            <CodeBlock code={snippets.overwriteYaml} label="overwrite" caption={t.configuration.overwriteMode} />
          </Reveal>
        </div>
      </div>

      {/* Catalog entry reference */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.configuration.entryTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.configuration.entryDesc}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-5 overflow-hidden rounded-2xl border border-line">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-faint">
                    <th className="px-4 py-3 font-semibold">{t.configuration.entryColKey}</th>
                    <th className="px-4 py-3 font-semibold">{t.configuration.entryColReq}</th>
                    <th className="px-4 py-3 font-semibold">{t.configuration.entryColMeaning}</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogEntryRows.map((r) => (
                    <tr key={r.key} className="border-t border-line align-top">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-cyan">{r.key}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{r.required}</td>
                      <td className="px-4 py-3 text-muted">{r.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Worked example */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.configuration.exampleTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.configuration.exampleDesc}</p>
        </Reveal>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Reveal>
            <CodeBlock code={snippets.workedCatalog} label="catalog.yaml" />
          </Reveal>
          <Reveal delay={0.07}>
            <CodeBlock code={snippets.workedList} label="metrics.txt" />
          </Reveal>
          <Reveal delay={0.14}>
            <CodeBlock code={snippets.workedRun} label="run" />
          </Reveal>
        </div>
      </div>

      {/* CLI flags */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.configuration.flagsTitle}</h3>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-5 overflow-hidden rounded-2xl border border-line">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-faint">
                    <th className="px-4 py-3 font-semibold">Flag</th>
                    <th className="px-4 py-3 font-semibold">Short</th>
                    <th className="px-4 py-3 font-semibold">Default</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {flagRows.map((f) => (
                    <tr key={f.flag} className="border-t border-line">
                      <td className="px-4 py-3 font-mono text-[12.5px] text-cyan">{f.flag}</td>
                      <td className="px-4 py-3 font-mono text-[12.5px] text-ember">{f.short}</td>
                      <td className="px-4 py-3 font-mono text-[12.5px] text-muted">{f.def}</td>
                      <td className="px-4 py-3 text-muted">{f.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <a
          href={DOCS.configuration}
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-block text-sm font-medium text-cyan transition hover:text-teal"
        >
          {t.configuration.fullGuide} →
        </a>
      </Reveal>
    </Section>
  );
}
