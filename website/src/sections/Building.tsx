import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CodeBlock } from "../components/CodeBlock";
import { snippets } from "../content/data";

/**
 * Building documents how to build the binary and container image from source.
 *
 * Lists the localized, position-numbered steps in `t.building.steps` next to two
 * canonical `make` snippets: the default `make build`/`image` flow and a
 * version-override invocation. The build commands are language-neutral data and
 * must match the repository Makefile; only the surrounding narrative is localized.
 */
export function Building() {
  const { t } = useI18n();
  return (
    <Section id="building" kicker={t.building.kicker} title={t.building.title} intro={t.building.intro}>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3">
          {t.building.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="flex items-start gap-4 rounded-xl border border-line bg-white/[0.02] p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amd/20 to-ember/20 text-xs font-bold text-ember">
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-mono text-sm font-semibold text-ink">{s.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <CodeBlock code={snippets.makeBuild} label="make" />
          <p className="mt-4 text-sm text-muted">{t.building.note}</p>
          <div className="mt-3">
            <CodeBlock code={snippets.makeOverride} label="override versions" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
