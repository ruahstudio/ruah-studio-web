import { supabase } from "@/integrations/supabase/client";
import { translate, type AnyKey, type Lang } from "@/i18n";
import { plainText, waText } from "@/lib/markdown";
import { budgetLabel, timelineLabel } from "@/lib/agent";
import { budgetFit, leadScore, type Fit, type Score } from "@/lib/brief";
import { estimate, type ModuleId } from "@/lib/pricing";
import type { VisitorSession } from "@/lib/session";

/**
 * The end of the sales flow, shared by the chat and the form so both save
 * the same lead and send the same hand-off. Two copies of this logic is how
 * the CRM ended up receiving different data depending on which door the
 * visitor used.
 */

export type Quote = {
  modules: ModuleId[];
  total: number;
  weeks: number;
  fit: Fit;
  score: Score;
};

/** The quote as the visitor saw it, from the one price list. */
export function quoteFor(s: VisitorSession): Quote {
  const modules = s.modules.filter((m): m is ModuleId => typeof m === "string") as ModuleId[];
  const { total, weeks } = estimate(modules, s.speed, s.scale);
  const fit = budgetFit(modules, s.speed, s.scale, s.brief.budget);
  return { modules, total, weeks, fit, score: leadScore(s.brief, fit) };
}

export type Contact = {
  name: string;
  /** Digits only, E.164 without "+". */
  phone: string;
  email: string;
  instagram: string | null;
};

export async function saveLead(
  s: VisitorSession,
  contact: Contact,
  lang: Lang,
  channel: "chat" | "form",
  /** Where the uploaded quote lives, when there was one. */
  quotePath: string | null = null,
) {
  const q = quoteFor(s);
  const transcript = s.conversation
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  return supabase.from("leads").insert({
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    instagram: contact.instagram,
    business: s.brief.business,
    problem: s.brief.problem,
    goal: s.brief.outcome,
    goals: s.goals,
    goal_other: s.goalOther.trim() || null,
    budget: s.brief.budget,
    timeline: s.brief.timeline,
    brief: s.brief,
    ref: s.ref,
    lang,
    source: `${channel}:${s.ref}`,
    chat_summary: s.summary.trim() ? plainText(s.summary).slice(0, 2000) : null,
    chat_transcript: transcript.length ? transcript : null,
    modules: q.modules,
    estimate_usd: q.total || null,
    weeks: q.weeks || null,
    budget_fit: q.fit.kind,
    score: q.score,
    quote_path: quotePath,
  });
}

/**
 * The WhatsApp message John receives. Written as the visitor would write it,
 * but carrying everything he needs to answer with a proposal instead of with
 * questions: the conclusion, budget and deadline, the quoted system, how it
 * sits against the budget, and the reference that matches the PDF and CRM.
 */
export function composeHandoff(
  s: VisitorSession,
  name: string,
  lang: Lang,
  /** Signed link to the quote PDF, when it could be uploaded and signed. */
  quoteUrl: string | null = null,
): string {
  const tr = (k: AnyKey, v?: Record<string, string>) => translate(lang, k, v);
  const q = quoteFor(s);
  const mods = q.modules.map((m) => tr(`mod.${m}` as AnyKey)).join(" · ");
  const lines: string[] = [tr("wa.intro", { name })];

  if (s.summary.trim()) lines.push("", `*${tr("wa.summary")}*`, waText(s.summary));

  const meta = [
    s.brief.budget && `${tr("wa.budget")}: ${budgetLabel(lang, s.brief.budget)}`,
    s.brief.timeline && `${tr("wa.timeline")}: ${timelineLabel(lang, s.brief.timeline)}`,
  ].filter(Boolean);
  // The offline summary already states budget and deadline; don't say it twice.
  const said = s.brief.budget && s.summary.includes(budgetLabel(lang, s.brief.budget));
  if (meta.length && !said) lines.push("", meta.join(" · "));

  if (q.modules.length) {
    lines.push(
      "",
      `*${tr("wa.system")}:* ${mods}`,
      `${tr("wa.estimate2")}: $${q.total.toLocaleString("en-US")} · ~${q.weeks} ${tr("wa.weeks2")}`,
    );
    if (q.fit.kind === "phased") {
      lines.push(
        tr("wa.fitPhased", {
          modules: q.fit.phase1.map((m) => tr(`mod.${m}` as AnyKey)).join(" · "),
          total: `$${q.fit.phase1Total.toLocaleString("en-US")}`,
        }),
      );
    } else if (q.fit.kind === "within") {
      lines.push(tr("wa.fitWithin"));
    } else if (q.fit.kind === "below") {
      lines.push(tr("wa.fitBelow"));
    }
  }

  // The document itself. WhatsApp can't attach a file through a wa.me link,
  // so the attachment is this link — and it opens as a card in the chat.
  if (quoteUrl) lines.push("", `${tr("wa.quoteFile")}: ${quoteUrl}`);

  lines.push("", tr("wa.ask2"), "", `${tr("wa.ref")}: ${s.ref}`);
  return lines.join("\n");
}
