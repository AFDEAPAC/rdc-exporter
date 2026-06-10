import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { GITHUB_URL } from "../content/data";

/**
 * Nav is the fixed top navigation bar for the page.
 *
 * Link labels come from the active locale via `useI18n`, while the anchor ids
 * are hard-coded to match each `Section` id (and their order mirrors the page).
 * Once the user scrolls past the hero it gains a translucent blurred backdrop so
 * it stays legible over content. The section links collapse into a toggleable
 * grid menu below the `lg` breakpoint; the language switcher and GitHub link
 * remain visible at every width. The mobile menu button exposes `aria-expanded`,
 * and selecting a link closes the menu.
 */
export function Nav() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Subscribe to window scroll to toggle the header backdrop past the hero.
  // Passive listener (we never preventDefault) and removed on unmount.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: { id: string; label: string }[] = [
    { id: "purpose", label: t.nav.purpose },
    { id: "architecture", label: t.nav.architecture },
    { id: "deployment", label: t.nav.deployment },
    { id: "configuration", label: t.nav.configuration },
    { id: "vs-nvidia", label: t.nav.vsNvidia },
    { id: "metrics", label: t.nav.metrics },
    { id: "building", label: t.nav.building },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-line bg-base/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-semibold tracking-tight text-ink">
            RDC <span className="gradient-text">Exporter</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-white/[0.04] hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-muted transition hover:border-cyan/40 hover:text-ink sm:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
            </svg>
            GitHub
          </a>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg border border-line bg-white/[0.03] p-2 text-muted transition hover:text-ink lg:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-base/95 px-5 py-3 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-white/[0.05] hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
