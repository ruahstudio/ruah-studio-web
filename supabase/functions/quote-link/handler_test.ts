// deno test --allow-all handler_test.ts
//
// Lo que importa: que sólo se firme un PDF que el sitio acaba de registrar
// para ESE lead, y que probar rutas ajenas no devuelva nada.
import { deepStrictEqual as assertEquals, ok as assert } from "node:assert/strict";
import { checkRequest } from "./guard.ts";

const REF = "RS-202609-1234";
const PATH = `leads/${REF}/cotizacion-${REF}.pdf`;

Deno.test("comprobaciones de entrada", () => {
  assert(checkRequest({ ref: REF, path: PATH }).ok);
  assert(checkRequest({ ref: REF.toLowerCase(), path: PATH }).ok, "la referencia no distingue mayúsculas");
  assertEquals(checkRequest({ ref: "RS-1", path: PATH }).ok, false);
  assertEquals(checkRequest({ ref: REF, path: `leads/RS-202609-9999/x.pdf` }).ok, false, "otra referencia");
  assertEquals(checkRequest({ ref: REF, path: `leads/${REF}/../../secreto.pdf` }).ok, false);
  assertEquals(checkRequest({ ref: REF, path: `leads/${REF}/factura.exe` }).ok, false);
  assertEquals(checkRequest({ ref: REF, path: `leads/${REF}/${"a".repeat(300)}.pdf` }).ok, false);
  assertEquals(checkRequest("hola").ok, false);
  assertEquals(checkRequest(null).ok, false);
});

type Seen = { paths: string[]; signed: string[]; updated: Record<string, unknown>[] };
const seen: Seen = { paths: [], signed: [], updated: [] };
let leadExists = true;
let limit: "allow" | "deny" = "allow";

const MOCK_PORT = 9931;
const mock = Deno.serve({ port: MOCK_PORT, onListen() {} }, async (req) => {
  const url = new URL(req.url);
  seen.paths.push(url.pathname + url.search);
  const body = await req.json().catch(() => ({}));

  if (url.pathname.endsWith("/rpc/agent_hit")) return Response.json(limit === "allow");
  if (url.pathname.includes("/rest/v1/leads")) {
    if (req.method === "PATCH") {
      seen.updated.push(body);
      return Response.json([]);
    }
    return Response.json(leadExists ? [{ id: "lead-1", quote_path: PATH }] : []);
  }
  if (url.pathname.includes("/storage/v1/object/sign/quotes/")) {
    seen.signed.push(url.pathname);
    return Response.json({ signedURL: `/object/sign/quotes/${PATH}?token=abc` });
  }
  return new Response("not found", { status: 404 });
});

Deno.env.set("SUPABASE_URL", `http://127.0.0.1:${MOCK_PORT}`);
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-test");
await import("./index.ts");

const call = (body: unknown) =>
  fetch("http://127.0.0.1:8000", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "190.1.2.3" },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, json: await r.json() }));

const reset = () => {
  seen.paths = [];
  seen.signed = [];
  seen.updated = [];
  leadExists = true;
  limit = "allow";
};

Deno.test({
  name: "firma el PDF de un lead registrado y guarda el enlace",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    const r = await call({ ref: REF, path: PATH });
    assertEquals(r.status, 200);
    assert(typeof r.json.url === "string" && r.json.url.includes("token=abc"), "devuelve enlace firmado");
    assertEquals(r.json.expiresIn, 90 * 24 * 3600);
    assertEquals(seen.signed.length, 1);
    assertEquals(seen.updated.length, 1, "deja el enlace guardado en el lead");
  },
});

Deno.test({
  name: "una ruta que no pertenece a ningún lead no se firma",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    leadExists = false;
    const r = await call({ ref: REF, path: PATH });
    assertEquals(r.status, 404);
    assertEquals(seen.signed.length, 0);
  },
});

Deno.test({
  name: "una petición mal formada se rechaza antes de tocar la base",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    const r = await call({ ref: REF, path: "leads/RS-202609-0000/otro.pdf" });
    assertEquals(r.status, 400);
    assertEquals(seen.paths.length, 0);
  },
});

Deno.test({
  name: "límite por IP: deja de firmar",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    reset();
    limit = "deny";
    const r = await call({ ref: REF, path: PATH });
    assertEquals(r.status, 429);
    assertEquals(seen.signed.length, 0);
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
