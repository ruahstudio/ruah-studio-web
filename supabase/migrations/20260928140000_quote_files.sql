-- ─────────────────────────────────────────────────────────────────────────
-- La cotización viaja con el lead.
--
-- Antes el PDF sólo se descargaba en el navegador del visitante: si el
-- cliente escribía por WhatsApp, John recibía el texto pero no el documento.
-- Ahora el sitio sube el PDF y el mensaje lleva su enlace, y el CRM lo abre.
--
-- WhatsApp no permite que un enlace wa.me adjunte un archivo, así que el
-- "adjunto" real es un enlace firmado con caducidad. Nada de URLs públicas
-- permanentes: una cotización lleva nombre, alcance y precio.
--
-- Idempotente: se puede correr dos veces.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.leads
  -- Ruta dentro del bucket privado: leads/<REF>/cotizacion-<REF>.pdf
  add column if not exists quote_path text,
  -- Último enlace firmado que se envió (caduca; el CRM puede firmar otro).
  add column if not exists quote_url  text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_quote_path_check') then
    alter table public.leads add constraint leads_quote_path_check
      check (quote_path is null or (quote_path like 'leads/%' and length(quote_path) <= 200));
  end if;
end $$;

-- Bucket privado, sólo PDF, 5 MB por archivo.
insert into storage.buckets (id, name, public)
values ('quotes', 'quotes', false)
on conflict (id) do update set public = false;

-- El tamaño y el tipo se fijan aparte: son columnas que no existen en
-- instalaciones antiguas de storage, y la migración debe correr igual.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit'
  ) then
    execute $q$update storage.buckets
               set file_size_limit = 5242880, allowed_mime_types = '{application/pdf}'
               where id = 'quotes'$q$;
  end if;
end $$;

-- El visitante (anon) sólo puede ESCRIBIR, y sólo dentro de leads/.
-- No puede leer, ni listar, ni borrar: su copia la recibe por el enlace
-- firmado que devuelve la función quote-link.
drop policy if exists "quotes visitor upload" on storage.objects;
create policy "quotes visitor upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'quotes' and name like 'leads/%' and name not like '%..%');

drop policy if exists "quotes admin read" on storage.objects;
create policy "quotes admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'quotes' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "quotes admin delete" on storage.objects;
create policy "quotes admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'quotes' and public.has_role(auth.uid(), 'admin'));
