-- ─────────────────────────────────────────────────────────────────────────
-- What the chat learned and what the configurator priced, saved on the lead.
--
-- Before this, a visitor could talk to the assistant, build an estimate and
-- fill in the form, and the CRM received only the form: the conversation,
-- the assistant's conclusion and the quoted system were lost at the last
-- step. Now all of it arrives with the lead.
--
-- Idempotent: safe to run twice.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.leads
  -- The assistant's summary, written for John.
  add column if not exists chat_summary    text,
  -- The conversation itself, capped by the widget (12 visitor turns, 800
  -- characters each), as [{role, content}, …].
  add column if not exists chat_transcript jsonb,
  -- The system that was quoted: module ids from src/lib/pricing.ts.
  add column if not exists modules         text[] not null default '{}',
  -- The quote as the visitor saw it. Kept apart from value_usd, which is
  -- what John decides the deal is worth after talking to them.
  add column if not exists estimate_usd    numeric(10,2),
  add column if not exists weeks           numeric(4,1);

-- The public form may write these on insert (it already could insert leads);
-- nothing changes about who can read them: admins only, as before.
--
-- Because anyone can insert, sizes are bounded here and not only in the
-- widget: a script posting a megabyte "transcript" must be refused by the
-- database. Limits sit well above what the widget can produce.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_chat_size_check') then
    alter table public.leads add constraint leads_chat_size_check check (
      (chat_summary is null or length(chat_summary) <= 2000)
      and (chat_transcript is null or length(chat_transcript::text) <= 32768)
      and cardinality(modules) <= 16
    );
  end if;
end $$;
