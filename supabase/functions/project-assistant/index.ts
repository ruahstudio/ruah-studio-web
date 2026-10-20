// Supabase Edge Function — Ruah project assistant.
//
// DEPLOY (always pass --project-ref: supabase/config.toml still carries the
// id of the old Lovable project):
//   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref REF
//   npx supabase functions deploy project-assistant --project-ref REF --no-verify-jwt
//
// The API key lives only here. The system prompt lives only here too — see
// guard.ts for why accepting it from the browser was a hole.
//
// Every call passes four limits before it can cost money:
//   1. input shape and size           (guard.parseBody)
//   2. turns in this conversation     (AGENT_MAX_TURNS)
//   3. calls per visitor, hour + day  (AGENT_IP_PER_HOUR / AGENT_IP_PER_DAY)
//   4. calls per day, whole site      (AGENT_GLOBAL_PER_DAY)
// and the reply itself is capped at AGENT_MAX_TOKENS. When a limit is hit the
// widget falls back to its free offline replies and offers WhatsApp, so the
// visitor never sees an error.
//
// Outer backstop, outside this code: set a monthly spend limit in the
// Anthropic console. Nothing here can spend past it.

import Anthropic from "npm:@anthropic-ai/sdk@0.68.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  BRIEF_TOOL,
  RESPOND_TOOL,
  briefPrompt,
  clientIp,
  parseBody,
  readLimits,
  sanitizeBrief,
  sanitizeTurn,
  systemPrompt,
  visitorKey,
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

const HOUR = 3600;
const DAY = 86400;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const dbUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !dbUrl || !serviceKey) return json({ error: "not_configured" }, 503);

  const limits = readLimits((k) => Deno.env.get(k));

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const parsed = parseBody(body, limits);
  if (!parsed.ok) return json({ error: parsed.reason }, 400);

  // Limit responses are 200 on purpose: the browser SDK hides the body of
  // non-2xx responses, and the widget needs `limited` to pick its reply.
  // A brief is the hand-off itself, so it isn't blocked by the turn cap —
  // otherwise the longest (most qualified) conversations could never be
  // summarised. It still counts against the visitor and daily limits below.
  if (parsed.mode === "chat" && parsed.userTurns > limits.maxTurns) {
    return json({ limited: "conversation" });
  }

  const db = createClient(dbUrl, serviceKey, { auth: { persistSession: false } });
  const salt = Deno.env.get("AGENT_SALT") ?? dbUrl;
  const visitor = await visitorKey(clientIp(req.headers), salt);

  const checks: [string, number, number, string][] = [
    [visitor, HOUR, limits.ipPerHour, "visitor"],
    [visitor, DAY, limits.ipPerDay, "visitor"],
    ["global", DAY, limits.globalPerDay, "daily"],
  ];
  for (const [bucket, windowSecs, max, reason] of checks) {
    const { data, error } = await db.rpc("agent_hit", {
      p_bucket: bucket,
      p_window_secs: windowSecs,
      p_max_hits: max,
    });
    // Fail closed: if the limits can't be checked (migration missing, DB
    // down), no paid call is made. The offline replies still work.
    if (error) {
      console.error("agent_hit failed", error);
      return json({ limited: "unavailable" });
    }
    if (data !== true) return json({ limited: reason });
  }

  // Keep the counters table small without a cron job.
  if (Math.random() < 0.01) void db.rpc("agent_usage_prune");

  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-4-5-20251001";

  if (parsed.mode === "brief") {
    try {
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model,
        max_tokens: limits.maxBriefTokens,
        system: briefPrompt(parsed.lang, parsed.known),
        tools: [BRIEF_TOOL],
        tool_choice: { type: "tool", name: BRIEF_TOOL.name },
        messages: parsed.messages,
      });
      const call = res.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === BRIEF_TOOL.name,
      );
      const brief = sanitizeBrief(call?.input);
      return brief ? json({ brief }) : json({ limited: "unavailable" });
    } catch (err) {
      console.error("project-assistant brief failed", err);
      return json({ error: "upstream_failed" }, 502);
    }
  }

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      // Haiku: short structured turns don't need a larger model. Override
      // without redeploying code:
      //   npx supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5 --project-ref REF
      model,
      max_tokens: limits.maxTokens,
      system: systemPrompt(parsed.lang, parsed.known),
      tools: [RESPOND_TOOL],
      tool_choice: { type: "tool", name: RESPOND_TOOL.name },
      messages: parsed.messages,
    });
    const call = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === RESPOND_TOOL.name,
    );
    const turn = sanitizeTurn(call?.input);
    if (!turn) return json({ limited: "unavailable" });
    return json({ text: turn.reply, brief: turn.brief, ask: turn.ask });
  } catch (err) {
    console.error("project-assistant upstream failed", err);
    return json({ error: "upstream_failed" }, 502);
  }
});
