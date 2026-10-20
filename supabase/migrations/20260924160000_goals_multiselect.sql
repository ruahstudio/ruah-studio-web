-- ─────────────────────────────────────────────────────────────────────────
-- "¿Qué quieres conseguir?" deja de ser un texto y pasa a ser una lista.
--
-- Un lead casi nunca quiere una sola cosa: quiere vender más Y automatizar
-- WhatsApp Y tener web. Guardarlo como lista permite filtrar y contar en el
-- CRM; la frase legible sigue en `goal`.
--
-- Idempotente: se puede correr dos veces.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.leads
  -- Códigos fijos (ver src/lib/goals.ts): clients, sales, website, store,
  -- app, automate, whatsapp, instagram, ai, crm, brand, support, leads,
  -- conversion, custom, other.
  add column if not exists goals      text[] not null default '{}',
  -- Lo que escribió cuando eligió "otro".
  add column if not exists goal_other text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_goals_check') then
    alter table public.leads add constraint leads_goals_check
      check (cardinality(goals) <= 16 and (goal_other is null or length(goal_other) <= 200));
  end if;
end $$;

-- Para "¿cuántos leads quieren automatizar WhatsApp?" sin escanear la tabla.
create index if not exists leads_goals_idx on public.leads using gin (goals);
