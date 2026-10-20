// deno test --allow-all supabase/functions/crm-copilot/guard_test.ts
import { strict as assert } from "node:assert";
import {
  buildContext,
  normalize,
  parseBody,
  quoted,
  readLimits,
  sanitizeAnalysis,
  sanitizeAnswer,
  sanitizePrep,
  DEFAULTS,
  type LeadRow,
} from "./guard.ts";

const L = (over: Partial<LeadRow> = {}): LeadRow => ({
  id: "11111111-1111-1111-1111-111111111111",
  name: "Ana",
  business: "Panadería",
  status: "nuevo",
  score: "hot",
  goal: "automatizar",
  goals: ["automate"],
  budget: "100_300",
  timeline: "month",
  budget_fit: "phased",
  problem: "inventario en excel",
  chat_summary: "quiere cuadre diario",
  brief: null,
  modules: ["automation"],
  estimate_usd: 460,
  value_usd: null,
  next_action_at: null,
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-21T10:00:00Z",
  source: "chat:RS-1",
  ref: "RS-1",
  ...over,
});

Deno.test("entrada: pregunta vacía, transcripción corta y lead inválido se rechazan", () => {
  assert.equal(parseBody({ question: "" }, DEFAULTS).ok, false);
  assert.equal(parseBody({ mode: "meeting", leadId: "no-uuid", transcript: "x".repeat(50) }, DEFAULTS).ok, false);
  assert.equal(parseBody({ mode: "meeting", leadId: L().id, transcript: "corto" }, DEFAULTS).ok, false);
  assert.equal(parseBody({ mode: "prep" }, DEFAULTS).ok, false);
  assert.equal(parseBody("hola", DEFAULTS).ok, false);
});

Deno.test("entrada: se recorta a los límites", () => {
  const p = parseBody({ question: "a".repeat(5000) }, { ...DEFAULTS, maxQuestion: 50 });
  assert.ok(p.ok && p.mode === "ask" && p.question.length === 50);
  const m = parseBody(
    { mode: "meeting", leadId: L().id, transcript: "b".repeat(5000) },
    { ...DEFAULTS, maxTranscript: 100 },
  );
  assert.ok(m.ok && m.mode === "meeting" && m.transcript.length === 100);
});

Deno.test("límites configurables por variable de entorno", () => {
  const l = readLimits((k) => (k === "COPILOT_PER_DAY" ? "7" : undefined));
  assert.equal(l.perDay, 7);
  assert.equal(l.maxLeads, DEFAULTS.maxLeads);
});

Deno.test("contexto: no lleva teléfono, correo ni instagram", () => {
  const { text, refs } = buildContext(
    [L(), L({ id: "22222222-2222-2222-2222-222222222222", name: "José" })],
    [{ lead_id: L().id, body: "Llamada de 12 min", kind: "note", created_at: "2026-09-21T12:00:00Z" }],
    [{ lead_id: L().id, title: "Diagnóstico", held_at: "2026-09-22T12:00:00Z", analysis: null }],
    new Date("2026-09-24T12:00:00Z"),
  );
  assert.match(text, /\[L1\] Ana — Panadería/);
  assert.match(text, /\[L2\] José/);
  assert.match(text, /nota 2026-09-21: Llamada de 12 min/);
  assert.match(text, /reuniones: 1/);
  assert.equal(/@|584|\+58|instagram/i.test(text), false);
  assert.equal(refs.get("L1")?.id, L().id);
});

Deno.test("respuesta: una cita inventada se descarta y se reporta", () => {
  const { refs } = buildContext([L()], [], [], new Date());
  const a = sanitizeAnswer(
    {
      reply: "Contacta a Ana [L1].",
      cites: [
        { ref: "L1", why: "lead caliente sin contactar" },
        { ref: "L9", why: "lead que no existe" },
      ],
      confident: true,
    },
    refs,
  );
  assert.equal(a?.cites.length, 1);
  assert.equal(a?.dropped, 1);
  assert.equal(a?.cites[0]?.leadId, L().id);
  assert.equal(a?.cites[0]?.name, "Panadería");
});

Deno.test("respuesta: sin texto no hay respuesta", () => {
  const { refs } = buildContext([L()], [], [], new Date());
  assert.equal(sanitizeAnswer({ reply: "   ", cites: [] }, refs), null);
  assert.equal(sanitizeAnswer(null, refs), null);
});

const TRANSCRIPT = `JOHN: ¿Cómo llevan hoy los pedidos?
CLIENTE: Todo por WhatsApp, y se nos pierden. Tenemos unos 3.000 dólares para esto.
CLIENTE: Nos gustaría lanzarlo antes de diciembre.
CLIENTE: La verdad me parece caro, tengo que hablarlo con mi socio.`;

Deno.test("reunión: se queda sólo lo que está citado de verdad", () => {
  const a = sanitizeAnalysis(
    {
      summary: "Pedidos por WhatsApp, presupuesto y plazo mencionados.",
      claims: [
        { field: "need", kind: "FACT", text: "Pierden pedidos de WhatsApp", quote: "Todo por WhatsApp, y se nos pierden" },
        { field: "authority", kind: "INFERENCE", text: "Decide con su socio", quote: "tengo que hablarlo con mi socio" },
        { field: "competitor", kind: "FACT", text: "Evalúa a otra agencia", quote: "estamos viendo a otra agencia también" },
      ],
      budget: { min: 3000, max: 3000, currency: "usd", confidence: "high", quote: "Tenemos unos 3.000 dólares para esto" },
      timeline: { text: "Lanzar antes de diciembre", confidence: "medium", quote: "lanzarlo antes de diciembre" },
      objections: [
        { type: "precio", context: "Le parece caro", reply: "Explicar alcance y fases", quote: "me parece caro" },
        { type: "confianza", context: "Inventada", reply: "x", quote: "no confío en ustedes para nada" },
      ],
      next_steps: [{ text: "Enviar propuesta", owner: "ruah" }, { text: "", owner: "cliente" }],
      questions: ["¿Cuántos pedidos reciben al mes?"],
      missing: ["Quién más decide"],
    },
    TRANSCRIPT,
  );
  assert.equal(a?.claims.length, 2);
  assert.equal(a?.objections.length, 1);
  assert.equal(a?.dropped, 2);
  assert.equal(a?.budget?.min, 3000);
  assert.equal(a?.budget?.currency, "USD");
  assert.equal(a?.timeline?.text, "Lanzar antes de diciembre");
  assert.equal(a?.next_steps.length, 1);
});

Deno.test("reunión: un presupuesto sin cita real no se guarda", () => {
  const a = sanitizeAnalysis(
    {
      summary: "resumen",
      claims: [],
      budget: { min: 9000, max: 12000, currency: "USD", confidence: "high", quote: "tenemos doce mil dólares" },
    },
    TRANSCRIPT,
  );
  assert.equal(a?.budget, undefined);
  assert.equal(a?.dropped, 1);
});

Deno.test("reunión: la cita aguanta acentos, mayúsculas y espacios raros", () => {
  assert.equal(quoted(TRANSCRIPT, "TENEMOS  UNOS 3000 DOLARES"), true);
  assert.equal(quoted(TRANSCRIPT, "tenemos unos 3.000 dólares"), true);
  assert.equal(quoted(TRANSCRIPT, "el presupuesto es flexible"), false);
  assert.equal(quoted(TRANSCRIPT, "caro"), false, "una cita demasiado corta no vale");
  assert.equal(normalize("¿Cómo  estás?"), "como estas");
});

Deno.test("reunión: sin resumen no hay análisis", () => {
  assert.equal(sanitizeAnalysis({ claims: [] }, TRANSCRIPT), null);
  assert.equal(sanitizeAnalysis(null, TRANSCRIPT), null);
});

Deno.test("reunión: tope de afirmaciones", () => {
  const many = Array.from({ length: 40 }, () => ({
    field: "need",
    kind: "FACT",
    text: "Pierden pedidos",
    quote: "Todo por WhatsApp, y se nos pierden",
  }));
  const a = sanitizeAnalysis({ summary: "x", claims: many }, TRANSCRIPT);
  assert.equal(a?.claims.length, 24);
});

Deno.test("preparación: se limpia y exige apertura", () => {
  assert.equal(sanitizePrep({ known: [], ask: [] }), null);
  const p = sanitizePrep({
    opening: "Retomar lo del cuadre diario.",
    known: [
      { label: "Presupuesto", value: "$100–$300", source: "formulario" },
      { label: "", value: "x", source: "y" },
    ],
    ask: ["¿Cuántos locales son?", ""],
    watchouts: ["Puede pedir factura fiscal"],
    missing: [],
  });
  assert.equal(p?.known.length, 1);
  assert.equal(p?.ask.length, 1);
  assert.equal(p?.watchouts[0], "Puede pedir factura fiscal");
});
