import { translate, type AnyKey, type Lang } from "@/i18n";
import type { ModuleId } from "@/lib/pricing";

/**
 * What the visitor wants to achieve — several things at once, because nobody
 * wants only one. Stored as a list of codes (never a free-text string), so the
 * CRM can filter by it and the plan can be derived from it.
 *
 * "other" always comes with its own text; everything else is a fixed code.
 */
export const GOAL_IDS = [
  "clients",
  "sales",
  "website",
  "store",
  "app",
  "automate",
  "whatsapp",
  "instagram",
  "ai",
  "crm",
  "brand",
  "support",
  "leads",
  "conversion",
  "custom",
  "other",
] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export const isGoal = (v: unknown): v is GoalId =>
  typeof v === "string" && (GOAL_IDS as readonly string[]).includes(v);

export const goalLabel = (lang: Lang, id: string): string =>
  translate(lang, `goal.${id}` as AnyKey);

/** Only valid codes, no repeats, "other" last. Bounded so nothing floods the DB. */
export function cleanGoals(list: readonly unknown[]): GoalId[] {
  const out: GoalId[] = [];
  for (const g of list) if (isGoal(g) && !out.includes(g)) out.push(g);
  return out
    .sort((a, b) => Number(a === "other") - Number(b === "other"))
    .slice(0, GOAL_IDS.length);
}

/**
 * The sentence the rest of the flow already understands. The brief keeps one
 * `outcome` field, so the selected goals are written into it in the visitor's
 * language plus whatever they typed under "other".
 */
export function goalsText(lang: Lang, goals: readonly string[], other: string): string {
  const parts = goals.filter((g) => g !== "other").map((g) => goalLabel(lang, g));
  if (other.trim()) parts.push(other.trim());
  else if (goals.includes("other")) parts.push(goalLabel(lang, "other"));
  return parts.join(" · ");
}

/**
 * Goals → modules, ordered by priority. Used to seed the estimate when the
 * model isn't available; the keyword reading in agent.ts still runs on top.
 */
const GOAL_MODULES: Record<GoalId, ModuleId[]> = {
  clients: ["crm", "landing"],
  sales: ["crm", "dashboard"],
  website: ["landing"],
  store: ["landing", "auth"],
  app: ["auth", "dashboard"],
  automate: ["automation"],
  whatsapp: ["automation"],
  instagram: ["automation"],
  ai: ["ai"],
  crm: ["crm"],
  brand: ["brand"],
  support: ["ai", "automation"],
  leads: ["crm", "landing"],
  conversion: ["landing", "dashboard"],
  custom: ["dashboard"],
  other: [],
};

/** Priority order is the catalogue order in pricing.ts, not the click order. */
export function goalsToModules(goals: readonly string[]): ModuleId[] {
  const out: ModuleId[] = [];
  for (const g of goals) {
    if (!isGoal(g)) continue;
    for (const m of GOAL_MODULES[g]) if (!out.includes(m)) out.push(m);
  }
  return out;
}
