import { useI18n } from "../i18n";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CodeBlock } from "../components/CodeBlock";
import { K8sTopology } from "../diagrams/K8sTopology";
import { DOCS, releaseImages, snippets, socketRows, troubleshootRows } from "../content/data";

/**
 * Deployment is the operator-facing rollout guide (`#deployment`).
 *
 * It walks from a Docker quickstart through the full Kubernetes story: the
 * `K8sTopology` diagram, component cards, DaemonSet excerpts, a numbered rollout
 * checklist (`t.deployment.guideSteps`), the kubelet pod-resources socket-path
 * table (`socketRows`, varies by distro), a troubleshooting matrix
 * (`troubleshootRows`), the published release-image table (`releaseImages`,
 * which flags the `latest` row), and a vLLM label-verification example. Narrative
 * copy is localized via `useI18n`; commands, socket paths, image tags, and the
 * troubleshooting data are language-neutral and mirror the repo docs. The
 * "full guide" link points at the canonical doc in `DOCS.deployment`.
 */
export function Deployment() {
  const { t } = useI18n();
  return (
    <Section id="deployment" kicker={t.deployment.kicker} title={t.deployment.title} intro={t.deployment.intro}>
      {/* Docker quickstart */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <div className="rounded-2xl border border-line bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold text-ink">{t.deployment.dockerTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.deployment.dockerDesc}</p>
            <div className="mt-4 grid gap-2">
              {t.deployment.prereqs.map((p) => (
                <div key={p.title} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                  <span className="text-muted">
                    <span className="font-semibold text-ink">{p.title}</span> — {p.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <CodeBlock code={snippets.dockerRun} label="docker" />
        </Reveal>
      </div>

      {/* Kubernetes */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.deployment.k8sTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.deployment.k8sDesc}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-6 glass rounded-2xl p-5 sm:p-7">
            <K8sTopology />
          </div>
        </Reveal>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {t.deployment.k8sComponents.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <div className="h-full rounded-xl border border-line bg-white/[0.02] p-5">
                <h4 className="font-mono text-sm font-semibold text-ember">{c.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <CodeBlock code={snippets.daemonsetArgs} label="DaemonSet (excerpt)" />
          </Reveal>
          <Reveal delay={0.1}>
            <CodeBlock code={snippets.k8sApply} label="apply + verify" />
          </Reveal>
        </div>

        {/* Step-by-step rollout */}
        <div className="mt-12">
          <Reveal>
            <h4 className="text-lg font-semibold text-ink">{t.deployment.guideTitle}</h4>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.deployment.guideDesc}</p>
          </Reveal>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {t.deployment.guideSteps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <li className="h-full rounded-xl border border-line bg-white/[0.02] p-4">
                  <div className="text-xs font-bold text-cyan">{String(i + 1).padStart(2, "0")}</div>
                  <h5 className="mt-1 text-sm font-semibold text-ink">{s.title}</h5>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* pod-resources socket path */}
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div>
              <h4 className="text-lg font-semibold text-ink">{t.deployment.socketTitle}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.deployment.socketDesc}</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-faint">
                        <th className="px-4 py-3 font-semibold">{t.deployment.socketColDistro}</th>
                        <th className="px-4 py-3 font-semibold">{t.deployment.socketColPath}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socketRows.map((s) => (
                        <tr key={s.path} className="border-t border-line align-top">
                          <td className="px-4 py-3 text-muted">{s.distro}</td>
                          <td className="break-all px-4 py-3 font-mono text-[12px] text-cyan">{s.path}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <CodeBlock code={snippets.socketCheck} label="confirm kubelet root-dir" />
          </Reveal>
        </div>

        {/* Troubleshooting */}
        <div className="mt-12">
          <Reveal>
            <h4 className="text-lg font-semibold text-ink">{t.deployment.troubleshootTitle}</h4>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-faint">
                      <th className="px-4 py-3 font-semibold">{t.deployment.troubleshootColSymptom}</th>
                      <th className="px-4 py-3 font-semibold">{t.deployment.troubleshootColFix}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {troubleshootRows.map((r) => (
                      <tr key={r.symptom} className="border-t border-line align-top">
                        <td className="px-4 py-3 font-medium text-ink">{r.symptom}</td>
                        <td className="px-4 py-3 text-muted">{r.fix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <a
              href={DOCS.deployment}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-medium text-cyan transition hover:text-teal"
            >
              {t.deployment.fullGuide} →
            </a>
          </Reveal>
        </div>
      </div>

      {/* Release images */}
      <div className="mt-14">
        <Reveal>
          <h3 className="text-xl font-semibold text-ink">{t.deployment.imagesTitle}</h3>
          <p className="mt-2 text-sm text-muted">{t.deployment.imagesNote}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-5 overflow-hidden rounded-2xl border border-line">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-faint">
                    <th className="px-4 py-3 font-semibold">Image</th>
                    <th className="px-4 py-3 font-semibold">ROCm</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {releaseImages.map((r) => (
                    <tr key={r.image} className="border-t border-line">
                      <td className="px-4 py-3">
                        <code className="break-all text-[12.5px] text-cyan">{r.image}</code>
                        {r.latest && (
                          <span className="ml-2 rounded-full bg-amd/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amd-2">
                            latest
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{r.rocm}</td>
                      <td className="px-4 py-3 text-muted">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 font-mono text-xs text-faint">{t.deployment.tagFormat}</p>
        </Reveal>
      </div>

      {/* vLLM verification */}
      <div className="mt-14 grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <div className="rounded-2xl border border-line bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold text-ink">{t.deployment.vllmTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.deployment.vllmDesc}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <CodeBlock code={`${snippets.vllmVerify}\n\n${snippets.workloadOutput}`} label="verify pod labels" />
        </Reveal>
      </div>
    </Section>
  );
}
