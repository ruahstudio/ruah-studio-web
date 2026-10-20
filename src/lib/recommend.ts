/**
 * What John should do next, and why.
 *
 * Rules over a language model on purpose: every recommendation here can be
 * traced to a field and a date, so it is never wrong in a way nobody can
 * check, it costs nothing, and it works with the agent switched off. The
 * assistant's job is conversation; this one's job is arithmetic on dates.
 *
 * Each recommendation carries its reason ("4 días desde la propuesta") and a
 * suggested action. Nothing is auto-sent: John decides.
 */

export type RecoLead = {
  id: string;
  name: string;
  business?: string;
  status: string;
  score?: string | null;
  phone?: string | null;
  estimate_usd?: number | null;
  value_usd?: number | null;
  next_action_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type RecoKind = "overdue" | "silent" | "new" | "hot" | "novalue" | "stale";

export type Reco = {
  leadId: string;
  kind: RecoKind;
  /** Urgency, for ordering: 0 is most urgent. */
  rank: number;
  title: string;
  why: string;
  action: string;
};

const DAY = 86_400_000;
const days = (from: string, now: Date) => Math.floor((now.getTime() - Date.parse(from)) / DAY);

/** Stages where the deal is still alive. */
const OPEN = ["nuevo", "contactado", "diagnostico", "propuesta"];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function recommendations(leads: RecoLead[], now: Date = new Date()): Reco[] {
  const out: Reco[] = [];

  for (const l of leads) {
    if (!OPEN.includes(l.status)) continue;
    const who = l.business?.trim() || l.name;
    const age = days(l.created_at, now);
    const touched = days(l.updated_at || l.created_at, now);

    // 1. A follow-up John himself scheduled, already past.
    if (l.next_action_at && Date.parse(l.next_action_at) < now.getTime()) {
      out.push({
        leadId: l.id,
        kind: "overdue",
        rank: 0,
        title: `Seguimiento vencido: ${who}`,
        why: `La fecha que pusiste fue hace ${plural(days(l.next_action_at, now), "día", "días")}.`,
        action: "Escribir ahora",
      });
      continue;
    }

    // 2. A proposal sent and no answer. The deal is alive but cooling.
    if (l.status === "propuesta" && touched >= 3) {
      out.push({
        leadId: l.id,
        kind: "silent",
        rank: 1,
        title: `Propuesta sin respuesta: ${who}`,
        why: `${plural(touched, "día", "días")} desde el último movimiento.`,
        action: "Hacer seguimiento",
      });
      continue;
    }

    // 3. Brand new and untouched: the first hour is the whole game.
    if (l.status === "nuevo" && age >= 1) {
      out.push({
        leadId: l.id,
        kind: "new",
        rank: l.score === "hot" ? 0 : 2,
        title: `Sin contactar: ${who}`,
        why:
          l.score === "hot"
            ? `Lead caliente esperando desde hace ${plural(age, "día", "días")}.`
            : `Llegó hace ${plural(age, "día", "días")} y sigue en "nuevo".`,
        action: "Contactar",
      });
      continue;
    }

    // 4. Hot, in play, but with no next step written down.
    if (l.score === "hot" && !l.next_action_at) {
      out.push({
        leadId: l.id,
        kind: "hot",
        rank: 3,
        title: `Caliente sin próxima acción: ${who}`,
        why: "Plazo corto y presupuesto que alcanza; no hay fecha de seguimiento.",
        action: "Poner fecha",
      });
      continue;
    }

    // 5. Being worked on, but the pipeline can't count it.
    if (!l.value_usd && (l.estimate_usd ?? 0) > 0 && l.status !== "nuevo") {
      out.push({
        leadId: l.id,
        kind: "novalue",
        rank: 4,
        title: `Sin valor asignado: ${who}`,
        why: `El cliente vio $${l.estimate_usd?.toLocaleString("en-US")}; el trato no tiene valor.`,
        action: "Asignar valor",
      });
      continue;
    }

    // 6. Quietly going cold.
    if (touched >= 14) {
      out.push({
        leadId: l.id,
        kind: "stale",
        rank: 5,
        title: `Sin movimiento: ${who}`,
        why: `${plural(touched, "día", "días")} sin nada nuevo.`,
        action: "Retomar o cerrar",
      });
    }
  }

  return out.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));
}
