
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
