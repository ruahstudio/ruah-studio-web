import { translate, type Lang } from "@/i18n";
import { composeHandoff, saveLead, type Contact } from "@/lib/leads";
import { signQuote, uploadQuote } from "@/lib/quote";
import { getSession } from "@/lib/session";

/**
 * The WhatsApp hand-off, as one operation that cannot strand the visitor.
 *
 * The previous version opened `about:blank` inside the click (correct — a
 * window.open() after an await is blocked as a popup) and only pointed it at
 * WhatsApp once the quote had been built, uploaded, saved and signed. Four
 * network calls with no timeout and no try/catch: the moment any of them
 * rejected, the exception escaped, the tab was never redirected, and the
 * visitor sat looking at a blank page forever — which is exactly what John
 * reported.
 *
 * Three things changed:
 *   · the tab opens on a real holding page, with a working WhatsApp link and
 *     a meta-refresh, so it reaches WhatsApp even if this script dies;
 *   · the enrichment work is capped, so a slow or unreachable Supabase
 *     delays the hand-off by seconds, not forever;
 *   · the redirect happens in a `finally`, so every path ends in WhatsApp.
 *
 * The lead still reaches the CRM whenever the insert succeeds; losing the
 * quote link is acceptable, losing the conversation is not.
 */

/** How long the quote/lead/sign chain may hold the hand-off. */
const ENRICH_TIMEOUT_MS = 7000;
/** Belt and braces: if our own script never comes back, the tab goes anyway. */
const META_REFRESH_SECONDS = 15;

export type HandoffResult = {
  url: string;
  /** Path of the uploaded quote, when there was one. */
  quotePath: string | null;
  /** True when the lead row was written. */
  saved: boolean;
};

export function waUrl(whatsapp: string, text: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Opens the tab synchronously, inside the click, so it isn't blocked. */
export function openHandoffTab(fallbackUrl: string, lang: Lang): Window | null {
  const tab = window.open("about:blank", "_blank");
  if (!tab) return null;
  tab.opener = null;
  try {
    const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
    const safe = fallbackUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    tab.document.write(`<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="${META_REFRESH_SECONDS};url=${safe}">
<title>${t("wa.opening")}</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0a0d14; color:#e8ecf2; font-family:ui-sans-serif,system-ui,sans-serif; padding:24px }
  .box { text-align:center; max-width:28rem }
  .dot { width:10px; height:10px; border-radius:999px; background:#c8ff58; display:inline-block;
         animation:p 1.1s ease-in-out infinite }
  @keyframes p { 0%,100%{opacity:.25} 50%{opacity:1} }
  p { margin:18px 0 0; font-size:14px; line-height:1.6; color:#9aa4b2 }
  a { display:inline-block; margin-top:22px; padding:12px 20px; border:1px solid #c8ff58;
      color:#c8ff58; text-decoration:none; font-size:12px; letter-spacing:.14em;
      text-transform:uppercase; font-family:ui-monospace,monospace }
</style></head>
<body><div class="box"><span class="dot"></span>
<p>${t("wa.opening")}</p>
<a href="${safe}">${t("wa.openNow")}</a>
</div></body></html>`);
    tab.document.close();
  } catch {
    // Writing into the new document can fail in locked-down browsers. The tab
    // still exists and still gets redirected below, so this is not fatal.
  }
  return tab;
}

function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), ms);
    work.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        console.error("handoff step failed", err);
        resolve(fallback);
      },
    );
  });
}

/**
 * Saves the lead, uploads and signs the quote, then sends `tab` to WhatsApp.
 * Returns what actually happened so the caller can store the quote path.
 */
export async function completeHandoff({
  tab,
  contact,
  lang,
  channel,
  siteName,
  whatsapp,
}: {
  tab: Window | null;
  contact: Contact;
  lang: Lang;
  channel: "chat" | "form";
  siteName: string;
  whatsapp: string;
}): Promise<HandoffResult> {
  // Known good from the first millisecond: if everything below fails, this is
  // still a complete message to John.
  const plain: HandoffResult = {
    url: waUrl(whatsapp, composeHandoff(getSession(), contact.name, lang, null)),
    quotePath: null,
    saved: false,
  };

  const enrich = async (): Promise<HandoffResult> => {
    const file = await uploadQuote(getSession(), lang, siteName, whatsapp);
    const { error } = await saveLead(getSession(), contact, lang, channel, file?.path ?? null);
    if (error) console.error("lead insert failed", error);
    const quoteUrl = file ? await signQuote(getSession().ref, file.path) : null;
    return {
      url: waUrl(whatsapp, composeHandoff(getSession(), contact.name, lang, quoteUrl)),
      quotePath: file?.path ?? null,
      saved: !error,
    };
  };

  // On timeout the work keeps running in the background — the lead still
  // lands in the CRM, it just doesn't get to delay the hand-off.
  let result = plain;
  try {
    result = await withTimeout(enrich(), ENRICH_TIMEOUT_MS, plain);
  } finally {
    // Every path ends here. The tab never stays blank.
    if (tab && !tab.closed) tab.location.href = result.url;
    else if (!tab) window.location.href = result.url;
  }
  return result;
}
