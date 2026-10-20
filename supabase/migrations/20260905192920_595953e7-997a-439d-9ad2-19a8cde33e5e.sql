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