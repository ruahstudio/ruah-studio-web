import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DICTIONARIES, LANGS, LANG_META, type Lang, type TranslationKey } from "./locales";
import { EXTRA, type ExtraKey } from "./extra";

const STORAGE_KEY = "ruah.lang";

export type AnyKey = TranslationKey | ExtraKey;

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";

  // An explicit ?lang= wins over everything: it makes the hreflang URLs
  // truthful and lets a language-specific link be shared.
  try {
    const param = new URLSearchParams(window.location.search).get("lang");
    if (param && isLang(param)) return param;
  } catch {
    /* malformed URL */
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isLang(stored)) return stored;
  } catch {
    /* storage blocked */
  }
  const candidates = [...(navigator.languages ?? []), navigator.language ?? ""];
  for (const c of candidates) {
    const base = c.split("-")[0]?.toLowerCase() ?? "";
    if (isLang(base)) return base;
  }
  return "en";
}

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  tr: (key: AnyKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function lookup(lang: Lang, key: AnyKey): string {
  const dict = DICTIONARIES[lang] as Record<string, string>;
  const extra = EXTRA[lang] as Record<string, string>;
  return (
    dict[key] ??
    extra[key] ??
    (DICTIONARIES.en as Record<string, string>)[key] ??
    (EXTRA.en as Record<string, string>)[key] ??
    key
  );
}

export function translate(lang: Lang, key: AnyKey, vars?: Record<string, string | number>): string {
  let out = lookup(lang, key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  useEffect(() => {
    const dir = LANG_META[lang].dir;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: LANG_META[lang].dir,
      setLang,
      tr: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "en",
      dir: "ltr",
      setLang: () => {},
      tr: (key, vars) => translate("en", key, vars),
    };
  }
  return ctx;
}

export { LANGS, LANG_META };
export type { Lang };
