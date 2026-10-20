/**
 * Project assistant transport.
 *
 * The assistant runs discovery: every turn it replies AND reports which of
 * the six brief fields are now known (see lib/brief.ts). The site uses that
 * to show progress, to render budget/timeline as buttons, and to unlock the
 * estimate only when the project is clear.
 *
 * Live replies come from the Supabase Edge Function `project-assistant`.
 * When it isn't deployed, a limit is hit or it fails, the offline mode runs
 * the same discovery as a scripted interview — so the flow never breaks and
 * never costs anything.
 */

import { supabase } from "@/integrations/supabase/client";
import { translate, type AnyKey, type Lang } from "@/i18n";
import {
  BRIEF_FIELDS,
  EMPTY_BRIEF,
  mergeBrief,
  type BriefData,
  type BriefField,
} from "@/lib/brief";
import { clampScale, isModuleId, speedIndex, type ModuleId } from "@/lib/pricing";
import { goalsToModules } from "@/lib/goals";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type Ask = "none" | "goals" | "timeline" | "budget";

export type AgentTurn = {
  text: string;
  brief: BriefData;
  /** Which fixed options to show as buttons under the reply. */
  ask: Ask;
  /** Offline mode: the field the next answer fills. */
  asking: BriefField | "";
  live: boolean;
  /** A limit was reached: stop the interview and offer a human. */
  limited?: boolean;
};

const t = (lang: Lang, k: AnyKey, vars?: Record<string, string>) => translate(lang, k, vars);

export function timelineLabel(lang: Lang, code: string): string {
  return code ? t(lang, `tl.${code}` as AnyKey) : "";
}
export function budgetLabel(lang: Lang, code: string): string {
  return code ? t(lang, `bd.${code}` as AnyKey) : "";
}

const firstMissing = (b: BriefData): BriefField | undefined =>
  BRIEF_FIELDS.find((f) => !b[f].trim());

/** Says back what was understood. Used when the brief becomes complete. */
export function conclusionText(b: BriefData, lang: Lang): string {
  const lines = [
    `• ${t(lang, "card.business")}: ${b.business}`,
    `• ${t(lang, "card.problem")}: ${b.problem}`,
    `• ${t(lang, "card.outcome")}: ${b.outcome}`,
    `• ${t(lang, "card.current")}: ${b.current}`,
    `• ${t(lang, "card.timeline")}: ${timelineLabel(lang, b.timeline)} · ${t(lang, "card.budget")}: ${budgetLabel(lang, b.budget)}`,
  ].join("\n");
  return t(lang, "agent.conclusion", { lines });
}

/**
 * Offline discovery: a scripted interview over the same six fields.
 *
 * The first message answers the greeting ("what are you trying to solve?"),
 * so it becomes the problem. Each later answer fills the field that was just
 * asked. Timeline and budget are only ever set by their buttons; typed text
 * while those are pending re-asks with the buttons.
 */
export function offlineTurn(
  lastUser: string,
  known: BriefData,
  asking: BriefField | "",
  lang: Lang,
): AgentTurn {
  const b = { ...known };
  const said = lastUser.trim();
  if (said) {
    if (asking && asking !== "timeline" && asking !== "budget") b[asking] = said.slice(0, 400);
    else if (!asking && !b.problem) b.problem = said.slice(0, 400);
  }
  const missing = firstMissing(b);
  if (!missing) {
    return { text: conclusionText(b, lang), brief: b, ask: "none", asking: "", live: false };
  }
  return {
    text: t(lang, `q.${missing}` as AnyKey),
    brief: b,
    ask:
      missing === "timeline" || missing === "budget"
        ? missing
        : missing === "outcome"
          ? "goals"
          : "none",
    asking: missing,
    live: false,
  };
}

/**
 * One discovery turn. `known` includes anything the visitor set with buttons,
 * which always wins over what the model reads from the text.
 */
export async function askAgent(
  messages: ChatMessage[],
  lang: Lang,
  known: BriefData = EMPTY_BRIEF,
  asking: BriefField | "" = "",
): Promise<AgentTurn> {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const offline = () => offlineTurn(last, known, asking, lang);
  try {
    const { data, error } = await supabase.functions.invoke("project-assistant", {
      body: { messages, lang, brief: known },
    });
    if (error || !data) return offline();
    if (data.limited === "conversation" || data.limited === "visitor") {
      return { ...offline(), text: t(lang, "agent.limit"), ask: "none", limited: true };
    }
    if (data.limited || typeof data.text !== "string") return offline();

    const brief = mergeBrief(known, data.brief ?? {});
    const ask: Ask =
      data.ask === "timeline" || data.ask === "budget" || data.ask === "goals" ? data.ask : "none";
    // If the model forgot to ask for a still-missing option, show its
    // buttons anyway: the brief can't complete without them.
    const missing = firstMissing(brief);
    const fallbackAsk: Ask =
      ask === "none" && (missing === "timeline" || missing === "budget" || missing === "outcome")
        ? missing === "outcome"
          ? "goals"
          : missing
        : ask;
    return { text: data.text, brief, ask: fallbackAsk, asking: missing ?? "", live: true };
  } catch {
    return offline();
  }
}

// ── Brief: the hand-off ──────────────────────────────────────────────────

export type Brief = {
  /** The assistant's conclusion, written for John. */
  summary: string;
  /** Ordered most essential first — phase 1 is a prefix of this list. */
  modules: ModuleId[];
  speed: number;
  scale: number;
  missing: string[];
  /** True when the model wrote it; false for the free local fallback. */
  live: boolean;
};

/**
 * Keyword → module map for the offline brief. Generous with synonyms across
 * the site's languages: a false positive only adds a module the visitor can
 * untick, a miss leaves them with an empty estimate. Order = priority.
 */
const MODULE_HINTS: [ModuleId, RegExp][] = [
  [
    "automation",
    /(automat|repetit|manual|whatsapp|correo|e-?mail|excel|sheets|hojas?|integr|inventario|inventory|factur|invoice|cuadr)/i,
  ],
  ["crm", /\b(crm|clientes?|leads?|seguimiento|customers?|kunden|prospect)/i],
  [
    "dashboard",
    /(dashboard|report|m[eé]tric|indicador|estad[ií]st|ventas|sales|kpi|tablero|panel)/i,
  ],
  [
    "ai",
    /\b(ia|ai|ki|inteligencia|intelligence|chatbot|bot|asistente|assistant|agente|gpt|claude)\b/i,
  ],
  ["landing", /\b(web|sitio|p[aá]gina|landing|site|website|seite|pagina)\b/i],
  ["calculator", /(calcul|cotiz|simulad|quote|rechner|devis|preventiv)/i],
  ["auth", /\b(login|usuarios?|roles?|accesos?|cuentas|users?|accounts?|permis)/i],
  ["brand", /\b(marca|logo|brand|identidad|identity|marque|marke)\b/i],
];

/** Free, deterministic brief built from the structured answers. */
export function offlineBrief(
  known: BriefData,
  lang: Lang,
  messages: ChatMessage[] = [],
  goals: readonly string[] = [],
): Brief {
  const text = [
    known.problem,
    known.outcome,
    known.current,
    known.business,
    ...messages.filter((m) => m.role === "user").map((m) => m.content),
  ].join(" \n ");
  // Ticked goals are a direct statement of intent, so they lead; the keyword
  // reading then adds whatever the conversation revealed on top.
  const fromGoals = goalsToModules(goals);
  const fromText = MODULE_HINTS.filter(([, re]) => re.test(text)).map(([id]) => id);
  const modules = [...fromGoals, ...fromText.filter((m) => !fromGoals.includes(m))];
  return {
    summary: t(lang, "agent.summaryTemplate", {
      business: known.business || "—",
      problem: known.problem || "—",
      outcome: known.outcome || "—",
      current: known.current || "—",
      timeline: timelineLabel(lang, known.timeline) || "—",
      budget: budgetLabel(lang, known.budget) || "—",
    }),
    modules: modules.length ? modules : ["automation"],
    speed: 0,
    scale: 2,
    missing: [],
    live: false,
  };
}

/**
 * Asks the model for the hand-off: a summary for John plus the modules,
 * ordered by priority. Prices are NOT part of the answer — the caller runs
 * the modules through lib/pricing.ts. Falls back to `offlineBrief` whenever
 * the model is unavailable, so the estimate always works.
 */
export async function requestBrief(
  messages: ChatMessage[],
  lang: Lang,
  known: BriefData,
  goals: readonly string[] = [],
): Promise<Brief> {
  const local = () => offlineBrief(known, lang, messages, goals);
  try {
    const { data, error } = await supabase.functions.invoke("project-assistant", {
      body: { mode: "brief", messages, lang, brief: known },
    });
    const b = data?.brief;
    if (error || !b || typeof b.summary !== "string") return local();
    const modules = (Array.isArray(b.modules) ? b.modules : []).filter(isModuleId);
    return {
      summary: b.summary,
      modules: modules.length ? modules : local().modules,
      speed: speedIndex(b.speed),
      scale: clampScale(b.scale),
      missing: Array.isArray(b.missing) ? b.missing.map(String).slice(0, 3) : [],
      live: true,
    };
  } catch {
    return local();
  }
}
