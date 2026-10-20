-- ─────────────────────────────────────────────────────────────────────────
-- 1. Instagram on leads (optional field in the contact step)
-- 2. Usage limits for the AI project assistant
--
-- Idempotent: safe to run twice, safe after 20260920160000_crm.sql.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.leads add column if not exists instagram text;

-- ── Agent usage counters ─────────────────────────────────────────────────
-- One row per (bucket, time window). A bucket is either a hashed visitor
-- ("ip:<sha256>") or the global counter ("global"). The raw IP is never
-- stored — only a salted hash, which is enough to count and useless to
-- identify anyone.
create table if not exists public.agent_usage (
  bucket       text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (bucket, window_start)
);

-- Nobody reads or writes this from the browser. Only the edge function,
-- which runs with the service role, touches it.
alter table public.agent_usage enable row level security;
revoke all on public.agent_usage from anon, authenticated;
grant all on public.agent_usage to service_role;

-- ── Atomic check-and-count ───────────────────────────────────────────────
-- Increments the counter for the current window and says whether the call
-- is still within `max_hits`. Doing it in one statement matters: a
-- read-then-write in the edge function would let two simultaneous requests
-- both see 19/20 and both go through.
create or replace function public.agent_hit(
  p_bucket      text,
  p_window_secs integer,
  p_max_hits    integer
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_secs) * p_window_secs);
  n integer;
begin
  insert into public.agent_usage (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = agent_usage.hits + 1
  returning hits into n;
  return n <= p_max_hits;
end $$;

revoke all on function public.agent_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.agent_hit(text, integer, integer) to service_role;

-- Old windows are worthless after a day; keep the table small.
create or replace function public.agent_usage_prune()
returns void language sql security definer set search_path = public as $$
  delete from public.agent_usage where window_start < now() - interval '2 days';
$$;
revoke all on function public.agent_usage_prune() from public, anon, authenticated;
grant execute on function public.agent_usage_prune() to service_role;
