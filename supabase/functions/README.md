# Edge Functions

## project-assistant

Backs the site's project assistant. Keeps the Anthropic key server-side.

```bash
supabase functions deploy project-assistant
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Until it is deployed the widget still works: `src/lib/agent.ts` falls back to a
small local responder and flags the reply as `live: false`, so the UI can label
it honestly instead of pretending a model answered.
