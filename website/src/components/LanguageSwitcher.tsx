import { useEffect, useRef, useState } from "react";
import { LANG_ORDER, useI18n } from "../i18n";
import { en } from "../content/en";
import { zhTW } from "../content/zhTW";
import { zhCN } from "../content/zhCN";
import type { Lang } from "../content/types";

const names: Record<Lang, string> = {
  en: en.langName,
  zhTW: zhTW.langName,
  zhCN: zhCN.langName,
};

const short: Record<Lang, string> = {
  en: "EN",
  zhTW: "繁",
  zhCN: "简",
};

/**
 * LanguageSwitcher is the locale dropdown shown in the sticky header.
 *
 * It reads the active `lang` and `setLang` from `useI18n`, lists the supported
 * locales in `LANG_ORDER`, and labels each with its native name; the trigger
 * shows a compact short code. Selecting an option updates the global locale
 * (which the provider persists) and closes the menu. Because it lives in a
 * fixed, blurred header, the open menu closes on outside `mousedown` and on
 * `Escape` so it never lingers over scrolled content. The trigger exposes
 * `aria-haspopup`/`aria-expanded` and the menu uses listbox/option roles with
 * `aria-selected` for the current locale.
 */
export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-muted transition hover:border-cyan/40 hover:text-ink"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        <span>{short[lang]}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-line bg-surface-2 shadow-2xl"
        >
          {LANG_ORDER.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === lang}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/[0.05] ${
                  code === lang ? "text-cyan" : "text-muted"
                }`}
              >
                <span>{names[code]}</span>
                {code === lang && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
