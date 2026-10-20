// Supabase Edge Function — enlace firmado de una cotización.
//
// DESPLIEGUE (público, como el asistente: lo llama un visitante sin cuenta):
//   npx supabase functions deploy quote-link --project-ref REF --no-verify-jwt
//
// Por qué existe: el bucket de cotizaciones es privado. El visitante puede
// SUBIR su PDF, pero no leerlo; para que el documento viaje en el mensaje de
// WhatsApp hace falta un enlace firmado, y firmar requiere la llave de
// servicio, que jamás puede estar en el navegador.
//
// Qué comprueba antes de firmar, en este orden:
//   1. la referencia tiene la forma RS-AAAAMM-NNNN;
//   2. la ruta está dentro de leads/<REF>/ y termina en .pdf;
//   3. existe un lead con esa referencia Y con esa misma ruta guardada.
// Es decir: sólo se firma un archivo que el propio sitio acaba de registrar.
// Un tercero no puede pedir el PDF de otro por probar rutas.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

import { EXPIRES, HOUR, checkRequest, clientIp, hashed } from "./guard.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const dbUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!dbUrl || !serviceKey) return json({ error: "not_configured" }, 503);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const parsed = checkRequest(body);
  if (!parsed.ok) return json({ error: "bad_request" }, 400);

  const db = createClient(dbUrl, serviceKey, { auth: { persistSession: false } });

  // Un visitante normal firma una o dos veces. Veinte por hora ya es alguien
  // probando cosas.
  const bucket = await hashed(clientIp(req.headers), Deno.env.get("AGENT_SALT") ?? dbUrl);
  const { data: within, error: limitError } = await db.rpc("agent_hit", {
    p_bucket: bucket,
    p_window_secs: HOUR,
    p_max_hits: 20,
  });
  if (limitError) {
    console.error("agent_hit failed", limitError);
    return json({ error: "unavailable" }, 503);
  }
  if (within !== true) return json({ error: "rate_limited" }, 429);

  const { data: lead, error: leadError } = await db
    .from("leads")
    .select("id,quote_path")
    .eq("ref", parsed.ref)
    .eq("quote_path", parsed.path)
    .limit(1)
    .maybeSingle();
  if (leadError) {
    console.error("lead lookup failed", leadError);
    return json({ error: "unavailable" }, 503);
  }
  if (!lead) return json({ error: "not_found" }, 404);

  const { data: signed, error: signError } = await db.storage
    .from("quotes")
    .createSignedUrl(parsed.path, EXPIRES);
  if (signError || !signed?.signedUrl) {
    console.error("sign failed", signError);
    return json({ error: "unavailable" }, 503);
  }

  // Se guarda el último enlace para que el CRM lo abra sin volver a firmar.
  await db.from("leads").update({ quote_url: signed.signedUrl }).eq("id", lead.id);

  return json({ url: signed.signedUrl, expiresIn: EXPIRES });
});
