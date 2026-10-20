-- ═════════════════════════════════════════════════════════════════════════
-- RUAH STUDIO — SETUP COMPLETO DE BASE DE DATOS
--
-- Para un proyecto de Supabase NUEVO. Pégalo entero en
--   Supabase → SQL Editor → New query → Run
-- y córrelo UNA sola vez.
--
-- Contiene, en orden, todas las migraciones de supabase/migrations/ más la
-- creación del bucket de imágenes, que ninguna migración creaba (en el
-- proyecto original lo creó Lovable por fuera, así que en un proyecto nuevo
-- subir imágenes desde el panel fallaba).
--
-- OJO: el primer usuario que se registre en /auth se vuelve administrador
-- automáticamente. Regístrate tú inmediatamente después de correr esto.
-- ═════════════════════════════════════════════════════════════════════════



-- ───────────────────────────────────────────────────────────
-- 20260811182301_4cf5de3f-c576-4a59-8903-a86310ea78d4.sql
-- ───────────────────────────────────────────────────────────


create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- PROJECTS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default '',
  cat text not null default 'Systems',
  context text not null default '',
  build text[] not null default '{}',
  stack text[] not null default '{}',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects public read" on public.projects for select using (true);
create policy "projects admin write" on public.projects for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();

-- FAQS
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  q text not null,
  a text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.faqs to anon;
grant select, insert, update, delete on public.faqs to authenticated;
grant all on public.faqs to service_role;
alter table public.faqs enable row level security;
create policy "faqs public read" on public.faqs for select using (true);
create policy "faqs admin write" on public.faqs for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger faqs_updated before update on public.faqs for each row execute function public.set_updated_at();

-- TESTIMONIALS
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  company text not null default '',
  quote text not null,
  rating int not null default 5,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
alter table public.testimonials enable row level security;
create policy "testimonials public read" on public.testimonials for select using (true);
create policy "testimonials admin write" on public.testimonials for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();

-- PRICING MODULES
create table public.pricing_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text not null default '',
  price numeric not null default 0,
  weeks numeric not null default 1,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.pricing_modules to anon;
grant select, insert, update, delete on public.pricing_modules to authenticated;
grant all on public.pricing_modules to service_role;
alter table public.pricing_modules enable row level security;
create policy "pricing public read" on public.pricing_modules for select using (true);
create policy "pricing admin write" on public.pricing_modules for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger pricing_updated before update on public.pricing_modules for each row execute function public.set_updated_at();

-- STUDIO TEXTS
create table public.studio_texts (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.studio_texts to anon;
grant select, insert, update, delete on public.studio_texts to authenticated;
grant all on public.studio_texts to service_role;
alter table public.studio_texts enable row level security;
create policy "texts public read" on public.studio_texts for select using (true);
create policy "texts admin write" on public.studio_texts for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger texts_updated before update on public.studio_texts for each row execute function public.set_updated_at();

-- LEADS
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business text not null default '',
  problem text not null default '',
  budget text not null default '',
  source text not null default 'web',
  status text not null default 'nuevo',
  created_at timestamptz not null default now()
);
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "leads anyone can submit" on public.leads for insert with check (true);
create policy "leads admin read" on public.leads for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "leads admin update" on public.leads for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "leads admin delete" on public.leads for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- SEED
insert into public.projects (name, kind, cat, context, build, stack, sort_order) values
('Nexo Criminal','Plataforma full-stack','Systems','Sistema de gestión e investigación con modelo de datos complejo, roles y relaciones entre entidades.',
 array['Arquitectura de datos relacional','Autenticación y permisos por rol','Búsqueda y vinculación de registros'],
 array['Java','Spring Boot','PostgreSQL','React'],1),
('Sistema de Contabilidad','Business software','Systems','Operación contable que vivía en hojas de cálculo, sin trazabilidad ni reportes en tiempo real.',
 array['Dashboard financiero con métricas vivas','Registro de movimientos y conciliación','Reportes exportables por período'],
 array['Next.js','TypeScript','Supabase','Tailwind'],2),
('Video Platform','SaaS / multimedia','Products','Herramienta para crear y editar video sin salir del navegador, orientada a creadores y equipos de marketing.',
 array['Editor con línea de tiempo','Procesamiento y render de clips','Librería de proyectos por usuario'],
 array['React','TypeScript','APIs de media','Storage'],3),
('Interactive Calculators','Lead-gen tools','Tools','Herramientas de cálculo embebibles que convierten visitas en conversaciones comerciales.',
 array['Lógica de negocio configurable','UX de resultado inmediato','Captura de lead al final del flujo'],
 array['React','TypeScript','Zod','Vercel'],4);

insert into public.faqs (q,a,sort_order) values
('¿Cuánto tarda un proyecto?','Una landing o herramienta interactiva sale en días. Un dashboard o sistema completo suele tomar de 2 a 6 semanas, con demos revisables cada semana.',1),
('¿Cómo se define el precio?','Con un diagnóstico corto. Mapeo el problema, propongo el sistema mínimo que lo resuelve y entrego un alcance cerrado con precio fijo, sin sorpresas.',2),
('¿Trabajas con negocios pequeños?','Sí. La mayoría de mis proyectos empiezan pequeños: una automatización o una herramienta puntual que se paga sola, y luego crecen a sistema completo.',3),
('¿Qué pasa después de la entrega?','Entrego código, documentación y accesos. Puedes seguir solo o contratar mantenimiento y evolución mensual con nuevas funciones, IA o automatizaciones.',4),
('¿Puedes integrar IA en algo que ya existe?','Sí. Conecto asistentes, clasificación automática, generación de contenido o análisis sobre sistemas y bases de datos que ya estás usando.',5);

insert into public.testimonials (name,role,company,quote,rating,sort_order) values
('María Fernández','Directora de operaciones','Distribuidora Andina','Pasamos de tres archivos de Excel a un panel donde veo pedidos, stock y cobros en tiempo real. Lo entregó en tres semanas.',5,1),
('Carlos Rivas','Founder','Rivas Legal','Automatizó la captación y clasificación de consultas. Hoy respondemos en minutos y cerramos el doble de casos.',5,2),
('Andrea Molina','Head of Growth','Creator Lab','La calculadora interactiva que construyó se convirtió en nuestra principal fuente de leads calificados.',5,3);

insert into public.pricing_modules (key,label,description,price,weeks,sort_order) values
('landing','Landing de conversión','Página única enfocada en un solo objetivo comercial.',600,1,1),
('web','Website completo','Estructura multi-página con contenido y SEO base.',1200,2,2),
('dashboard','Dashboard / CRM','Panel con métricas, registros y roles.',2500,4,3),
('ai','Asistente IA','Agente entrenado con tu contexto e integrado a tu operación.',1500,2,4),
('automation','Automatización','Flujos que eliminan tareas manuales repetitivas.',900,1,5),
('mvp','MVP a medida','Producto funcional listo para usuarios reales.',3500,6,6);

insert into public.studio_texts (key,value) values
('hero_kicker','AI · Software · Automation Studio'),
('hero_title_1','No construyo páginas web.'),
('hero_title_2','Construyo sistemas digitales que operan tu negocio.'),
('hero_subtitle','Dashboards, herramientas internas, IA aplicada, automatizaciones y MVPs para negocios y founders. De un proceso manual o una idea, a un producto funcionando.'),
('whatsapp_number','584120000000'),
('contact_email','hola@salazarstudio.com'),
('studio_name','SALAZAR STUDIO'),
('founder_name','John Salazar'),
('testimonials_title','Lo que dicen los que ya operan con sistema.');

-- ───────────────────────────────────────────────────────────
-- 20260811182315_c5123af2-3219-4596-a279-3d46526d0b05.sql
-- ───────────────────────────────────────────────────────────

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────
-- 20260811182332_a67c7108-693d-4dd6-8290-dca818ff9c5f.sql
-- ───────────────────────────────────────────────────────────

create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger on_auth_user_created_first_admin
after insert on auth.users
for each row execute function public.grant_first_admin();

-- ───────────────────────────────────────────────────────────
-- 20260811182345_e6f05e3e-4b96-445c-b17c-ff4871aa3b22.sql
-- ───────────────────────────────────────────────────────────

revoke execute on function public.grant_first_admin() from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────
-- 20260814125914_7a924cc1-f125-4c44-b008-8e1efe4a5d26.sql
-- ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.pricing_modules CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.studio_texts CASCADE;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  stack text[] NOT NULL DEFAULT '{}',
  link text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  prefill text NOT NULL DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects public read" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects admin write" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "faqs admin write" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL DEFAULT '',
  price_from text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  bullets text[] NOT NULL DEFAULT '{}',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing TO authenticated;
GRANT ALL ON public.pricing TO service_role;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing public read" ON public.pricing FOR SELECT USING (true);
CREATE POLICY "pricing admin write" ON public.pricing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pricing_updated_at BEFORE UPDATE ON public.pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.we_build (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.we_build TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.we_build TO authenticated;
GRANT ALL ON public.we_build TO service_role;
ALTER TABLE public.we_build ENABLE ROW LEVEL SECURITY;
CREATE POLICY "we_build public read" ON public.we_build FOR SELECT USING (true);
CREATE POLICY "we_build admin write" ON public.we_build FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER we_build_updated_at BEFORE UPDATE ON public.we_build
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.studio_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.studio_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_content TO authenticated;
GRANT ALL ON public.studio_content TO service_role;
ALTER TABLE public.studio_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_content public read" ON public.studio_content FOR SELECT USING (true);
CREATE POLICY "studio_content admin write" ON public.studio_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER studio_content_updated_at BEFORE UPDATE ON public.studio_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  business text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials public read" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "testimonials admin write" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.projects (code, title, subtitle, description, stack, prefill, "order") VALUES
('01','Nexo Criminal','Criminal Intelligence Platform','A full-stack intelligence platform designed to connect people, vehicles, locations, incidents and relationships through structured data and visual analysis.',ARRAY['Java','Spring Boot','React','TypeScript','PostgreSQL','PostGIS'],'Quiero una plataforma de datos e inteligencia similar a Nexo Criminal (registros relacionados, búsqueda y análisis visual).',1),
('02','Business Management & Accounting System','Business Software','A digital system designed to centralize business records, financial information and operational workflows.',ARRAY['FastAPI','Python','React','PostgreSQL'],'Quiero un sistema de gestión y contabilidad para centralizar registros, finanzas y flujos operativos de mi negocio.',2),
('03','Video Creation & Editing Platform','Creator Platform','A web-based creator platform for creating, editing and managing video content through a unified workflow.',ARRAY['Next.js','Supabase','AI APIs'],'Quiero una plataforma web para crear, editar y gestionar contenido de video en un solo flujo.',3),
('04','Interactive Calculator Suite','Interactive Tools','A collection of interactive tools designed to transform complex calculations into simple, intuitive user experiences.',ARRAY['React','TypeScript'],'Quiero calculadoras interactivas que conviertan cálculos complejos en una experiencia simple para mis clientes.',4);

INSERT INTO public.faqs (question, answer, "order") VALUES
('¿Trabajan con negocios pequeños o solo con empresas grandes?','Trabajamos con negocios de cualquier tamaño. Lo que importa es el problema, no el tamaño de la empresa.',1),
('¿Cuánto tarda un proyecto típico?','Depende de la complejidad. Una herramienta sencilla puede estar lista en pocos días, mientras que sistemas y productos personalizados requieren más planificación. Antes de comenzar definimos alcance, entregables y timeline.',2),
('¿Y si no sé exactamente qué necesito?','No necesitas tener la solución definida. Cuéntanos qué quieres mejorar, qué problema estás intentando resolver o qué quieres construir. Analizamos el problema y te recomendamos el camino más adecuado.',3),
('¿Pueden trabajar sobre una idea que todavía no está completamente definida?','Sí. Muchas veces el proyecto comienza precisamente ahí. Partimos del problema, definimos la solución, construimos un prototipo y evolucionamos hacia un producto funcional.',4),
('¿Trabajan de forma remota, con clientes fuera del país?','Sí. Trabajamos con clientes en cualquier país, de forma completamente remota.',5);

INSERT INTO public.pricing (service, price_from, description, bullets, "order") VALUES
('AI & Automation','desde $100','Asistentes de IA, automatización de tareas repetitivas y sistemas de contenido.',ARRAY['Asistente IA a medida','Automatización de flujos','Integración con tus herramientas'],1),
('Digital Systems','desde $200','Dashboards, CRMs y herramientas internas para ordenar la operación.',ARRAY['Dashboard de negocio','CRM y registros','Herramientas internas'],2),
('Web Apps & MVPs','desde $350','Aplicaciones web, productos digitales y MVPs listos para usuarios reales.',ARRAY['Web app a medida','MVP funcional','UI/UX y branding'],3);

INSERT INTO public.we_build (item, "order") VALUES
('AI assistants',1),('AI automation',2),('Business dashboards',3),('CRMs',4),('Interactive calculators',5),('Internal tools',6),('Landing pages',7),('Web applications',8),('MVPs',9),('Creator platforms',10),('Custom software',11);

INSERT INTO public.testimonials (name, business, text, avatar_url, published, "order") VALUES
('María Rivas','Clínica Dental Rivas','Pasamos de agendar por WhatsApp a un sistema que organiza pacientes y recordatorios solo.','',false,1),
('Andrés Peña','Peña Logística','El dashboard nos dio visibilidad real de la operación. Dejamos de trabajar con hojas de cálculo.','',false,2),
('Laura Gómez','Estudio Creativo LG','La calculadora interactiva se volvió nuestra principal fuente de solicitudes de presupuesto.','',false,3);

INSERT INTO public.studio_content (key, value) VALUES
('site_name','Ruah Studio'),
('hero_eyebrow','AI • Software • Automation • Digital Systems'),
('hero_title','From idea to working product.'),
('hero_subtitle','AI-powered software, automation and digital systems built around your business.'),
('pillar_1_title','INTELLIGENCE'),
('pillar_1_body','AI assistants, automation, content systems, analysis, agents.'),
('pillar_2_title','SYSTEMS'),
('pillar_2_body','Dashboards, CRMs, internal tools, business software.'),
('pillar_3_title','EXPERIENCE'),
('pillar_3_body','Web apps, landing pages, UI/UX, digital products, branding.'),
('form_title','Have an idea? Let''s build it.'),
('form_subtitle','Tell us what you''re trying to build, improve or automate.'),
('whatsapp','584222010041'),
('email','hola@ruahstudio.com'),
('founder','John Salazar'),
('photo_url','');

-- ───────────────────────────────────────────────────────────
-- 20260815165538_421114ab-8270-4113-8fb5-6e8c6cbaab79.sql
-- ───────────────────────────────────────────────────────────

CREATE POLICY "site images readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');
CREATE POLICY "site images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

-- ───────────────────────────────────────────────────────────
-- 20260816013725_50e3e966-9a24-427e-8ee8-b1f63dfe448d.sql
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- ───────────────────────────────────────────────────────────
-- 20260905192920_595953e7-997a-439d-9ad2-19a8cde33e5e.sql
-- ───────────────────────────────────────────────────────────

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title_es text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitle_es text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_es text NOT NULL DEFAULT '';

ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_es text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_es text NOT NULL DEFAULT '';

ALTER TABLE public.pricing
  ADD COLUMN IF NOT EXISTS service_es text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_es text NOT NULL DEFAULT '';

ALTER TABLE public.we_build
  ADD COLUMN IF NOT EXISTS item_es text NOT NULL DEFAULT '';

ALTER TABLE public.studio_content
  ADD COLUMN IF NOT EXISTS value_es text NOT NULL DEFAULT '';

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS text_es text NOT NULL DEFAULT '';

-- ───────────────────────────────────────────────────────────
-- 20260920160000_crm.sql
-- ───────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────
-- 20260921150000_contact_and_agent_limits.sql
-- ───────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────
-- 20260921190000_lead_chat_and_quote.sql
-- ───────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────
-- 20260921210000_brief_score_and_contact_rules.sql
-- ───────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────
-- 20260924160000_goals_multiselect.sql
-- ───────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────
-- 20260924190000_meetings_and_copilot.sql
-- ───────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────
-- 20260928140000_quote_files.sql
-- ───────────────────────────────────────────────────────────

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


-- ───────────────────────────────────────────────────────────
-- Bucket de imágenes del panel (privado: cms.ts sirve URLs firmadas)
-- ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', false)
on conflict (id) do nothing;
