// End-to-end test of index.ts against fake Anthropic and Supabase servers.
//   deno test --allow-net --allow-env --allow-read handler_test.ts
//
// What matters here isn't the happy path, it's the order of the gates: a
// request without a session, or from someone who isn't admin, must never
// reach the model and must never read a lead. And a lead's phone or email
// must never leave the database.
import { deepStrictEqual as assertEquals, ok as assert } from "node:assert/strict";

type Seen = { anthropic: Record<string, unknown>[]; paths: string[] };
const seen: Seen = { anthropic: [], paths: [] };
let who: "admin" | "user" | "anon" = "admin";
let limitAnswer: "allow" | "deny" | "error" = "allow";
let modelReply: Record<string, unknown> = {};

const LEAD = {
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
  // Nunca debe salir hacia el modelo:
  phone: "584141234567",
  email: "ana@gmail.com",
  instagram: "panaderia.ana",
};

const MOCK_PORT = 9921;
const mock = Deno.serve({ port: MOCK_PORT, onListen() {} }, async (req) => {
  const url = new URL(req.url);
  seen.paths.push(url.pathname + url.search);
  const body = await req.json().catch(() => ({}));

  if (url.pathname.endsWith("/auth/v1/user")) {
    if (who === "anon") return new Response("no", { status: 401 });
    return Response.json({ id: "u1", aud: "authenticated", email: "john@ruah.com" });
  }
  if (url.pathname.endsWith("/rpc/has_role")) return Response.json(who === "admin");
  if (url.pathname.endsWith("/rpc/agent_hit")) {
    if (limitAnswer === "error")
      return new Response(JSON.stringify({ message: "boom" }), { status: 500 });
    return Response.json(limitAnswer === "allow");
  }
  if (url.pathname.includes("/rest/v1/leads")) return Response.json([LEAD]);
  if (url.pathname.includes("/rest/v1/lead_notes")) return Response.json([]);
  if (url.pathname.includes("/rest/v1/lead_meetings")) return Response.json([]);
  if (url.pathname.endsWith("/v1/messages")) {
    seen.anthropic.push(body);
    return Response.json({
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: body.model,
      stop_reason: "end_turn",
      usage: { input_tokens: 1, output_tokens: 1 },
      ...modelReply,
    });
  }
  return new Response("not found", { status: 404 });
});

Deno.env.set("ANTHROPIC_API_KEY", "sk-test");
Deno.env.set("ANTHROPIC_BASE_URL", `http://127.0.0.1:${MOCK_PORT}`);
Deno.env.set("SUPABASE_URL", `http://127.0.0.1:${MOCK_PORT}`);
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-test");
await import("./index.ts"); // starts Deno.serve on :8000

const call = (body: unknown, token: string | null = "jwt-admin") =>
  fetch("http://127.0.0.1:8000", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, json: await r.json() }));

const reset = () => {
  seen.anthropic = [];
  seen.paths = [];
  who = "admin";
  limitAnswer = "allow";
};

const toolReply = (name: string, input: unknown) => ({
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id: "tu_0", name, input }],
});

Deno.test({
  name: "sin sesión: 401 y el modelo nunca se llama",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    const r = await call({ question: "¿a quién contacto?" }, null);
    assertEquals(r.status, 401);
    assertEquals(seen.anthropic.length, 0);
    assert(!seen.paths.some((p) => p.includes("/rest/v1/leads")), "no leyó leads");
  },
});

Deno.test({
  name: "usuario autenticado que no es admin: 403, sin datos ni modelo",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    who = "user";
    const r = await call({ question: "¿a quién contacto?" });
    assertEquals(r.status, 403);
    assertEquals(seen.anthropic.length, 0);
    assert(!seen.paths.some((p) => p.includes("/rest/v1/leads")), "no leyó leads");
  },
});

Deno.test({
  name: "límite diario alcanzado: no se llama al modelo",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    limitAnswer = "deny";
    const r = await call({ question: "¿a quién contacto?" });
    assertEquals(r.json, { limited: "daily" });
    assertEquals(seen.anthropic.length, 0);
  },
});

Deno.test({
  name: "no se puede contar el límite: falla cerrado",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    limitAnswer = "error";
    const r = await call({ question: "¿a quién contacto?" });
    assertEquals(r.json, { limited: "unavailable" });
    assertEquals(seen.anthropic.length, 0);
  },
});

Deno.test({
  name: "pregunta: responde con citas reales y sin datos de contacto en el prompt",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    modelReply = toolReply("answer", {
      reply: "Contacta a Ana [L1]; lleva días sin respuesta.",
      cites: [
        { ref: "L1", why: "caliente sin contactar" },
        { ref: "L7", why: "inventado" },
      ],
      confident: true,
    });
    const r = await call({ question: "¿a quién contacto hoy?" });
    assertEquals(r.status, 200);
    assertEquals(r.json.answer.cites.length, 1);
    assertEquals(r.json.answer.cites[0].leadId, LEAD.id);
    assertEquals(r.json.answer.dropped, 1);

    const sent = JSON.stringify(seen.anthropic[0]);
    assert(sent.includes("[L1] Ana"), "el contexto lleva el lead");
    assert(!sent.includes("584141234567"), "el teléfono no sale");
    assert(!sent.includes("ana@gmail.com"), "el correo no sale");
    assert(!sent.includes("panaderia.ana"), "el instagram no sale");
    assertEquals((seen.anthropic[0] as { tool_choice: { name: string } }).tool_choice.name, "answer");
  },
});

Deno.test({
  name: "reunión: lo que no está en la transcripción se descarta",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    const transcript =
      "JOHN: ¿cómo lo llevan hoy?\nCLIENTE: todo por WhatsApp y se pierde. Tenemos unos 3.000 dólares.";
    modelReply = toolReply("analyze_meeting", {
      summary: "Pedidos por WhatsApp; hay presupuesto.",
      claims: [
        { field: "need", kind: "FACT", text: "Se pierden pedidos", quote: "todo por WhatsApp y se pierde" },
        { field: "competitor", kind: "FACT", text: "Habló con otra agencia", quote: "ya hablamos con otra agencia" },
      ],
      budget: { min: 3000, max: 3000, currency: "USD", confidence: "high", quote: "Tenemos unos 3.000 dólares" },
    });
    const r = await call({ mode: "meeting", leadId: LEAD.id, transcript });
    assertEquals(r.status, 200);
    assertEquals(r.json.analysis.claims.length, 1);
    assertEquals(r.json.analysis.dropped, 1);
    assertEquals(r.json.analysis.budget.min, 3000);
    assert(JSON.stringify(seen.anthropic[0]).includes(transcript.slice(0, 20)));
  },
});

Deno.test({
  name: "reunión: transcripción demasiado corta se rechaza antes del modelo",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    const r = await call({ mode: "meeting", leadId: LEAD.id, transcript: "hola" });
    assertEquals(r.status, 400);
    assertEquals(seen.anthropic.length, 0);
  },
});

Deno.test({
  name: "preparación: devuelve apertura, lo conocido y las preguntas",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    modelReply = toolReply("meeting_prep", {
      opening: "Retomar el cuadre diario.",
      known: [{ label: "Presupuesto", value: "$100–$300", source: "formulario" }],
      ask: ["¿Cuántos locales son?"],
      watchouts: [],
      missing: [],
    });
    const r = await call({ mode: "prep", leadId: LEAD.id });
    assertEquals(r.status, 200);
    assertEquals(r.json.prep.ask[0], "¿Cuántos locales son?");
  },
});

Deno.test({
  name: "apagado",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await mock.shutdown();
    setTimeout(() => Deno.exit(0), 50);
  },
});
