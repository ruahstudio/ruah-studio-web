-- ─────────────────────────────────────────────────────────────────────────
-- Reuniones: la transcripción que sube John y lo que la IA extrajo de ella.
--
-- La grabación se hace fuera (teléfono, Zoom, extensión del navegador). Aquí
-- sólo entra el texto, y el análisis se guarda AL LADO de la transcripción,
-- nunca en vez de ella: cada afirmación de la IA se puede comprobar contra la
-- frase exacta que la originó.
--
-- Sólo el administrador puede leer y escribir: aquí hay palabras textuales de
-- clientes, que es lo más sensible que guarda este proyecto.
--
-- Idempotente: se puede correr dos veces.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.lead_meetings (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  -- Cómo fue la conversación: llamada, videollamada, presencial, notas.
  kind        text not null default 'call',
  title       text not null default '',
  held_at     timestamptz not null default now(),
  -- De dónde salió el texto (Zoom, Tactiq, grabadora del teléfono, a mano).
  source      text not null default '',
  -- El texto completo, tal como se subió. Es la fuente de la verdad.
  transcript  text not null,
  -- Lo que la IA extrajo: resumen, presupuesto, plazo, objeciones, próximos
  -- pasos… cada afirmación con su cita textual y su nivel (dato / inferencia
  -- / dudoso). Null mientras no se haya analizado.
  analysis    jsonb,
  -- Quién la subió, y si el análisis vino del modelo o del modo sin conexión.
  author      text not null default '',
  analyzed_by text,
  created_at  timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lead_meetings_kind_check') then
    alter table public.lead_meetings add constraint lead_meetings_kind_check
      check (kind in ('call', 'video', 'meeting', 'notes', 'chat'));
  end if;
  -- Una transcripción de una hora ronda los 60 KB; 400 KB es holgado y a la
  -- vez impide que alguien use esta tabla como almacén de archivos.
  if not exists (select 1 from pg_constraint where conname = 'lead_meetings_size_check') then
    alter table public.lead_meetings add constraint lead_meetings_size_check
      check (length(transcript) between 1 and 400000
             and (analysis is null or length(analysis::text) <= 65536)
             and length(title) <= 200 and length(source) <= 120);
  end if;
end $$;

create index if not exists lead_meetings_lead_idx on public.lead_meetings (lead_id, held_at desc);

alter table public.lead_meetings enable row level security;

drop policy if exists "lead_meetings admin read" on public.lead_meetings;
drop policy if exists "lead_meetings admin write" on public.lead_meetings;
drop policy if exists "lead_meetings admin update" on public.lead_meetings;
drop policy if exists "lead_meetings admin delete" on public.lead_meetings;

create policy "lead_meetings admin read" on public.lead_meetings
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "lead_meetings admin write" on public.lead_meetings
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "lead_meetings admin update" on public.lead_meetings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "lead_meetings admin delete" on public.lead_meetings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Una reunión guardada es un evento del historial del lead: se anota sola,
-- igual que los cambios de etapa.
create or replace function public.lead_meetings_logged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_notes (lead_id, body, kind, author)
  values (
    new.lead_id,
    'Reunión registrada: ' || coalesce(nullif(new.title, ''), new.kind),
    'event',
    coalesce(new.author, '')
  );
  update public.leads set updated_at = now() where id = new.lead_id;
  return new;
end $$;

drop trigger if exists lead_meetings_logged on public.lead_meetings;
create trigger lead_meetings_logged
  after insert on public.lead_meetings
  for each row execute function public.lead_meetings_logged();
