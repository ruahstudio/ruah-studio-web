/**
 * The one place prices live.
 *
 * The configurator, the chat's "build my estimate", the quote PDF and the
 * lead saved to the CRM all compute from this file. Before, the catalog and
 * the formula lived inside SystemBuilder.tsx, so nothing else could produce a
 * number without duplicating them — and two copies of a price list drift.
 *
 * The AI never prices anything. It only picks module ids from MODULE_IDS;
 * the amount always comes from `estimate()` below.
 */

export type Layer = "INTERFACE" | "SYSTEMS" | "INTELLIGENCE";
export type Module = { id: ModuleId; price: number; weeks: number; layer: Layer };

export const MODULE_IDS = [
  "landing",
  "calculator",
  "brand",
  "dashboard",
  "crm",
  "auth",
  "ai",
  "automation",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const MODULES: Module[] = [
  { id: "landing", price: 95, weeks: 0.5, layer: "INTERFACE" },
  { id: "calculator", price: 90, weeks: 0.5, layer: "INTERFACE" },
  { id: "brand", price: 120, weeks: 0.5, layer: "INTERFACE" },
  { id: "dashboard", price: 180, weeks: 1.5, layer: "SYSTEMS" },
  { id: "crm", price: 220, weeks: 1.5, layer: "SYSTEMS" },
  { id: "auth", price: 90, weeks: 0.5, layer: "SYSTEMS" },
  { id: "ai", price: 200, weeks: 1, layer: "INTELLIGENCE" },
  { id: "automation", price: 140, weeks: 1, layer: "INTELLIGENCE" },
];

export const LAYERS: Layer[] = ["INTERFACE", "SYSTEMS", "INTELLIGENCE"];

export const SPEED = [
  { key: "standard", mult: 1 },
  { key: "priority", mult: 1.25 },
  { key: "sprint", mult: 1.6 },
] as const;
export type SpeedKey = (typeof SPEED)[number]["key"];

/** Scale runs 1–4 (one team … whole company). */
export const SCALE_MIN = 1;
export const SCALE_MAX = 4;

export function isModuleId(v: unknown): v is ModuleId {
  return typeof v === "string" && (MODULE_IDS as readonly string[]).includes(v);
}

export function clampScale(n: unknown): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) : 2;
}

export function speedIndex(key: unknown): number {
  const i = SPEED.findIndex((s) => s.key === key);
  return i >= 0 ? i : 0;
}

/**
 * Price and duration for a selection. Same formula the configurator always
 * used, moved here unchanged so existing estimates don't shift.
 */
export function estimate(ids: readonly string[], speed: number, scale: number) {
  const chosen = MODULES.filter((m) => ids.includes(m.id));
  const scaleMult = 0.85 + clampScale(scale) * 0.15;
  const mult = SPEED[speed]?.mult ?? 1;
  const price = chosen.reduce((a, m) => a + m.price, 0) * mult * scaleMult;
  const w = chosen.reduce((a, m) => a + m.weeks, 0) * (speed === 2 ? 0.6 : 1) * scaleMult;
  return {
    chosen,
    total: Math.round(price / 5) * 5,
    weeks: chosen.length ? Math.max(0.5, Math.round(w * 2) / 2) : 0,
  };
}
