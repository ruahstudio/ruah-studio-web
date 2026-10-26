import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ruah-theme";

/**
 * Browser-chrome colour per theme, kept in sync with --background in
 * styles.css. On a phone this paints the address bar and the overscroll area;
 * a single hardcoded dark value framed the light theme in near-black, which
 * read as "the page is grey" even when the page itself was white.
 */
export const THEME_COLOR = { light: "#fbfaf8", dark: "#090e12" } as const;

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };

const ThemeContext = createContext<Ctx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

/**
 * Inline script injected before paint so the correct theme class is on <html>
 * before the first frame. Without this the page flashes the wrong theme on
 * every load, which is the single most common tell of a bolted-on dark mode.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem("${STORAGE_KEY}");
var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark",d);
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",d?"${THEME_COLOR.dark}":"${THEME_COLOR.light}");
}catch(e){document.documentElement.classList.add("dark");}})();`;

function apply(theme: Theme) {
  const root = document.documentElement;
  const dark = theme === "dark";
  root.classList.toggle("dark", dark);
  // `color-scheme` is set in styles.css off this same class — including the
  // "only light" that stops Chrome for Android force-darkening the page.
  // Writing it here as an inline style too did nothing except put a `style`
  // attribute on <html> that the server had not rendered, which is exactly
  // what React was reporting as a hydration mismatch on every page load.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? THEME_COLOR.dark : THEME_COLOR.light);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Read whatever the init script already decided, so state and DOM agree.
  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  // Follow the OS only while the user hasn't chosen explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const next: Theme = e.matches ? "dark" : "light";
      setThemeState(next);
      apply(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked — the theme still applies for this session */
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark"),
    [setTheme],
  );

  return <ThemeContext value={{ theme, setTheme, toggle }}>{children}</ThemeContext>;
}

export function useTheme() {
  return use(ThemeContext);
}
