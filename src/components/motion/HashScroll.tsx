import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Makes `/#section` links actually land on the section.
 *
 * The landing page is server-rendered, but several of its sections only
 * appear once their CMS query resolves in the browser. So when someone opened
 * `/#pricing` directly — or followed a header link from /about — the browser
 * looked for `#pricing` while parsing the HTML, found nothing, and never
 * scrolled. The section then mounted a moment later with no one left to jump
 * to it, which is exactly what made #we-build, #pricing and #faq look broken.
 *
 * Three entry points all end up here:
 *   · first load with a hash in the URL  → retry until the section mounts
 *   · a click on an in-page `#` link     → intercepted, so the offset applies
 *   · router navigation carrying a hash  → /about → "/" + #faq
 *
 * The offset keeps the heading clear of the fixed header, which the browser's
 * own anchor jump does not account for.
 */

/** Height of the floating header, plus breathing room. */
const HEADER_OFFSET = 96;
/** Stop waiting for a section that is never going to arrive. */
const GIVE_UP_MS = 2500;

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scrolls to `#id` if it exists yet. Returns false when it doesn't. */
export function scrollToHash(hash: string, smooth = true): boolean {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: smooth && !prefersReduced() ? "smooth" : "auto",
  });

  // Move keyboard focus as well, so the jump isn't purely visual.
  const had = el.hasAttribute("tabindex");
  if (!had) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  if (!had) el.removeAttribute("tabindex");
  return true;
}

/** Scrolls now, or as soon as the target shows up. */
function scrollWhenReady(hash: string): () => void {
  if (scrollToHash(hash)) return () => {};

  let settled = false;
  const stop = () => {
    settled = true;
    observer.disconnect();
    window.clearTimeout(timer);
  };
  const attempt = () => {
    if (settled) return;
    if (scrollToHash(hash)) stop();
  };
  const observer = new MutationObserver(attempt);
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = window.setTimeout(stop, GIVE_UP_MS);
  return stop;
}

export function HashScroll() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Router-driven hashes, including the very first render.
  useEffect(() => {
    if (!hash) return;
    return scrollWhenReady(`#${hash.replace(/^#/, "")}`);
  }, [hash, pathname]);

  // The hash present in the URL at load time doesn't always reach the router
  // (a direct hit on /#pricing is handled by the browser, which finds nothing).
  useEffect(() => {
    if (!window.location.hash) return;
    return scrollWhenReady(window.location.hash);
  }, []);

  // In-page anchors and back/forward.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;
      // Only take over when the section is really on this page; otherwise let
      // the router or the browser deal with it.
      if (!document.getElementById(decodeURIComponent(href.slice(1)))) return;
      e.preventDefault();
      if (window.location.hash !== href) history.pushState(null, "", href);
      scrollToHash(href);
    };
    const onHashChange = () => {
      if (window.location.hash) scrollToHash(window.location.hash);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}
