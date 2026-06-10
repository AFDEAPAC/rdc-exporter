import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Content, Lang } from "../content/types";
import { en } from "../content/en";
import { zhTW } from "../content/zhTW";
import { zhCN } from "../content/zhCN";

const dictionaries: Record<Lang, Content> = {
  en,
  zhTW,
  zhCN,
};

/**
 * Display order of the supported locales for the language switcher.
 *
 * The switcher iterates this array, so the sequence here is the on-screen order
 * of the options. It must stay in sync with the `Lang` union and `dictionaries`;
 * a locale missing here would simply never be offered in the UI.
 */
export const LANG_ORDER: Lang[] = ["en", "zhTW", "zhCN"];

const STORAGE_KEY = "rdc-exporter-lang";

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Content;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Resolves the locale to start the app in before any user interaction.
 *
 * Precedence:
 * 1. An explicit prior choice saved under `STORAGE_KEY` in `localStorage` wins.
 * 2. Otherwise the browser's preferred languages are matched against the
 *    supported set: `zh-TW` / `zh-Hant` / `hk` / `mo` -> Traditional, any other
 *    `zh` -> Simplified, an `en*` tag -> English.
 * 3. Falls back to English when nothing matches.
 *
 * Reads browser globals, so it is guarded with a `window` check to stay safe in
 * non-browser contexts. Used only as the `useState` initializer in
 * {@link I18nProvider}; the persistence write-back happens there, not here.
 */
function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "en";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && saved in dictionaries) return saved as Lang;

  const candidates = navigator.languages ?? [navigator.language];
  for (const raw of candidates) {
    const tag = raw.toLowerCase();
    if (!tag.startsWith("zh")) {
      if (tag.startsWith("en")) return "en";
      continue;
    }
    if (
      tag.includes("tw") ||
      tag.includes("hant") ||
      tag.includes("hk") ||
      tag.includes("mo")
    ) {
      return "zhTW";
    }
    return "zhCN";
  }
  return "en";
}

/**
 * I18nProvider owns the active locale for the whole app and supplies the
 * resolved copy to every descendant through React context.
 *
 * The initial locale is derived once from {@link detectInitialLang}. Whenever it
 * changes, the choice is persisted and the document language is updated (see the
 * effect below), so a reload reopens in the same language and assistive tech /
 * the browser see the correct `lang`. Mount this once near the root; components
 * read the value via {@link useI18n}. The context value is memoized so consumers
 * only re-render when the locale actually changes.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectInitialLang);

  // Sync the locale to the outside world on every change: remember the choice
  // for next visit and reflect it on <html lang> for a11y / browser behavior.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang =
      lang === "en" ? "en" : lang === "zhTW" ? "zh-Hant" : "zh-Hans";
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to read and control the active locale from anywhere in the tree.
 *
 * Returns the current `lang`, a `setLang` setter that switches (and persists)
 * the locale, and `t`, the fully resolved `Content` dictionary for that locale
 * which all UI copy is read from. Throws if called outside {@link I18nProvider}
 * so a missing provider fails loudly at development time rather than rendering
 * blank strings.
 */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
