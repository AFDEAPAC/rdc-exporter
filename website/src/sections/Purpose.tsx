import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CodeBlock } from "../components/CodeBlock";
import { snippets } from "../content/data";

/**
 * Purpose explains what RDC Exporter is for and what its output looks like.
 *
 * Renders the localized value-proposition cards (`t.purpose.cards`, numbered by
 * position) alongside two real `/metrics` samples taken from the canonical
 * `snippets` data: a plain gauge sample and a workload-labeled sample that shows
 * the Pod/namespace/container labels added in Kubernetes. Card and caption copy
 * are localized; the code samples are language-neutral and mirror the repo docs.
 */
export function Purpose() {
  const { t } = useI18n();
  return (
    <Section id="purpose" kicker={t.purpose.kicker} title={t.purpose.title} intro={t.purpose.intro}>
      <div className="grid gap-4 sm:grid-cols-2">
        {t.purpose.cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.06}>
            <div className="h-full rounded-2xl border border-line bg-white/[0.02] p-6 transition hover:border-cyan/30 hover:bg-white/[0.035]">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amd/20 to-cyan/20 text-sm font-bold text-ink">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <CodeBlock code={snippets.metricsOutput} label="/metrics" caption={t.purpose.outputCaption} />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex h-full flex-col justify-center rounded-2xl border border-line bg-white/[0.02] p-6">
            <p className="text-sm leading-relaxed text-muted">{t.purpose.workloadNote}</p>
            <div className="mt-4">
              <CodeBlock code={snippets.workloadOutput} label="workload labels" />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
