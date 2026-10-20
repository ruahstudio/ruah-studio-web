import { supabase } from "@/integrations/supabase/client";
import { translate, type AnyKey, type Lang } from "@/i18n";
import { budgetLabel, timelineLabel } from "@/lib/agent";
import { budgetFit } from "@/lib/brief";
import { SITE } from "@/lib/content";
import { plainText } from "@/lib/markdown";
import { MODULES, SPEED, estimate, type ModuleId } from "@/lib/pricing";
import { buildProposalPdf, type ProposalInput } from "@/lib/proposal";
import type { VisitorSession } from "@/lib/session";

/**
 * The quote as a file that travels with the lead.
 *
 * Until now the PDF only landed in the visitor's downloads folder: when they
 * then wrote on WhatsApp, John got the text and no document. Now the same
 * document is uploaded before the hand-off and the message carries its link.
 *
 * Why a link and not an attachment: a wa.me link opens a chat with text. No
 * browser can put a file into someone else's WhatsApp. So the "attachment" is
 * a signed URL — private bucket, 90 days, issued by the `quote-link` function
 * because signing needs the service key.
 *
 * Nothing here is allowed to break the hand-off: if the upload or the signing
 * fails, the message goes out without the link and the visitor still gets the
 * PDF downloaded locally.
 */

export type QuoteFile = { path: string; url: string | null };

/** The same numbers the visitor saw, rebuilt for the document. */
export function proposalInput(
  s: VisitorSession,
  lang: Lang,
  studio: string,
  whatsapp: string,
): ProposalInput {
  const t = (k: AnyKey) => translate(lang, k);
  const ids = s.modules.filter((m): m is ModuleId => MODULES.some((mod) => mod.id === m));
  const { total, weeks } = estimate(ids, s.speed, s.scale);
  const fit = budgetFit(ids, s.speed, s.scale, s.brief.budget);
  const label = (id: ModuleId) => t(`mod.${id}` as AnyKey);
  const speedKey = SPEED[s.speed]?.key ?? "standard";

  return {
    client: s.name || s.brief.business,
    studio,
    founder: SITE.founder,
    email: SITE.email,
    whatsapp,
    items: ids.map((id) => ({
      label: label(id),
      description: t(`mod.${id}.hint` as AnyKey),
      price: MODULES.find((m) => m.id === id)?.price ?? 0,
    })),
    total,
    weeks,
    speed: t(`speed.${speedKey}` as AnyKey),
    scale: t(`scale.${s.scale}` as AnyKey),
    lang,
    ref: s.ref,
    summary: plainText(s.summary),
    budgetLabel: budgetLabel(lang, s.brief.budget),
    timelineLabel: timelineLabel(lang, s.brief.timeline),
    phases:
      fit.kind === "phased"
        ? {
            phase1: fit.phase1.map(label),
            phase1Total: fit.phase1Total,
            phase2: fit.phase2.map(label),
          }
        : undefined,
  };
}

/** `leads/RS-202609-1234/cotizacion-RS-202609-1234.pdf` */
export const quotePath = (ref: string) => `leads/${ref}/cotizacion-${ref}.pdf`;

/**
 * Builds the PDF, uploads it and asks for a signed link. Returns the path
 * (stored on the lead) and the link (put in the WhatsApp message), or null
 * when there is nothing to quote or the upload isn't available.
 */
export async function uploadQuote(
  s: VisitorSession,
  lang: Lang,
  studio: string,
  whatsapp: string,
): Promise<QuoteFile | null> {
  if (!s.modules.length || !s.estimate) return null;
  try {
    const { blob } = buildProposalPdf(proposalInput(s, lang, studio, whatsapp));
    const path = quotePath(s.ref);
    const { error } = await supabase.storage.from("quotes").upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) {
      console.error("quote upload failed", error);
      return null;
    }
    return { path, url: null };
  } catch (err) {
    console.error("quote build failed", err);
    return null;
  }
}

/**
 * Signs the uploaded quote. Called after the lead is saved, because the
 * function only signs a file that a stored lead already points at.
 */
export async function signQuote(ref: string, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("quote-link", {
      body: { ref, path },
    });
    const url = (data as { url?: unknown } | null)?.url;
    if (error || typeof url !== "string") return null;
    return url;
  } catch {
    return null;
  }
}
