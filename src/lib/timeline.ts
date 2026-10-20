/**
 * One chronological story per lead.
 *
 * Everything already lives in the database — the lead row, its stage history
 * and its notes — but spread across three places nobody reads together. This
 * builds the single line John actually wants: what happened, in order, with
 * where each fact came from.
 *
 * Deliberately dependency-free (only the shapes it needs) so it can be tested
 * on its own, and so the CRM never invents events: an entry exists only if
 * there is a record behind it.
 */

import { plainText } from "@/lib/markdown";

export type TimelineLead = {
  created_at: string;
  updated_at?: string | null;
  source?: string | null;
  ref?: string | null;
  status?: string | null;
  chat_transcript?: { role: string; content: string }[] | null;
  chat_summary?: string | null;
  modules?: string[] | null;
  estimate_usd?: number | null;
  weeks?: number | null;
  value_usd?: number | null;
  next_action_at?: string | null;
};

export type TimelineNote = {
  id: string;
  body: string;
  kind: string; // note | event  (ver LeadNoteKind)
  author: string;
  created_at: string;
};

export type EventKind =
  "lead" | "conversation" | "quote" | "stage" | "note" | "system" | "followup";

export type TimelineEvent = {
  at: string;
  kind: EventKind;
  title: string;
  detail?: string;
  /** Where this came from, so nothing on the timeline is unverifiable. */
  source: string;
  /** A follow-up in the future, not something that already happened. */
  future?: boolean;
};

const CHANNEL: Record<string, string> = {
  chat: "Asistente del sitio",
  form: "Formulario del sitio",
  web: "Sitio web",
  builder: "Configurador",
};

/** "chat:RS-202609-1234" → "Asistente del sitio · RS-202609-1234" */
function origin(lead: TimelineLead): string {
  const raw = (lead.source ?? "").trim();
  const [channel, ref] = raw.includes(":") ? raw.split(":") : [raw, lead.ref ?? ""];
  const name = CHANNEL[channel ?? ""] ?? (channel || "Origen desconocido");
  return ref ? `${name} · ${ref}` : name;
}

export function buildTimeline(
  lead: TimelineLead,
  notes: TimelineNote[] = [],
  now: Date = new Date(),
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    at: lead.created_at,
    kind: "lead",
    title: "Lead creado",
    detail: origin(lead),
    source: "leads.created_at",
  });

  const turns = lead.chat_transcript?.length ?? 0;
  if (turns > 0) {
    events.push({
      at: lead.created_at,
      kind: "conversation",
      title: `Conversación con el asistente (${turns} mensajes)`,
      detail: plainText(lead.chat_summary ?? "").split("\n")[0] ?? "",
      source: "leads.chat_transcript",
    });
  }

  if ((lead.estimate_usd ?? 0) > 0) {
    const mods = lead.modules?.length ?? 0;
    events.push({
      at: lead.created_at,
      kind: "quote",
      title: `Cotización $${lead.estimate_usd?.toLocaleString("en-US")}`,
      detail: [mods ? `${mods} módulos` : "", lead.weeks ? `~${lead.weeks} semanas` : ""]
        .filter(Boolean)
        .join(" · "),
      source: "leads.estimate_usd",
    });
  }

  for (const n of notes) {
    events.push({
      at: n.created_at,
      kind: n.kind === "event" ? "stage" : "note",
      title: n.body.split("\n")[0]?.slice(0, 120) ?? "",
      detail: n.body.includes("\n") ? n.body.slice(n.body.indexOf("\n") + 1).trim() : "",
      source: n.author ? `nota · ${n.author}` : "lead_notes",
    });
  }

  if (lead.next_action_at) {
    events.push({
      at: lead.next_action_at,
      kind: "followup",
      title: "Próxima acción",
      detail: new Date(lead.next_action_at) < now ? "Vencida" : "Programada",
      source: "leads.next_action_at",
      future: new Date(lead.next_action_at) >= now,
    });
  }

  // Oldest first: a timeline is read downwards, like the conversation was.
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

/** Day heading for a group of events ("24 sep"). */
export function dayLabel(iso: string, locale = "es-VE"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** Groups the timeline by day, keeping order. */
export function byDay(events: TimelineEvent[], locale = "es-VE"): [string, TimelineEvent[]][] {
  const out: [string, TimelineEvent[]][] = [];
  for (const e of events) {
    const key = dayLabel(e.at, locale);
    const last = out[out.length - 1];
    if (last && last[0] === key) last[1].push(e);
    else out.push([key, [e]]);
  }
  return out;
}
