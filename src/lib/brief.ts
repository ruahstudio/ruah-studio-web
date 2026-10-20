import { estimate, type ModuleId } from "@/lib/pricing";

/**
 * The project brief: the six things that must be clear before anything is
 * priced.
 *
 * Both the chat and the form fill the same brief, and nothing downstream —
 * estimate, quote, WhatsApp hand-off, CRM — unlocks until it is complete. A
 * project quoted without knowing the business, the problem, the outcome, how
 * it's done today, the deadline and the budget is a guess; a guess becomes a
 * scope dispute later.
 */

export const BRIEF_FIELDS = [
  "problem",
  "business",
  "outcome",
  "current",
  "timeline",
  "budget",
] as const;
export type BriefField = (typeof BRIEF_FIELDS)[number];
export type BriefData = Record<BriefField, string>;

export const EMPTY_BRIEF: BriefData = {
  problem: "",
  business: "",
  outcome: "",
  current: "",
  timeline: "",
  budget: "",
};

/** Timeline and budget are chosen from fixed options, never typed. */
export const TIMELINES = ["urgent", "month", "quarter", "exploring"] as const;
export type Timeline = (typeof TIMELINES)[number];

export const BUDGETS = ["lt100", "100_300", "300_600", "600_1000", "1000_plus", "unsure"] as const;
export type Budget = (typeof BUDGETS)[number];

/** Upper bound of each budget range, in USD. null = not stated. */
export const BUDGET_MAX: Record<Budget, number | null> = {
  lt100: 100,
  "100_300": 300,
  "300_600": 600,
  "600_1000": 1000,
  "1000_plus": Number.POSITIVE_INFINITY,
  unsure: null,
};

/** How the stated deadline maps onto the configurator's pace. */
export const TIMELINE_SPEED: Record<Timeline, number> = {
  urgent: 2,
  month: 1,
  quarter: 0,
  exploring: 0,
};

export const isTimeline = (v: unknown): v is Timeline =>
  typeof v === "string" && (TIMELINES as readonly string[]).includes(v);
export const isBudget = (v: unknown): v is Budget =>
  typeof v === "string" && (BUDGETS as readonly string[]).includes(v);

/** Every field has a real answer. Budget "unsure" counts: it was asked and answered. */
export function isBriefReady(b: BriefData): boolean {
  return (
    BRIEF_FIELDS.every((f) => b[f].trim().length > 0) &&
    isTimeline(b.timeline) &&
    isBudget(b.budget)
  );
}

/** Identifies one exact brief: a quote is valid only for the brief it priced. */
export function briefKey(b: BriefData): string {
  return BRIEF_FIELDS.map((f) => b[f].trim()).join("\u241f");
}

export function briefProgress(b: BriefData): number {
  return BRIEF_FIELDS.filter((f) => b[f].trim().length > 0).length;
}

/**
 * Merge a newer reading into what's known. An empty value never erases a
 * filled one, and timeline/budget only accept a valid option — the model
 * can't overwrite a chip the visitor pressed with free text.
 */
export function mergeBrief(
  known: BriefData,
  incoming: Partial<Record<string, unknown>>,
): BriefData {
  const out = { ...known };
  for (const f of BRIEF_FIELDS) {
    const v = incoming[f];
    if (typeof v !== "string" || !v.trim()) continue;
    if (f === "timeline" && !isTimeline(v)) continue;
    if (f === "budget" && !isBudget(v)) continue;
    if ((f === "timeline" || f === "budget") && known[f]) continue; // chips win
    out[f] = v.trim().slice(0, 400);
  }
  return out;
}

export type Fit =
  | { kind: "unknown" } // budget "unsure"
  | { kind: "within"; margin: number }
  | {
      kind: "phased";
      phase1: ModuleId[];
      phase1Total: number;
      phase2: ModuleId[];
    }
  | { kind: "below"; smallest: number }; // not even the first module fits

/**
 * Compare a plan with the stated budget.
 *
 * If it doesn't fit, the answer is not "too expensive, bye": it's a first
 * phase that does fit. Modules arrive ordered by priority (most essential
 * first), so phase 1 is the longest essential prefix within budget.
 */
export function budgetFit(modules: ModuleId[], speed: number, scale: number, budget: string): Fit {
  if (!isBudget(budget)) return { kind: "unknown" };
  const max = BUDGET_MAX[budget];
  if (max === null) return { kind: "unknown" };

  const full = estimate(modules, speed, scale).total;
  if (full <= max) return { kind: "within", margin: max === Infinity ? 0 : max - full };

  const phase1: ModuleId[] = [];
  for (const m of modules) {
    if (estimate([...phase1, m], speed, scale).total <= max) phase1.push(m);
    else break;
  }
  if (!phase1.length) {
    return { kind: "below", smallest: estimate(modules.slice(0, 1), speed, scale).total };
  }
  return {
    kind: "phased",
    phase1,
    phase1Total: estimate(phase1, speed, scale).total,
    phase2: modules.filter((m) => !phase1.includes(m)),
  };
}

export type Score = "hot" | "warm" | "cold";

/**
 * Where John should spend his next hour. Hot: money and urgency line up.
 * Cold: exploring, or the budget can't cover even a first phase.
 */
export function leadScore(b: BriefData, fit: Fit): Score {
  const urgent = b.timeline === "urgent" || b.timeline === "month";
  if (b.timeline === "exploring" || fit.kind === "below") return "cold";
  if (urgent && (fit.kind === "within" || fit.kind === "phased")) return "hot";
  return "warm";
}
