-- Columnas de contenido para los cinco idiomas que faltaban.
--
-- src/lib/cms.ts lee `<campo>_<idioma>` para los siete idiomas del sitio,
-- pero la base solo tenía `_es`. Así que un visitante en portugués, francés,
-- alemán, italiano o árabe veía la interfaz traducida y TODO el contenido del
-- CMS en inglés, sin ningún error visible: `row["title_pt"]` simplemente venía
-- `undefined` y el código caía al valor base.
--
-- Son columnas de texto con valor por defecto vacío: cuando están vacías el
-- sitio sigue usando el inglés, igual que hasta ahora. Nada se rompe si John
-- todavía no las ha llenado.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitle_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitle_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitle_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitle_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitle_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar text NOT NULL DEFAULT '';

ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS question_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS question_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS question_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS question_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_ar text NOT NULL DEFAULT '';

ALTER TABLE public.pricing
  ADD COLUMN IF NOT EXISTS service_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar text NOT NULL DEFAULT '';

ALTER TABLE public.we_build
  ADD COLUMN IF NOT EXISTS item_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS item_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS item_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS item_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS item_ar text NOT NULL DEFAULT '';

ALTER TABLE public.studio_content
  ADD COLUMN IF NOT EXISTS value_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_ar text NOT NULL DEFAULT '';

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS text_pt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS text_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS text_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS text_it text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS text_ar text NOT NULL DEFAULT '';
