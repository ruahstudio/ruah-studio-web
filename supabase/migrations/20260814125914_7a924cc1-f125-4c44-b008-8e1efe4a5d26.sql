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