// Shape, limits, prompts and — above all — verification for the CRM copilot.
//
// This function is different from the public assistant in one way that
// changes everything: it reads REAL CLIENT DATA. So two rules run through the
// whole file.
//
//   1. Nobody but the admin gets in. The check happens in index.ts before any
//      data is read, against the database, never against something the
//      browser claims.
//   2. Nothing the model says is trusted on its own. Every statement must
//      point at something that exists: an answer cites lead ids that were
//      actually loaded, and a meeting analysis quotes text that is actually
//      in the transcript. Whatever fails that check is dropped before it
//      reaches the screen, and the UI says how many were dropped.
//
// The model never sees phone numbers, emails or Instagram handles: it doesn't
// need them to answer "who should I call today", and the less that leaves the
// database, the better.

export type Limits = {
  /** Copilot questions per admin per day. */
  perDay: number;
  /** Characters accepted in one question. */
  maxQuestion: number;
  /** Characters of transcript accepted in one analysis. */
  maxTranscript: number;
  /** Leads handed to the model as context. */
  maxLeads: number;
  maxTokens: number;
  maxAnalysisTokens: number;
};

export const DEFAULTS: Limits = {
  perDay: 120,
  maxQuestion: 500,
  maxTranscript: 60_000,
  maxLeads: 60,
  maxTokens: 700,
  maxAnalysisTokens: 2000,
};

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export function readLimits(env: (k: string) => string | undefined): Limits {
  return {
    perDay: num(env("COPILOT_PER_DAY"), DEFAULTS.perDay),
    maxQuestion: num(env("COPILOT_MAX_QUESTION"), DEFAULTS.maxQuestion),
    maxTranscript: num(env("COPILOT_MAX_TRANSCRIPT"), DEFAULTS.maxTranscript),
    maxLeads: num(env("COPILOT_MAX_LEADS"), DEFAULTS.maxLeads),
    maxTokens: num(env("COPILOT_MAX_TOKENS"), DEFAULTS.maxTokens),
    maxAnalysisTokens: num(env("COPILOT_MAX_ANALYSIS_TOKENS"), DEFAULTS.maxAnalysisTokens),
  };
}

// ── Input ────────────────────────────────────────────────────────────────

export type Parsed =
  | { ok: true; mode: "ask"; question: string; leadId: string | null }
  | { ok: true; mode: "meeting"; leadId: string; transcript: string }
  | { ok: true; mode: "prep"; leadId: string }
  | { ok: false; reason: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseBody(body: unknown, limits: Limits): Parsed {
  if (typeof body !== "object" || body === null) return { ok: false, reason: "bad_body" };
  const b = body as Record<string, unknown>;
  const mode = b.mode === "meeting" || b.mode === "prep" ? b.mode : "ask";
  const leadId = typeof b.leadId === "string" && UUID.test(b.leadId) ? b.leadId : null;

  if (mode === "meeting") {
    const transcript = typeof b.transcript === "string" ? b.transcript.trim() : "";
    if (!leadId) return { ok: false, reason: "lead_required" };
    if (transcript.length < 40) return { ok: false, reason: "transcript_too_short" };
    return { ok: true, mode, leadId, transcript: transcript.slice(0, limits.maxTranscript) };
  }
  if (mode === "prep") {
    if (!leadId) return { ok: false, reason: "lead_required" };
    return { ok: true, mode, leadId };
  }
  const question = typeof b.question === "string" ? b.question.trim() : "";
  if (question.length < 2) return { ok: false, reason: "question_required" };
  return { ok: true, mode: "ask", question: question.slice(0, limits.maxQuestion), leadId };
}

// ── The data handed to the model ─────────────────────────────────────────

export type LeadRow = {
  id: string;
  name: string;
  business: string | null;
  status: string;
  score: string | null;
  goal: string | null;
  goals: string[] | null;
  budget: string | null;
  timeline: string | null;
  budget_fit: string | null;
  problem: string | null;
  chat_summary: string | null;
  brief: Record<string, string> | null;
  modules: string[] | null;
  estimate_usd: number | null;
  value_usd: number | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string | null;
  source: string | null;
  ref: string | null;
};

export type NoteRow = { lead_id: string; body: string; kind: string; created_at: string };
export type MeetingRow = { lead_id: string; title: string; held_at: string; analysis: unknown };

const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const short = (s: string | null | undefined, n: number) =>
  (s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/**
 * The CRM as text the model can read, with a short reference per lead ([L1],
 * [L2]…). Short refs instead of uuids: they cost a fraction of the tokens and
 * they let the answer be checked — a citation that isn't in this list is not
 * a real lead, and gets dropped.
 */
export function buildContext(
  leads: LeadRow[],
  notes: NoteRow[],
  meetings: MeetingRow[],
  today: Date,
): { text: string; refs: Map<string, LeadRow> } {
  const refs = new Map<string, LeadRow>();
  const lines: string[] = [`HOY: ${today.toISOString().slice(0, 10)}`, "", "LEADS:"];

  leads.forEach((l, i) => {
    const ref = `L${i + 1}`;
    refs.set(ref, l);
    const byLead = notes.filter((n) => n.lead_id === l.id).slice(-3);
    const met = meetings.filter((m) => m.lead_id === l.id);
    lines.push(
      [
        `[${ref}] ${l.name}${l.business ? ` — ${l.business}` : ""}`,
        `  etapa=${l.status} puntaje=${l.score ?? "—"} creado=${dateOnly(l.created_at)} movido=${dateOnly(l.updated_at)}`,
        `  objetivos=${(l.goals ?? []).join(",") || short(l.goal, 80) || "—"} presupuesto=${l.budget ?? "—"} plazo=${l.timeline ?? "—"} encaje=${l.budget_fit ?? "—"}`,
        `  cotizado=${l.estimate_usd ?? "—"} valor=${l.value_usd ?? "—"} proxima_accion=${dateOnly(l.next_action_at)} origen=${short(l.source, 40)}`,
        l.problem ? `  problema: ${short(l.problem, 220)}` : "",
        l.chat_summary ? `  resumen: ${short(l.chat_summary, 320)}` : "",
        met.length ? `  reuniones: ${met.length} (última ${dateOnly(met[0]?.held_at ?? null)})` : "",
        ...byLead.map((n) => `  nota ${dateOnly(n.created_at)}: ${short(n.body, 160)}`),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  });

  if (!leads.length) lines.push("(no hay leads)");
  return { text: lines.join("\n"), refs };
}

// ── Mode: ask ────────────────────────────────────────────────────────────

export const ASK_TOOL = {
  name: "answer",
  description: "Responde a John usando SÓLO los datos del CRM entregados.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description:
          "Respuesta directa, en español, máximo 120 palabras. Menciona los leads por su nombre y su referencia entre corchetes, por ejemplo [L2]. Si los datos no alcanzan para responder, dilo explícitamente y di qué falta.",
      },
      cites: {
        type: "array",
        maxItems: 8,
        description: "Los leads en los que se apoya la respuesta.",
        items: {
          type: "object",
          properties: {
            ref: { type: "string", description: 'Referencia del lead, por ejemplo "L2".' },
            why: { type: "string", description: "En pocas palabras, qué dato de ese lead usaste." },
          },
          required: ["ref", "why"],
        },
      },
      confident: {
        type: "boolean",
        description: "false si estás infiriendo o si los datos no alcanzan.",
      },
    },
    required: ["reply", "cites", "confident"],
  },
};

export type Answer = {
  reply: string;
  cites: { ref: string; why: string; leadId: string; name: string }[];
  confident: boolean;
  dropped: number;
};

/** Keeps only citations that point at a lead that was actually loaded. */
export function sanitizeAnswer(input: unknown, refs: Map<string, LeadRow>): Answer | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  const reply = typeof r.reply === "string" ? r.reply.trim().slice(0, 1500) : "";
  if (!reply) return null;
  const raw = Array.isArray(r.cites) ? r.cites : [];
  const cites: Answer["cites"] = [];
  let dropped = 0;
  for (const c of raw.slice(0, 8)) {
    const o = (c ?? {}) as Record<string, unknown>;
    const ref = typeof o.ref === "string" ? o.ref.trim().toUpperCase() : "";
    const lead = refs.get(ref);
    if (!lead) {
      dropped += 1;
      continue;
    }
    cites.push({
      ref,
      why: typeof o.why === "string" ? o.why.trim().slice(0, 160) : "",
      leadId: lead.id,
      name: lead.business?.trim() || lead.name,
    });
  }
  return { reply, cites, confident: r.confident !== false, dropped };
}

export function askPrompt(scope: string): string {
  return `Eres el copiloto interno del CRM de Ruah Studio. Hablas con John, el dueño del estudio. No hablas con clientes.

Tu trabajo: responder con precisión sobre SUS leads, para que decida a quién contactar y qué decir.

REGLAS
- Responde SIEMPRE en español, directo, sin saludos ni relleno.
- SÓLO puedes afirmar lo que esté en los DATOS de abajo. Nada más.
- Si los datos no alcanzan, dilo en una frase y di qué falta. Nunca rellenes con suposiciones.
- Distingue el dato de tu lectura: "dijo que…" (dato) frente a "parece que…" (inferencia). Si infieres, pon confident=false.
- Cita los leads con su referencia entre corchetes, por ejemplo [L2], y repítelas en "cites".
- Nunca inventes leads, montos, fechas ni conversaciones. Nunca uses conocimiento externo sobre los clientes.
- No des por hecho que un lead está perdido o ganado si su etapa no lo dice.
- Si te piden redactar un mensaje para un cliente, escríbelo honesto y sin presionar.
${scope}`;
}

// ── Mode: meeting ────────────────────────────────────────────────────────

export const CLAIM_FIELDS = [
  "budget",
  "timeline",
  "urgency",
  "authority",
  "need",
  "requirement",
  "integration",
  "competitor",
  "risk",
  "opportunity",
  "other",
] as const;

export const MEETING_TOOL = {
  name: "analyze_meeting",
  description:
    "Extrae de la transcripción lo que sirve para vender bien y ejecutar: cada afirmación con su cita textual.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "Resumen en español de la conversación, máximo 150 palabras.",
      },
      claims: {
        type: "array",
        maxItems: 24,
        description:
          "Cada cosa relevante que se dijo. Una entrada por afirmación. NO inventes: cada una debe traer una cita EXACTA de la transcripción.",
        items: {
          type: "object",
          properties: {
            field: { type: "string", enum: [...CLAIM_FIELDS] },
            kind: {
              type: "string",
              enum: ["FACT", "INFERENCE", "UNCERTAIN"],
              description:
                "FACT: lo dijo literalmente. INFERENCE: lo deduces de lo que dijo. UNCERTAIN: podría ser, pero no está claro.",
            },
            text: { type: "string", description: "La afirmación, en español, en una frase." },
            quote: {
              type: "string",
              description:
                "Fragmento EXACTO y contiguo de la transcripción que la respalda (copiado tal cual, entre 8 y 200 caracteres).",
            },
          },
          required: ["field", "kind", "text", "quote"],
        },
      },
      budget: {
        type: "object",
        description: "Sólo si se habló de dinero. Omítelo si no se mencionó.",
        properties: {
          min: { type: "number" },
          max: { type: "number" },
          currency: { type: "string", description: "USD, EUR, VES…" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          quote: { type: "string", description: "Cita exacta donde se menciona." },
        },
        required: ["min", "max", "currency", "confidence", "quote"],
      },
      timeline: {
        type: "object",
        description: "Sólo si se habló de plazos. Omítelo si no se mencionó.",
        properties: {
          text: { type: "string", description: "Por ejemplo: lanzar antes de diciembre." },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          quote: { type: "string" },
        },
        required: ["text", "confidence", "quote"],
      },
      objections: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["precio", "tiempo", "confianza", "decisor", "alcance", "competencia", "otra"],
            },
            context: { type: "string", description: "Qué le preocupa, en una frase." },
            reply: {
              type: "string",
              description:
                "Respuesta sugerida, honesta y sin presionar. Nada de manipulación ni urgencia falsa.",
            },
            quote: { type: "string" },
          },
          required: ["type", "context", "reply", "quote"],
        },
      },
      next_steps: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            owner: { type: "string", enum: ["ruah", "cliente"] },
          },
          required: ["text", "owner"],
        },
      },
      questions: {
        type: "array",
        maxItems: 6,
        description: "Lo que quedó sin preguntar y hace falta para cotizar bien.",
        items: { type: "string" },
      },
      missing: {
        type: "array",
        maxItems: 6,
        description: "Información que falta para decidir (no confundir con preguntas).",
        items: { type: "string" },
      },
    },
    required: ["summary", "claims"],
  },
};

export type Claim = { field: string; kind: string; text: string; quote: string };
export type Analysis = {
  summary: string;
  claims: Claim[];
  budget?: { min: number; max: number; currency: string; confidence: string; quote: string };
  timeline?: { text: string; confidence: string; quote: string };
  objections: { type: string; context: string; reply: string; quote: string }[];
  next_steps: { text: string; owner: string }[];
  questions: string[];
  missing: string[];
  /** How many statements were thrown away because their quote wasn't real. */
  dropped: number;
};

/**
 * Lowercase, no accents, no thousands separators, single spaces — so a quote
 * matches despite formatting. "3.000 dólares" and "3000 dolares" are the same
 * sentence, and a model that retypes a number shouldn't lose its citation.
 */
export function normalize(s: string): string {
  return s
    .replace(/(\d)[.,](?=\d{3}(?!\d))/g, "$1")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

/**
 * The anti-invention rule: a quote counts only if it is really in the
 * transcript. Anything else is a sentence the model composed, and it is
 * dropped — which is why this analysis can be trusted enough to act on.
 */
export const quoted = (transcript: string, quote: unknown): quote is string => {
  if (typeof quote !== "string") return false;
  const q = normalize(quote);
  return q.length >= 8 && normalize(transcript).includes(q);
};

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function sanitizeAnalysis(input: unknown, transcript: string): Analysis | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  const summary = str(r.summary, 1200);
  if (!summary) return null;
  let dropped = 0;

  const claims: Claim[] = [];
  for (const c of (Array.isArray(r.claims) ? r.claims : []).slice(0, 24)) {
    const o = (c ?? {}) as Record<string, unknown>;
    const text = str(o.text, 300);
    const field = (CLAIM_FIELDS as readonly string[]).includes(String(o.field))
      ? String(o.field)
      : "other";
    const kind = ["FACT", "INFERENCE", "UNCERTAIN"].includes(String(o.kind))
      ? String(o.kind)
      : "UNCERTAIN";
    if (!text || !quoted(transcript, o.quote)) {
      dropped += 1;
      continue;
    }
    claims.push({ field, kind, text, quote: str(o.quote, 300) });
  }

  const objections: Analysis["objections"] = [];
  for (const o0 of (Array.isArray(r.objections) ? r.objections : []).slice(0, 6)) {
    const o = (o0 ?? {}) as Record<string, unknown>;
    const context = str(o.context, 300);
    if (!context || !quoted(transcript, o.quote)) {
      dropped += 1;
      continue;
    }
    objections.push({
      type: str(o.type, 30) || "otra",
      context,
      reply: str(o.reply, 500),
      quote: str(o.quote, 300),
    });
  }

  const out: Analysis = {
    summary,
    claims,
    objections,
    next_steps: (Array.isArray(r.next_steps) ? r.next_steps : [])
      .slice(0, 6)
      .map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        return { text: str(o.text, 200), owner: o.owner === "cliente" ? "cliente" : "ruah" };
      })
      .filter((s) => s.text),
    questions: (Array.isArray(r.questions) ? r.questions : [])
      .slice(0, 6)
      .map((q) => str(q, 200))
      .filter(Boolean),
    missing: (Array.isArray(r.missing) ? r.missing : [])
      .slice(0, 6)
      .map((q) => str(q, 200))
      .filter(Boolean),
    dropped,
  };

  const b = (r.budget ?? null) as Record<string, unknown> | null;
  if (b && Number.isFinite(Number(b.min)) && Number.isFinite(Number(b.max))) {
    if (quoted(transcript, b.quote)) {
      out.budget = {
        min: Math.max(0, Math.round(Number(b.min))),
        max: Math.max(0, Math.round(Number(b.max))),
        currency: str(b.currency, 8).toUpperCase() || "USD",
        confidence: ["high", "medium", "low"].includes(String(b.confidence))
          ? String(b.confidence)
          : "low",
        quote: str(b.quote, 300),
      };
    } else dropped += 1;
  }

  const t = (r.timeline ?? null) as Record<string, unknown> | null;
  if (t && str(t.text, 200)) {
    if (quoted(transcript, t.quote)) {
      out.timeline = {
        text: str(t.text, 200),
        confidence: ["high", "medium", "low"].includes(String(t.confidence))
          ? String(t.confidence)
          : "low",
        quote: str(t.quote, 300),
      };
    } else dropped += 1;
  }

  out.dropped = dropped;
  return out;
}

export function meetingPrompt(context: string): string {
  return `Analizas la transcripción de una conversación comercial de Ruah Studio (John con un cliente o posible cliente).

REGLAS INVIOLABLES
- Responde en español.
- Cada afirmación va acompañada de una CITA EXACTA, copiada literalmente de la transcripción. Si no puedes citarla, NO la incluyas: el sistema descarta automáticamente lo que no aparezca en el texto.
- Marca cada afirmación: FACT (lo dijo), INFERENCE (lo deduces), UNCERTAIN (podría ser).
- No inventes montos, fechas, nombres ni compromisos. Si no se habló de presupuesto, no lo reportes.
- Las respuestas sugeridas a objeciones deben ser honestas: explicar alcance y valor, nunca presionar, nunca inventar urgencia o escasez.
- No repitas la transcripción completa en el resumen.

CONTEXTO DEL LEAD (del CRM, para que no repitas lo que ya se sabe):
${context}`;
}

// ── Mode: prep ───────────────────────────────────────────────────────────

export const PREP_TOOL = {
  name: "meeting_prep",
  description: "Prepara a John para la próxima conversación con este lead.",
  input_schema: {
    type: "object" as const,
    properties: {
      opening: {
        type: "string",
        description: "Cómo abrir la conversación, en una o dos frases. En español.",
      },
      known: {
        type: "array",
        maxItems: 8,
        description: "Lo que ya se sabe y no hay que volver a preguntar.",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            value: { type: "string" },
            source: {
              type: "string",
              description: "De dónde sale: resumen del chat, nota, reunión, formulario…",
            },
          },
          required: ["label", "value", "source"],
        },
      },
      ask: {
        type: "array",
        maxItems: 6,
        description: "Preguntas concretas a hacer, ordenadas por importancia.",
        items: { type: "string" },
      },
      watchouts: {
        type: "array",
        maxItems: 4,
        description: "Riesgos u objeciones probables, con qué hacer si aparecen.",
        items: { type: "string" },
      },
      missing: {
        type: "array",
        maxItems: 4,
        description: "Lo que falta saber para poder cotizar en firme.",
        items: { type: "string" },
      },
    },
    required: ["opening", "known", "ask"],
  },
};

export type Prep = {
  opening: string;
  known: { label: string; value: string; source: string }[];
  ask: string[];
  watchouts: string[];
  missing: string[];
};

export function sanitizePrep(input: unknown): Prep | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  const opening = str(r.opening, 500);
  if (!opening) return null;
  return {
    opening,
    known: (Array.isArray(r.known) ? r.known : [])
      .slice(0, 8)
      .map((k) => {
        const o = (k ?? {}) as Record<string, unknown>;
        return { label: str(o.label, 60), value: str(o.value, 200), source: str(o.source, 60) };
      })
      .filter((k) => k.label && k.value),
    ask: (Array.isArray(r.ask) ? r.ask : [])
      .slice(0, 6)
      .map((q) => str(q, 200))
      .filter(Boolean),
    watchouts: (Array.isArray(r.watchouts) ? r.watchouts : [])
      .slice(0, 4)
      .map((q) => str(q, 200))
      .filter(Boolean),
    missing: (Array.isArray(r.missing) ? r.missing : [])
      .slice(0, 4)
      .map((q) => str(q, 200))
      .filter(Boolean),
  };
}

export function prepPrompt(context: string): string {
  return `Preparas a John para su próxima conversación con un lead de Ruah Studio.

REGLAS
- Español, concreto, sin relleno.
- SÓLO puedes usar lo que aparece en los datos. Si algo no está, va en "missing", no lo inventes.
- Cada punto de "known" dice de dónde sale.
- Las preguntas deben ser las que faltan para poder cotizar en firme, no un cuestionario genérico.

DATOS DEL LEAD:
${context}`;
}
