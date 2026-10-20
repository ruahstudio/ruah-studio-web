-- ─────────────────────────────────────────────────────────────────────────
-- Latido: lo que evita que Supabase pause el proyecto.
--
-- En el plan gratuito, un proyecto sin actividad durante 7 días se pausa y el
-- sitio deja de cargar datos hasta que alguien entra al panel a reactivarlo.
-- "Actividad" significa peticiones que llegan de afuera; un trabajo interno
-- de la propia base no cuenta.
--
-- Por eso esto: una fila y una función que la actualiza. Un cron externo la
-- llama cada tanto, y esa llamada es una escritura real en Postgres.
--
-- La función pide una clave para que no la pueda disparar cualquiera que
-- conozca la URL del proyecto. La clave se guarda aquí mismo y se compara
-- con tiempo constante.
--
-- Idempotente: se puede correr dos veces.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.heartbeat (
  id       smallint primary key default 1 check (id = 1),
  beat_at  timestamptz not null default now(),
  beats    bigint not null default 0,
  secret   text not null
);

-- Una sola fila, con una clave aleatoria la primera vez.
insert into public.heartbeat (id, secret)
values (1, encode(gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

alter table public.heartbeat enable row level security;
-- Nadie lee ni escribe la tabla directamente: sólo la función de abajo.
drop policy if exists "heartbeat admin read" on public.heartbeat;
create policy "heartbeat admin read" on public.heartbeat
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

/**
 * Marca el latido. Devuelve la hora si la clave es correcta, o un error si no.
 * security definer: escribe la fila aunque quien llama no tenga permisos.
 */
create or replace function public.ping(p_secret text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
  ts timestamptz;
begin
  select secret = coalesce(p_secret, '') into ok from public.heartbeat where id = 1;
  if not coalesce(ok, false) then
    raise exception 'invalid key' using errcode = '28000';
  end if;
  update public.heartbeat
    set beat_at = now(), beats = beats + 1
    where id = 1
    returning beat_at into ts;
  return ts;
end $$;

revoke all on function public.ping(text) from public;
grant execute on function public.ping(text) to anon, authenticated;
