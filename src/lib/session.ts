import { useCallback, useEffect, useState } from "react";
import { EMPTY_BRIEF, type BriefData, type BriefField } from "@/lib/brief";

/**
 * One visitor session, shared by the assistant, the system builder and the
 * contact form.
 *
 * Before this existed each surface kept its own state: the chat learned what
 * the visitor needed and then threw it away, the builder started blank, the
 * form asked for everything again, and the proposal reference was regenerated
 * on every download — so two PDFs from the same conversation carried different
 * numbers. Everything below is the fix for that loss of continuity.
 *
 * Stored in sessionStorage: it should survive navigation and reloads within a
 * visit, but not follow someone across days as if we knew them.
 */

const KEY = "ruah-session-v1";

export type VisitorSession = {
  /** Stable for the whole visit — proposals and messages reference the same id. */
  ref: string;
  startedAt: string;

  /** What they told the assistant, in their own words. */
  need: string;
  /** Goal label from the form, or inferred by the assistant. */
  goal: string;
  budget: string;

  name: string;
  business: string;

  /** Module ids chosen in the builder. */
  modules: string[];
  estimate: number;
  weeks: number;
  /** Builder settings, so a plan from the chat can set them too. */
  speed: number;
  scale: number;

  /**
   * The assistant's conclusion: what the visitor needs, in a few lines.
   * Travels to the WhatsApp hand-off, the quote PDF and the CRM, so nobody
   * has to re-read the whole chat to know what was agreed.
   */
  summary: string;
  /**
   * Bumped whenever the chat pushes a plan into the builder. The builder is
   * already mounted by then, so it can't rely on its initial state — it
   * watches this counter instead.
   */
  planVersion: number;
  /**
   * The brief the current quote was priced for (see briefKey). If the brief
   * changes — or the chat restarts — the quote no longer applies and the
   * estimate has to be recalculated.
   */
  quotedFor: string;
  /** Set by the chat; the builder emits the quote once and clears it. */
  pendingQuote: boolean;
  /**
   * True once the visitor changed the configurator themselves. The builder
   * publishes its default selection on load, so without this flag every lead
   * would arrive in the CRM with a "quoted system" nobody chose.
   */
  planTouched: boolean;

  /**
   * The six things that must be clear before anything is priced. Filled by
   * the chat or the form — same object, so either can pick up where the
   * other left off.
   */
  brief: BriefData;
  /**
   * What they want to achieve — several at once (see lib/goals.ts). Kept
   * beside the brief because `brief.outcome` is one sentence and these are
   * codes the CRM can filter and count.
   */
  goals: string[];
  /** Their own words when "other" is among the goals. */
  goalOther: string;
  /** Offline interview: the field the next answer fills. */
  asking: BriefField | "";
  /** Which option buttons (goals / timeline / budget) are showing in the chat. */
  ask: "none" | "goals" | "timeline" | "budget";
  /** The lead has been saved to the CRM this visit. */
  leadSaved: boolean;

  /** Short transcript so a WhatsApp handoff carries the context. */
  conversation: { role: "user" | "assistant"; content: string }[];
};

function newRef(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RS-${stamp}-${rand}`;
}

function blank(): VisitorSession {
  return {
    ref: newRef(),
    startedAt: new Date().toISOString(),
    need: "",
    goal: "",
    budget: "",
    name: "",
    business: "",
    modules: [],
    estimate: 0,
    weeks: 0,
    speed: 0,
    scale: 2,
    summary: "",
    planVersion: 0,
    quotedFor: "",
    pendingQuote: false,
    planTouched: false,
    brief: { ...EMPTY_BRIEF },
    goals: [],
    goalOther: "",
    asking: "",
    ask: "none",
    leadSaved: false,
    conversation: [],
  };
}

function read(): VisitorSession {
  if (typeof window === "undefined") return blank();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as Partial<VisitorSession>;
    // Merge over a blank so a schema change never crashes an existing tab.
    const base = blank();
    return {
      ...base,
      ...parsed,
      brief: { ...base.brief, ...(parsed.brief ?? {}) },
      goals: Array.isArray(parsed.goals) ? parsed.goals.filter((g) => typeof g === "string") : [],
      ref: parsed.ref || newRef(),
    };
  } catch {
    return blank();
  }
}

function write(s: VisitorSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked — the session still works for this page */
  }
  // Let every mounted component react in the same tick.
  window.dispatchEvent(new CustomEvent("ruah-session", { detail: s }));
}

/**
 * Subscribes to the session. Any component can patch it and every other
 * component updates immediately.
 */
export function useSession() {
  const [session, setSession] = useState<VisitorSession>(blank);

  useEffect(() => {
    setSession(read());
    const onChange = (e: Event) => setSession((e as CustomEvent<VisitorSession>).detail);
    window.addEventListener("ruah-session", onChange);
    return () => window.removeEventListener("ruah-session", onChange);
  }, []);

  const patch = useCallback((changes: Partial<VisitorSession>) => {
    const next = { ...read(), ...changes };
    write(next);
    setSession(next);
  }, []);

  const reset = useCallback(() => {
    const next = blank();
    write(next);
    setSession(next);
  }, []);

  return { session, patch, reset };
}

/** Read-only access for non-React call sites. */
export function getSession(): VisitorSession {
  return read();
}

/**
 * Builds the WhatsApp opener.
 *
 * Written the way a person writes: a greeting, then what they're trying to do
 * in their own words, then the structured detail underneath. The previous
 * version led with a bare field dump, which read like a submitted form rather
 * than someone starting a conversation.
 */
export function composeWhatsAppMessage(opts: {
  session: VisitorSession;
  studio: string;
  labels: {
    greeting: string;
    /** Heading above the assistant's summary. Omit to leave it out. */
    summary?: string;
    goal: string;
    budget: string;
    system: string;
    estimate: string;
    weeks: string;
    ask: string;
    ref: string;
  };
  moduleNames?: string[];
}): string {
  const { session: s, labels: L, moduleNames } = opts;
  const lines: string[] = [L.greeting];

  // The assistant's conclusion beats a raw quote of their first message: it
  // is what the conversation actually established. Without it, the hand-off
  // dropped everything the visitor had just spent several turns explaining.
  if (s.summary.trim() && L.summary) {
    lines.push("", `${L.summary}:`, s.summary.trim());
  } else if (s.need.trim().length > 3) {
    lines.push("", `"${s.need.trim()}"`);
  }

  // A line is only worth sending if it carries information. Placeholder
  // values ("Por definir", "TBD", "—") read as an unfinished form, so they
  // are dropped rather than shipped.
  const EMPTY = /^(por definir|sin definir|tbd|n\/a|—|-)$/i;
  const filled = (v: string) => Boolean(v.trim()) && !EMPTY.test(v.trim());

  const detail: string[] = [];
  if (filled(s.name)) detail.push(filled(s.business) ? `${s.name} · ${s.business}` : s.name);
  if (filled(s.goal)) detail.push(`${L.goal}: ${s.goal}`);
  if (filled(s.budget)) detail.push(`${L.budget}: ${s.budget}`);
  if (detail.length) lines.push("", ...detail);

  if (moduleNames?.length) {
    lines.push("", `${L.system}:`);
    moduleNames.forEach((m) => lines.push(`· ${m}`));
    if (s.estimate > 0) {
      lines.push(
        "",
        `${L.estimate}: $${s.estimate.toLocaleString("en-US")} · ~${s.weeks} ${L.weeks}`,
      );
    }
  }

  lines.push("", L.ask, "", `${L.ref}: ${s.ref}`);
  return lines.join("\n");
}
