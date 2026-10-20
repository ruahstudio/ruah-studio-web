// Supabase Edge Function — copiloto interno del CRM de Ruah Studio.
//
// DESPLIEGUE (con verificación de JWT, al revés que el asistente público:
// esto lee datos de clientes y sólo puede usarlo el administrador):
//   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref REF
//   npx supabase functions deploy crm-copilot --project-ref REF
//
// Tres modos:
//   ask      — preguntas sobre el pipeline, respondidas con citas a leads reales
//   meeting  — analiza una transcripción que John subió
//   prep     — prepara la próxima conversación con un lead
//
// Orden de los controles, que es lo que importa:
//   1. ¿hay sesión y es admin?  (contra la base de datos, no contra el token)
//   2. ¿está dentro del límite diario?  (falla cerrado)
//   3. recién ahí se leen datos y se llama al modelo
//
// El modelo recibe un resumen del CRM SIN teléfonos, correos ni Instagram: no
// los necesita para decir a quién llamar hoy.

import Anthropic from "npm:@anthropic-ai/sdk@0.68.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  ASK_TOOL,
  MEETING_TOOL,
  PREP_TOOL,
  askPrompt,
  buildContext,
  meetingPrompt,
  parseBody,
  prepPrompt,
  readLimits,
  sanitizeAnalysis,
  sanitizeAnswer,
  sanitizePrep,
  type LeadRow,
  type MeetingRow,
  type NoteRow,
} from "./guard.ts";

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

const DAY = 86400;
const LEAD_FIELDS =
  "id,name,business,status,score,goal,goals,budget,timeline,budget_fit,problem,chat_summary,brief,modules,estimate_usd,value_usd,next_action_at,created_at,updated_at,source,ref";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const dbUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!dbUrl || !serviceKey) return json({ error: "not_configured" }, 503);
  // Sin clave del modelo no hay error: el CRM tiene su modo sin IA.
  if (!apiKey) return json({ limited: "not_configured" });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const db = createClient(dbUrl, serviceKey, { auth: { persistSession: false } });

  // 1. Quién es — según la base de datos, no según lo que diga el navegador.
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth?.user) return json({ error: "unauthorized" }, 401);

  const { data: isAdmin, error: roleError } = await db.rpc("has_role", {
    _user_id: auth.user.id,
    _role: "admin",
  });
  if (roleError) {
    console.error("has_role failed", roleError);
    return json({ error: "unauthorized" }, 403);
  }
  if (isAdmin !== true) return json({ error: "forbidden" }, 403);

  const limits = readLimits((k) => Deno.env.get(k));

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const parsed = parseBody(body, limits);
  if (!parsed.ok) return json({ error: parsed.reason }, 400);

  // 2. Tope de gasto, por usuario y por día. Falla cerrado.
  const { data: within, error: limitError } = await db.rpc("agent_hit", {
    p_bucket: `copilot:${auth.user.id}`,
    p_window_secs: DAY,
    p_max_hits: limits.perDay,
  });
  if (limitError) {
    console.error("agent_hit failed", limitError);
    return json({ limited: "unavailable" });
  }
  if (within !== true) return json({ limited: "daily" });

  // 3. Datos. Service role: las políticas ya se comprobaron arriba.
  const focusId = parsed.mode === "ask" ? parsed.leadId : parsed.leadId;
  let leads: LeadRow[] = [];
  if (parsed.mode === "ask" && !focusId) {
    const { data } = await db
      .from("leads")
      .select(LEAD_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limits.maxLeads);
    leads = (data ?? []) as LeadRow[];
  } else if (focusId) {
    const { data } = await db.from("leads").select(LEAD_FIELDS).eq("id", focusId).limit(1);
    leads = (data ?? []) as LeadRow[];
    if (!leads.length) return json({ error: "lead_not_found" }, 404);
  }

  const ids = leads.map((l) => l.id);
  const { data: noteRows } = ids.length
    ? await db
        .from("lead_notes")
        .select("lead_id,body,kind,created_at")
        .in("lead_id", ids)
        .order("created_at", { ascending: true })
        .limit(400)
    : { data: [] };
  const { data: meetingRows } = ids.length
    ? await db
        .from("lead_meetings")
        .select("lead_id,title,held_at,analysis")
        .in("lead_id", ids)
        .order("held_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const { text: context, refs } = buildContext(
    leads,
    (noteRows ?? []) as NoteRow[],
    (meetingRows ?? []) as MeetingRow[],
    new Date(),
  );

  const model = Deno.env.get("COPILOT_MODEL") ?? "claude-haiku-4-5-20251001";
  const client = new Anthropic({ apiKey });

  try {
    if (parsed.mode === "meeting") {
      const res = await client.messages.create({
        model,
        max_tokens: limits.maxAnalysisTokens,
        system: meetingPrompt(context),
        tools: [MEETING_TOOL],
        tool_choice: { type: "tool", name: MEETING_TOOL.name },
        messages: [
          {
            role: "user",
            content: `TRANSCRIPCIÓN:\n\n${parsed.transcript}`,
          },
        ],
      });
      const call = res.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === MEETING_TOOL.name,
      );
      // Toda afirmación sin cita real en la transcripción se descarta aquí.
      const analysis = sanitizeAnalysis(call?.input, parsed.transcript);
      return analysis ? json({ analysis }) : json({ limited: "unavailable" });
    }

    if (parsed.mode === "prep") {
      const res = await client.messages.create({
        model,
        max_tokens: limits.maxTokens,
        system: prepPrompt(context),
        tools: [PREP_TOOL],
        tool_choice: { type: "tool", name: PREP_TOOL.name },
        messages: [{ role: "user", content: "Prepárame para la próxima conversación." }],
      });
      const call = res.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === PREP_TOOL.name,
      );
      const prep = sanitizePrep(call?.input);
      return prep ? json({ prep }) : json({ limited: "unavailable" });
    }

    const scope = focusId
      ? "\nLa pregunta es sobre UN lead concreto: el que aparece en los datos."
      : "\nLa pregunta es sobre todo el pipeline.";
    const res = await client.messages.create({
      model,
      max_tokens: limits.maxTokens,
      system: `${askPrompt(scope)}\n\nDATOS DEL CRM:\n${context}`,
      tools: [ASK_TOOL],
      tool_choice: { type: "tool", name: ASK_TOOL.name },
      messages: [{ role: "user", content: parsed.question }],
    });
    const call = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === ASK_TOOL.name,
    );
    const answer = sanitizeAnswer(call?.input, refs);
    return answer ? json({ answer }) : json({ limited: "unavailable" });
  } catch (err) {
    console.error("crm-copilot upstream failed", err);
    return json({ error: "upstream_failed" }, 502);
  }
});
