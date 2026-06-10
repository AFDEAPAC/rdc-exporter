import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { RuntimeFlow } from "../diagrams/RuntimeFlow";

/**
 * Architecture is the "How it works" section (`#architecture`).
 *
 * It pairs the animated `RuntimeFlow` diagram of one collection cycle with the
 * localized step cards in `t.architecture.flowSteps`, which are numbered by
 * position (`01`, `02`, ...) to read as an ordered walkthrough. Uses the cool
 * tone to group it with the other system-internals sections. All prose is
 * locale-driven; the diagram carries its own English proper-noun labels.
 */
export function Architecture() {
  const { t } = useI18n();
  return (
    <Section
      id="architecture"
      kicker={t.architecture.kicker}
      title={t.architecture.title}
      intro={t.architecture.intro}
      tone="cool"
    >
      <Reveal>
        <h3 className="text-xl font-semibold text-ink">{t.architecture.flowTitle}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.architecture.flowDesc}</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-6 glass rounded-2xl p-5 sm:p-7">
          <RuntimeFlow />
        </div>
      </Reveal>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.architecture.flowSteps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.05}>
            <div className="h-full rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="text-xs font-bold text-cyan">{String(i + 1).padStart(2, "0")}</div>
              <h4 className="mt-1 text-sm font-semibold text-ink">{s.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
