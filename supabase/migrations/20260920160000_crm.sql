-- ─────────────────────────────────────────────────────────────────────────
-- CRM: turn `leads` from an inbox row into something you can work.
--
-- What was missing and why it mattered:
--   · No phone. The contact form stored email = '' and collected nothing else,
--     so a lead who didn't complete the WhatsApp hand-off could not be reached
--     at all. The admin inbox's "WhatsApp" button built a link from the empty
--     email and pointed at the number 0.
--   · No notes and no history. Every call, every "said he'd decide Friday",
--     lived in John's head.
--   · No follow-up date, so following up depended on remembering.
--   · status was free text with no constraint, so a typo silently created a
--     new stage that no view counted.
--
-- Idempotent on purpose: safe to run twice, and safe on a database where the
-- leads table already has rows.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. Columns ───────────────────────────────────────────────────────────
alter table public.leads
  -- Contact fields are nullable with no default: "absent" must be one value,
  -- not a choice between NULL and ''. Otherwise every read site has to write
  -- coalesce(phone,'') <> '' and one of them eventually forgets.
  add column if not exists phone          text,
  add column if not exists goal           text not null default '',
  add column if not exists ref            text not null default '',
  add column if not exists lang           text not null default '',
  -- What the deal is worth, once known. Kept apart from `budget`, which is
  -- the range the visitor picked before anyone looked at the problem.
  add column if not exists value_usd      numeric(10,2),
  add column if not exists next_action_at timestamptz,
  add column if not exists updated_at     timestamptz not null default now();

-- Email was NOT NULL with no default, which forced the form to write ''.
-- Let it be genuinely absent when the lead gave a phone instead, and collapse
-- the empty strings already stored so "no email" has exactly one spelling.
alter table public.leads alter column email drop not null;
alter table public.leads alter column email drop default;
update public.leads set email = null where btrim(email) = '';
update public.leads set phone = null where btrim(coalesce(phone, '')) = '';

-- Deliberately NOT adding a check constraint requiring email or phone.
-- `not valid` only skips the initial scan; it still fires on every later
-- UPDATE, so leads captured before this fix — which genuinely have no contact
-- details — would become impossible to move through the pipeline or mark as
-- lost. Being unable to close a dead lead is worse than storing it.
-- The contact requirement is enforced in the form instead, where it can
-- explain itself to the visitor.

-- ── 2. Pipeline stages ───────────────────────────────────────────────────
-- Constrained so a typo can't invent a stage the board won't show.
do $$
begin
  -- Normalise anything already stored before the constraint goes on.
  update public.leads set status = 'nuevo'
   where status is null
      or status not in ('nuevo','contactado','diagnostico','propuesta','ganado','perdido');

  if not exists (
    select 1 from pg_constraint where conname = 'leads_status_check'
  ) then
    alter table public.leads
      add constraint leads_status_check
      check (status in ('nuevo','contactado','diagnostico','propuesta','ganado','perdido'));
  end if;
end $$;

-- ── 3. Keep updated_at honest ────────────────────────────────────────────
drop trigger if exists leads_updated on public.leads;
create trigger leads_updated
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ── 4. Notes ─────────────────────────────────────────────────────────────
create table if not exists public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  body       text not null,
  -- 'note' is written by John; 'event' is written by the status trigger below,
  -- so the timeline shows both what happened and what he wrote about it.
  kind       text not null default 'note' check (kind in ('note','event')),
  author     text not null default '',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.lead_notes to authenticated;
grant all on public.lead_notes to service_role;
alter table public.lead_notes enable row level security;

drop policy if exists "lead_notes admin read"   on public.lead_notes;
drop policy if exists "lead_notes admin write"  on public.lead_notes;
drop policy if exists "lead_notes admin update" on public.lead_notes;
drop policy if exists "lead_notes admin delete" on public.lead_notes;

create policy "lead_notes admin read" on public.lead_notes
  for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "lead_notes admin write" on public.lead_notes
  for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "lead_notes admin update" on public.lead_notes
  for update to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create policy "lead_notes admin delete" on public.lead_notes
  for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Note that anon deliberately gets NO grant here: the public form writes to
-- leads, never to the private working notes about a lead.

-- ── 5. Stage changes write themselves into the timeline ──────────────────
create or replace function public.log_lead_stage_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_notes (lead_id, body, kind, author)
    values (new.id, old.status || ' → ' || new.status, 'event', coalesce(auth.email(), ''));
  end if;
  return new;
end $$;

drop trigger if exists leads_stage_logged on public.leads;
create trigger leads_stage_logged
  after update of status on public.leads
  for each row execute function public.log_lead_stage_change();

-- ── 6. Indexes the board actually queries on ─────────────────────────────
create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_created_idx     on public.leads (created_at desc);
create index if not exists leads_next_action_idx on public.leads (next_action_at)
  where next_action_at is not null;
create index if not exists lead_notes_lead_idx   on public.lead_notes (lead_id, created_at desc);
