import { useI18n } from "../i18n";
import { Logo } from "./Logo";
import { GITHUB_URL } from "../content/data";

/**
 * Footer carries the documentation/resource links and developer-team
 * attribution shown at the bottom of every view.
 *
 * Internal documentation links are built as absolute GitHub `blob/main` URLs
 * (via `repoDoc`) rather than relative paths, so they resolve no matter where
 * the portable single-file build is hosted (including `file://`). Link/heading
 * copy is localized through `useI18n`; the doc paths, external resource URLs,
 * and the maintainer mailto are intentionally language-neutral constants.
 */
export function Footer() {
  const { t } = useI18n();
  // Resolve a repo-relative doc path to an absolute GitHub blob URL so links
  // work regardless of where the static bundle is served from.
  const repoDoc = (p: string) => `${GITHUB_URL}/blob/main/${p}`;

  return (
    <footer className="relative mt-10 border-t border-line bg-white/[0.015]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-base font-semibold text-ink">
              RDC <span className="gradient-text">Exporter</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-faint">
            {t.footer.disclaimer}
          </p>
          <div className="mt-5 rounded-xl border border-line bg-white/[0.02] p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-faint">
              {t.footer.builtBy}
            </div>
            <div className="mt-2 text-sm font-semibold text-ink">{t.footer.team}</div>
            <a
              href="mailto:Bill.Ku@amd.com"
              className="mt-1 inline-block text-sm text-cyan transition hover:text-teal"
            >
              {t.footer.author}
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">{t.footer.docsHeading}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a className="text-muted transition hover:text-cyan" href={repoDoc("docs/configuration/README.md")} target="_blank" rel="noreferrer">
                {t.footer.docConfig}
              </a>
            </li>
            <li>
              <a className="text-muted transition hover:text-cyan" href={repoDoc("docs/deployment/k8s/README.md")} target="_blank" rel="noreferrer">
                {t.footer.docDeploy}
              </a>
            </li>
            <li>
              <a className="text-muted transition hover:text-cyan" href={repoDoc("docs/metrics.md")} target="_blank" rel="noreferrer">
                {t.footer.docMetrics}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">{t.footer.resourcesHeading}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a className="text-muted transition hover:text-cyan" href="https://github.com/ROCm/rdc" target="_blank" rel="noreferrer">
                {t.footer.rocmRdc}
              </a>
            </li>
            <li>
              <a className="text-muted transition hover:text-cyan" href="https://github.com/ROCm/k8s-device-plugin" target="_blank" rel="noreferrer">
                {t.footer.devicePlugin}
              </a>
            </li>
            <li>
              <a className="text-muted transition hover:text-cyan" href="https://github.com/vllm-project/vllm" target="_blank" rel="noreferrer">
                {t.footer.vllm}
              </a>
            </li>
            <li>
              <a className="text-muted transition hover:text-cyan" href={GITHUB_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-faint sm:flex-row sm:px-8">
          <span>RDC Exporter — Prometheus exporter for AMD GPUs.</span>
          <a href="#top" className="transition hover:text-cyan">
            {t.common.backToTop} ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
