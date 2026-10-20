-- ─────────────────────────────────────────────────────────────────────────
-- The qualified lead: structured brief, deadline, budget fit and score —
-- plus contact format rules enforced by the database itself (new rows).
--
-- Idempotent: safe to run twice.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.leads
  -- The six discovery fields as captured: problem, business, outcome,
  -- current, timeline, budget (see src/lib/brief.ts).
  add column if not exists brief      jsonb,
  -- Option code: urgent | month | quarter | exploring
  add column if not exists timeline   text not null default '',
  -- How the quote sat against the stated budget:
  -- within | phased | below | unknown
  add column if not exists budget_fit text,
  -- Where John should spend his next hour: hot | warm | cold
  add column if not exists score      text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_score_check') then
    alter table public.leads add constraint leads_score_check
      check (score is null or score in ('hot', 'warm', 'cold'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'leads_fit_check') then
    alter table public.leads add constraint leads_fit_check
      check (budget_fit is null or budget_fit in ('within', 'phased', 'below', 'unknown'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'leads_brief_size_check') then
    alter table public.leads add constraint leads_brief_size_check
      check (brief is null or length(brief::text) <= 4096);
  end if;
end $$;

create index if not exists leads_score_idx on public.leads (score);

-- Contact formats, checked on INSERT only. The site validates first (mobile
-- numbering plans, email typos, Instagram rules); this stops anything that
-- skips the site. A trigger instead of a CHECK: Postgres re-checks a CHECK on
-- every UPDATE, so leads captured before these rules could no longer be
-- moved through the CRM pipeline.
--   phone: E.164 digits without "+", 8-15 digits, no leading 0
--   email: something@domain.tld, no spaces, no ".."
--   instagram: Instagram's own handle rules
alter table public.leads drop constraint if exists leads_contact_format_check;

create or replace function public.leads_contact_format()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.phone is not null and new.phone !~ '^[1-9][0-9]{7,14}$' then
    raise exception 'invalid phone' using errcode = '23514';
  end if;
  if new.email is not null and new.email <> ''
     and (new.email !~* '^[^\s@]+@[^\s@]+\.[a-z]{2,}$' or new.email ~ '\.\.') then
    raise exception 'invalid email' using errcode = '23514';
  end if;
  if new.instagram is not null and (
       new.instagram !~ '^[a-z0-9._]{1,30}$'
       or new.instagram ~ '^\.' or new.instagram ~ '\.$' or new.instagram ~ '\.\.') then
    raise exception 'invalid instagram' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists leads_contact_format on public.leads;
create trigger leads_contact_format
  before insert on public.leads
  for each row execute function public.leads_contact_format();
