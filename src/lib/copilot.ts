import { supabase } from "@/integrations/supabase/client";
import { recommendations, type RecoLead } from "@/lib/recommend";

/**
 * The CRM copilot, from the browser's side.
 *
 * Two ways to answer, and the difference is always visible on screen:
 *
 *   live    — the `crm-copilot` function: reads the real CRM, answers with
 *             citations, and analyses an uploaded transcript. Costs money,
 *             so it runs behind an admin check and a daily cap.
 *   local   — no key, no deployment, limit reached or an error: the same
 *             questions answered by arithmetic over the leads already
 *             loaded, and a transcript read with patterns. Free, offline,
 *             and honest about being a rougher reading.
 *
 * The local reading never states something that isn't in the text: every
 * claim it makes carries the line it came from, and is marked as an
 * inference, not a fact.
 */

export type Cite = { ref: string; why: string; leadId: string; name: string };
export type Answer = {
  reply: string;
  cites: Cite[];
  confident: boolean;
  dropped: number;
  live: boolean;
};

export type Claim = {
  field: string;
  kind: "FACT" | "INFERENCE" | "UNCERTAIN";
  text: string;
  quote: string;
};
export type Analysis = {
  summary: string;
  claims: Claim[];
  budget?: { min: number; max: number; currency: string; confidence: string; quote: string };
  timeline?: { text: string; confidence: string; quote: string };
  objections: { type: string; context: string; reply: string; quote: string }[];
  next_steps: { text: string; owner: string }[];
  questions: string[];
  missing: string[];
  dropped: number;
  live: boolean;
};

export type Prep = {
  opening: string;
  known: { label: string; value: string; source: string }[];
  ask: string[];
  watchouts: string[];
  missing: string[];
  live: boolean;
};

type Invoke = { data?: Record<string, unknown> | null; error?: unknown };

async function callFunction(body: Record<string, unknown>): Promise<Invoke> {
  try {
    const { data, error } = await supabase.functions.invoke("crm-copilot", { body });
    return { data: (data ?? null) as Record<string, unknown> | null, error };
  } catch (error) {
    return { error };
  }
}

// ── Ask ──────────────────────────────────────────────────────────────────

/** Ready-made questions. They all work offline too. */
export const SUGGESTED = [
  "¿A quién contacto hoy y por qué?",
  "¿Qué leads están esperando respuesta mía?",
  "¿Cuáles están calientes ahora mismo?",
  "¿Qué se me venció esta semana?",
  "¿Cuánto tengo en juego y en qué etapa?",
] as const;

/** The same box, pointed at one lead. */
export const SUGGESTED_LEAD = [
  "¿Qué me dijo sobre el presupuesto?",
  "Resume la última conversación.",
  "¿Qué le falta por contarme para cotizar en firme?",
  "Escríbeme un seguimiento corto para WhatsApp.",
] as const;

const has = (q: string, ...words: string[]) => {
  const t = q.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return words.some((w) => t.includes(w));
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * The same questions, answered from the leads already in memory. No model,
 * so it can't be wrong about a date — and it says plainly when a question
 * needs the assistant.
 */
export function askLocal(question: string, leads: RecoLead[]): Answer {
  const cite = (l: RecoLead, why: string, i: number): Cite => ({
    ref: `L${i + 1}`,
    why,
    leadId: l.id,
    name: l.business?.trim() || l.name,
  });
  const open = leads.filter((l) =>
    ["nuevo", "contactado", "diagnostico", "propuesta"].includes(l.status),
  );

  if (has(question, "venc", "atras", "tarde", "olvid")) {
    const due = open.filter((l) => l.next_action_at && Date.parse(l.next_action_at) < Date.now());
    return {
      reply: due.length
        ? `${due.length} seguimiento(s) vencido(s): ${due.map((l) => l.business || l.name).join(", ")}.`
        : "No tienes seguimientos vencidos.",
      cites: due.slice(0, 6).map((l, i) => cite(l, "fecha de seguimiento pasada", i)),
      confident: true,
      dropped: 0,
      live: false,
    };
  }

  if (has(question, "calient", "hot", "interes")) {
    const hot = open.filter((l) => l.score === "hot");
    return {
      reply: hot.length
        ? `${hot.length} lead(s) caliente(s): ${hot.map((l) => l.business || l.name).join(", ")}. Son los de plazo corto con presupuesto que alcanza al menos para una Fase 1.`
        : "Ahora mismo no hay leads calientes abiertos.",
      cites: hot.slice(0, 6).map((l, i) => cite(l, "puntaje caliente", i)),
      confident: true,
      dropped: 0,
      live: false,
    };
  }

  if (has(question, "esperando", "sin respuesta", "propuesta", "respondi")) {
    const waiting = open.filter((l) => l.status === "propuesta");
    return {
      reply: waiting.length
        ? `${waiting.length} con propuesta enviada y sin cerrar: ${waiting.map((l) => l.business || l.name).join(", ")}.`
        : "No hay propuestas esperando respuesta.",
      cites: waiting.slice(0, 6).map((l, i) => cite(l, "etapa propuesta", i)),
      confident: true,
      dropped: 0,
      live: false,
    };
  }

  if (has(question, "juego", "pipeline", "dinero", "valor", "factur", "ingres", "cuanto")) {
    const inPlay = open.reduce((s, l) => s + (l.value_usd ?? 0), 0);
    const quoted = open.reduce((s, l) => s + (l.value_usd ?? l.estimate_usd ?? 0), 0);
    const byStage = open.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      reply: `${money(inPlay)} con valor asignado sobre ${open.length} leads abiertos (${money(quoted)} contando las cotizaciones que vieron los clientes). Por etapa: ${Object.entries(
        byStage,
      )
        .map(([s, n]) => `${s} ${n}`)
        .join(", ")}.`,
      cites: [],
      confident: true,
      dropped: 0,
      live: false,
    };
  }

  // Default: today's plan, which is what most questions really mean.
  const recos = recommendations(leads).slice(0, 5);
  const generic = !has(question, "hoy", "contact", "hacer", "prioridad", "empiezo", "llamo");
  const byId = new Map(leads.map((l) => [l.id, l]));
  return {
    reply: recos.length
      ? `${generic ? "Sin el asistente sólo leo fechas y etapas, así que respondo con lo más urgente: " : ""}${recos
          .map((r) => `${r.title} (${r.why})`)
          .join(" · ")}`
      : "No hay nada urgente: ningún seguimiento vencido ni leads sin contactar.",
    cites: recos
      .map((r, i) => {
        const l = byId.get(r.leadId);
        return l ? cite(l, r.why, i) : null;
      })
      .filter((c): c is Cite => c !== null),
    confident: !generic,
    dropped: 0,
    live: false,
  };
}

export async function ask(
  question: string,
  leads: RecoLead[],
  leadId?: string | null,
): Promise<Answer> {
  const { data, error } = await callFunction({
    mode: "ask",
    question,
    ...(leadId ? { leadId } : {}),
  });
  const a = data?.["answer"] as Omit<Answer, "live"> | undefined;
  if (error || !a || typeof a.reply !== "string") return askLocal(question, leads);
  return { ...a, cites: a.cites ?? [], live: true };
}

// ── Meeting analysis ─────────────────────────────────────────────────────

const AMOUNT =
  /(?:\$|us\$|usd|eur|€|bs\.?|euros?|d[oó]lares?)\s?([\d][\d.,]*)|([\d][\d.,]{2,})\s?(?:\$|usd|eur|€|d[oó]lares?|euros?)/gi;
const NUM = (s: string) =>
  Number(
    s
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(/,(?=\d{3}\b)/g, "")
      .replace(",", "."),
  );

const TIME_WORDS =
  /(cuanto antes|lo antes posible|urgent|este mes|esta semana|antes de (?:fin|que|navidad|diciembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre)|en (?:dos|tres|cuatro|\d+) (?:semanas|meses)|para (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|pr[oó]ximo (?:mes|trimestre))/i;

const OBJECTIONS: [string, RegExp][] = [
  [
    "precio",
    /(muy caro|caro|costoso|fuera de presupuesto|no tenemos tanto|presupuesto ajustado|m[aá]s barato)/i,
  ],
  [
    "decisor",
    /(hablar(?:lo|la)? con (?:mi|el|la|los|mis) ?(?:socio|socia|socios|esposa|esposo|jefe|equipo|junta|pareja)|consultarlo|lo consulto|no decido solo|depende de)/i,
  ],
  ["tiempo", /(ahora no|m[aá]s adelante|el pr[oó]ximo (?:mes|trimestre|a[nñ]o)|estamos ocupados)/i],
  [
    "competencia",
    /(otra agencia|otro proveedor|una cotizaci[oó]n de|estamos comparando|ya tenemos a alguien)/i,
  ],
  ["confianza", /(no estoy seguro|dudas|c[oó]mo s[eé] que|garant[ií]a|referencias)/i],
  ["alcance", /(no entiendo|qu[eé] incluye|hasta d[oó]nde llega|y si necesito m[aá]s)/i],
];

const NEXT_STEP =
  /(te (?:env[ií]o|mando|paso)|quedamos en|agendamos|nos hablamos|me env[ií]as|mandame|m[aá]ndame|revisamos|coordinamos|firmamos)/i;

const lines = (t: string) =>
  t
    .split(/\r?\n|(?<=[.?!])\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8);

/**
 * The free reading: patterns over the transcript. Everything it finds is
 * marked INFERENCE and carries the line it came from, because a regular
 * expression recognises words, not meaning.
 */
export function analyzeLocal(transcript: string): Analysis {
  const ls = lines(transcript);
  const claims: Claim[] = [];
  const objections: Analysis["objections"] = [];
  const next: Analysis["next_steps"] = [];
  let budget: Analysis["budget"];
  let timeline: Analysis["timeline"];

  for (const line of ls) {
    const amounts: number[] = [];
    for (const m of line.matchAll(AMOUNT)) {
      const n = NUM(m[1] ?? m[2] ?? "");
      if (Number.isFinite(n) && n >= 20) amounts.push(n);
    }
    if (amounts.length && !budget) {
      budget = {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        currency: /€|eur/i.test(line) ? "EUR" : /bs\.?\b/i.test(line) ? "VES" : "USD",
        confidence: "low",
        quote: line.slice(0, 300),
      };
      claims.push({
        field: "budget",
        kind: "INFERENCE",
        text: `Se mencionó una cifra: ${amounts.map((a) => a.toLocaleString("en-US")).join(" – ")}`,
        quote: line.slice(0, 300),
      });
    }

    const t = TIME_WORDS.exec(line);
    if (t && !timeline) {
      timeline = { text: t[0], confidence: "low", quote: line.slice(0, 300) };
      claims.push({
        field: "timeline",
        kind: "INFERENCE",
        text: `Plazo mencionado: ${t[0]}`,
        quote: line.slice(0, 300),
      });
    }

    for (const [type, re] of OBJECTIONS) {
      if (objections.some((o) => o.type === type) || !re.test(line)) continue;
      objections.push({
        type,
        context: line.slice(0, 200),
        reply: "",
        quote: line.slice(0, 300),
      });
      claims.push({
        field: "other",
        kind: "UNCERTAIN",
        text: `Posible objeción de ${type}`,
        quote: line.slice(0, 300),
      });
    }

    if (NEXT_STEP.test(line) && next.length < 6) {
      next.push({
        text: line.slice(0, 200),
        owner: /me env[ií]as|mandame|m[aá]ndame/i.test(line) ? "cliente" : "ruah",
      });
    }
  }

  return {
    summary: `Lectura local de ${ls.length} líneas, sin IA: marca cifras, plazos y posibles objeciones con la frase exacta donde aparecen. No interpreta el contenido — para eso hace falta el asistente.`,
    claims: claims.slice(0, 24),
    ...(budget ? { budget } : {}),
    ...(timeline ? { timeline } : {}),
    objections,
    next_steps: next,
    questions: [],
    missing: [],
    dropped: 0,
    live: false,
  };
}

export async function analyzeMeeting(leadId: string, transcript: string): Promise<Analysis> {
  const { data, error } = await callFunction({ mode: "meeting", leadId, transcript });
  const a = data?.["analysis"] as Omit<Analysis, "live"> | undefined;
  if (error || !a || typeof a.summary !== "string") return analyzeLocal(transcript);
  return {
    ...a,
    claims: a.claims ?? [],
    objections: a.objections ?? [],
    next_steps: a.next_steps ?? [],
    questions: a.questions ?? [],
    missing: a.missing ?? [],
    live: true,
  };
}

// ── Meeting prep ─────────────────────────────────────────────────────────

export type PrepLead = {
  name: string;
  business?: string | null;
  problem?: string | null;
  chat_summary?: string | null;
  goal?: string | null;
  budget?: string | null;
  timeline?: string | null;
  estimate_usd?: number | null;
  status: string;
  brief?: Record<string, string> | null;
};

/** What the CRM already knows, laid out for the call. No model needed. */
export function prepLocal(lead: PrepLead): Prep {
  const known: Prep["known"] = [];
  const add = (label: string, value: string | null | undefined, source: string) => {
    if (value && value.trim()) known.push({ label, value: value.trim().slice(0, 200), source });
  };
  add("Negocio", lead.business, "formulario");
  add("Problema", lead.problem ?? lead.brief?.["problem"], "lo que escribió");
  add("Quiere", lead.goal ?? lead.brief?.["outcome"], "objetivos marcados");
  add("Hoy lo resuelve con", lead.brief?.["current"], "conversación");
  add("Presupuesto", lead.budget, "rango elegido");
  add("Plazo", lead.timeline, "rango elegido");
  if (lead.estimate_usd) add("Cotización que vio", `$${lead.estimate_usd}`, "configurador");
  add("Resumen del asistente", lead.chat_summary, "chat del sitio");

  const missing: string[] = [];
  if (!lead.brief?.["current"]) missing.push("Cómo lo resuelven hoy, con qué herramientas");
  if (!lead.budget) missing.push("Rango de presupuesto");
  if (!lead.timeline) missing.push("Fecha objetivo");

  return {
    opening: `Retomar lo que ya contó (${lead.problem?.slice(0, 80) ?? "su problema"}) y confirmar si sigue igual antes de proponer nada.`,
    known,
    ask: [
      "¿Qué pasa hoy desde que llega un pedido hasta que se cumple?",
      "¿Cuánto tiempo al día les come eso?",
      "¿Quién más decide esto contigo?",
      "¿Qué tendría que pasar para que digas que valió la pena?",
      ...missing.map((m) => `Falta saber: ${m}`),
    ].slice(0, 6),
    watchouts: [
      "Si pide factura fiscal: Ruah todavía no está constituida, se entrega cotización.",
      "Si el presupuesto no alcanza, proponer la Fase 1 en vez de bajar el precio.",
    ],
    missing,
    live: false,
  };
}

export async function prepareMeeting(leadId: string, lead: PrepLead): Promise<Prep> {
  const { data, error } = await callFunction({ mode: "prep", leadId });
  const p = data?.["prep"] as Omit<Prep, "live"> | undefined;
  if (error || !p || typeof p.opening !== "string") return prepLocal(lead);
  return {
    ...p,
    known: p.known ?? [],
    ask: p.ask ?? [],
    watchouts: p.watchouts ?? [],
    missing: p.missing ?? [],
    live: true,
  };
}
