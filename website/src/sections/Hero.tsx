import { motion } from "framer-motion";
import { useI18n } from "../i18n";
import { OverviewPipeline } from "../diagrams/OverviewPipeline";
import { GITHUB_URL } from "../content/data";

/**
 * Hero is the landing block at the top of the page (`#top`).
 *
 * It presents the product identity, tagline, primary calls to action, the
 * animated end-to-end `OverviewPipeline` diagram, and a row of headline stats.
 * All copy comes from the active locale (`t.hero`); the stat cards are driven by
 * `t.hero.stats`, so their count is locale-data-driven rather than fixed here.
 * Unlike most sections it animates on mount (not on scroll), since it is always
 * the first thing in view. The quickstart/docs CTAs are in-page anchors that
 * must stay in sync with the `Deployment`/`Purpose` section ids.
 */
export function Hero() {
  const { t } = useI18n();

  return (
    <section id="top" className="relative overflow-hidden px-5 pb-12 pt-28 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-amd node-pulse" />
            {t.hero.eyebrow}
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-7xl">
            {t.hero.titleLead}{" "}
            <span className="gradient-text">{t.hero.titleAccent}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t.hero.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#deployment"
              className="rounded-lg bg-gradient-to-r from-amd to-amd-2 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(237,28,36,0.7)] transition hover:brightness-110"
            >
              {t.hero.ctaQuickstart}
            </a>
            <a
              href="#purpose"
              className="rounded-lg border border-line bg-white/[0.03] px-5 py-3 text-sm font-semibold text-ink transition hover:border-cyan/40 hover:text-cyan"
            >
              {t.hero.ctaDocs}
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line bg-white/[0.03] px-5 py-3 text-sm font-semibold text-ink transition hover:border-cyan/40 hover:text-cyan"
            >
              {t.hero.ctaGithub}
            </a>
          </div>
        </motion.div>

        <motion.div
          className="mt-14 glass rounded-2xl p-5 sm:p-8"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <OverviewPipeline />
        </motion.div>

        <motion.div
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          {t.hero.stats.map((s) => (
            <div key={s.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="text-base font-bold text-ink">{s.title}</div>
              <div className="mt-1 text-xs text-faint">{s.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
