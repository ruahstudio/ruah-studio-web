import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type AnyKey, type Lang } from "@/i18n";
import { PRICING, SITE, WE_BUILD } from "@/lib/content";

/**
 * Resolves a localized column.
 *
 * Previously this only understood Spanish: every other language silently got
 * the English base column, so pt/fr/de/it/ar looked "untranslated" even though
 * the interface strings had switched. Now any `<field>_<lang>` column is used
 * when present, falling back to the base column.
 */
function pick<T extends Record<string, unknown>>(row: T, field: string, lang: Lang): string {
  const base = (row[field] as string | undefined) ?? "";
  if (lang === "en") return base;
  const localized = (row[`${field}_${lang}`] as string | undefined) ?? "";
  return localized.trim() ? localized : base;
}

export type DbProject = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  stack: string[];
  link: string;
  image_url: string;
  prefill: string;
  order: number;
};

export type DbFaq = { id: string; question: string; answer: string; order: number };

export type DbPricing = {
  id: string;
  service: string;
  price_from: string;
  description: string;
  bullets: string[];
  order: number;
};

export type DbWeBuild = {
  id: string;
  item: string;
  order: number;
  /**
   * Language-independent key for capabilities.ts. Static rows carry it;
   * Supabase rows don't, and fall back to normalising the label.
   *
   * Without this, translating the labels silently broke pillar grouping:
   * capabilityKey("Asistentes de IA") is not "aiassistants", so every
   * capability fell through to the PRODUCT default and piled into pillar 03.
   */
  capKey?: string;
};

export type DbTestimonial = {
  id: string;
  name: string;
  business: string;
  text: string;
  avatar_url: string;
  published: boolean;
  order: number;
};

export const STUDIO_DEFAULTS: Record<string, string> = {
  site_name: "Ruah Studio",
  hero_eyebrow: "AI • Software • Automation • Digital Systems",
  hero_title: "From idea to working product.",
  hero_subtitle: "AI-powered software, automation and digital systems built around your business.",
  pillar_1_title: "INTELLIGENCE",
  pillar_1_body: "AI assistants, automation, content systems, analysis, agents.",
  pillar_2_title: "SYSTEMS",
  pillar_2_body: "Dashboards, CRMs, internal tools, business software.",
  pillar_3_title: "EXPERIENCE",
  pillar_3_body: "Web apps, landing pages, UI/UX, digital products, branding.",
  form_title: "Have an idea? Let's build it.",
  form_subtitle: "Tell us what you're trying to build, improve or automate.",
  whatsapp: "584222010041",
  email: SITE.email,
  founder: "John Salazar",
  photo_url: "",
  // Social profiles. Empty means the link is hidden rather than pointing at
  // a platform homepage — a dead placeholder link costs more than no link.
  url_github: "",
  url_linkedin: "",
  url_instagram: "",
};

/**
 * Studio fields whose value is a sentence the visitor reads, mapped to their
 * translation key. STUDIO_DEFAULTS is English-only, so without this the
 * pillars and the contact heading stayed English in all seven languages —
 * they were the CMS defaults, never routed through the dictionary.
 *
 * Fields absent here (whatsapp, email, founder, URLs) are the same in every
 * language and keep their literal default.
 */
const STUDIO_I18N: Record<string, AnyKey> = {
  hero_eyebrow: "hero.eyebrow",
  hero_title: "hero.title",
  hero_subtitle: "hero.subtitle",
  pillar_1_title: "studio.pillar1.title",
  pillar_1_body: "studio.pillar1.body",
  pillar_2_title: "studio.pillar2.title",
  pillar_2_body: "studio.pillar2.body",
  pillar_3_title: "studio.pillar3.title",
  pillar_3_body: "studio.pillar3.body",
  form_title: "studio.formTitle",
  form_subtitle: "studio.formSubtitle",
};

/**
 * `i18n` marks the fields the visitor reads as a sentence, which therefore
 * have a column per language. The rest — a phone number, an email, a URL —
 * are the same in every language and are stored once.
 */
export const STUDIO_FIELDS: {
  key: string;
  label: string;
  multiline?: boolean;
  i18n?: boolean;
}[] = [
  { key: "site_name", label: "Nombre del estudio" },
  { key: "hero_eyebrow", label: "Eyebrow del hero", i18n: true },
  { key: "hero_title", label: "Título del hero", i18n: true },
  { key: "hero_subtitle", label: "Subtítulo del hero", multiline: true, i18n: true },
  { key: "pillar_1_title", label: "Pilar 01 — título", i18n: true },
  { key: "pillar_1_body", label: "Pilar 01 — texto", multiline: true, i18n: true },
  { key: "pillar_2_title", label: "Pilar 02 — título", i18n: true },
  { key: "pillar_2_body", label: "Pilar 02 — texto", multiline: true, i18n: true },
  { key: "pillar_3_title", label: "Pilar 03 — título", i18n: true },
  { key: "pillar_3_body", label: "Pilar 03 — texto", multiline: true, i18n: true },
  { key: "form_title", label: "Título del formulario", i18n: true },
  { key: "form_subtitle", label: "Subtítulo del formulario", multiline: true, i18n: true },
  { key: "whatsapp", label: "WhatsApp (solo números)" },
  { key: "email", label: "Email de contacto" },
  { key: "founder", label: "Fundador" },
  { key: "photo_url", label: "Foto del fundador (URL)" },
  { key: "url_github", label: "GitHub (URL completa)" },
  { key: "url_linkedin", label: "LinkedIn (URL completa)" },
  { key: "url_instagram", label: "Instagram (URL completa)" },
];

/** The site's languages. English is the base column; the rest carry a suffix. */
export const CONTENT_LANGS = [
  { code: "en", label: "EN", suffix: "" },
  { code: "es", label: "ES", suffix: "_es" },
  { code: "pt", label: "PT", suffix: "_pt" },
  { code: "fr", label: "FR", suffix: "_fr" },
  { code: "de", label: "DE", suffix: "_de" },
  { code: "it", label: "IT", suffix: "_it" },
  { code: "ar", label: "AR", suffix: "_ar" },
] as const;

/**
 * Without Supabase configured (or with empty tables) every content section
 * rendered blank — the site looked half-built. These adapters let the static
 * content in content.ts stand in, so the page is always complete and the CMS
 * simply overrides it when it has rows.
 */
type Tr = (key: AnyKey) => string;

/**
 * Default questions, used until the admin writes its own.
 *
 * They exist for two reasons: an empty FAQ hid the whole section, which made
 * the header's FAQ link a dead end, and these are questions John answers over
 * and over in WhatsApp anyway. Every answer is factual — nothing here claims
 * a client, a metric or a guarantee.
 */
function fallbackFaqs(tr: Tr): DbFaq[] {
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    id: `static-faq-${n}`,
    question: tr(`faq.q${n}` as AnyKey),
    answer: tr(`faq.a${n}` as AnyKey),
    order: n,
  }));
}

function fallbackPricing(tr: Tr): DbPricing[] {
  return PRICING.map((c, i) => ({
    id: `static-${i}`,
    service: tr(c.titleKey),
    // "from $100" / "desde $100" / "ab $100" — the amount never changes.
    price_from: `${tr("price.from")} ${c.fromAmount}`,
    description: tr(c.bodyKey),
    bullets: c.bulletKeys.map(tr),
    order: i,
  }));
}

function fallbackWeBuild(tr: Tr): DbWeBuild[] {
  return WE_BUILD.map((w, i) => ({
    id: `static-${i}`,
    item: tr(w.labelKey),
    capKey: w.capKey,
    order: i,
  }));
}

export function useProjects() {
  const { lang } = useTranslation();
  return useQuery({
    placeholderData: (prev) => prev,
    queryKey: ["cms", "projects", lang],
    // Empty on the server: the grid renders its "being organised" state
    // instead of popping in a moment later.
    initialData: () => [] as DbProject[],
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("order");
      // No rows means no published work yet — the section says so itself
      // rather than inventing placeholder projects.
      if (error || !data) return [] as DbProject[];
      return data.map((row) => ({
        ...row,
        title: pick(row, "title", lang),
        subtitle: pick(row, "subtitle", lang),
        description: pick(row, "description", lang),
      })) as DbProject[];
    },
  });
}

export function useFaqs() {
  const { lang, tr } = useTranslation();
  return useQuery({
    placeholderData: (prev) => prev,
    queryKey: ["cms", "faqs", lang],
    // Rendered on the server too, so /#faq has a target the moment the page
    // loads instead of only after the query resolves in the browser.
    initialData: () => fallbackFaqs(tr),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").order("order");
      if (error || !data || data.length === 0) return fallbackFaqs(tr);
      return (data ?? []).map((row) => ({
        ...row,
        question: pick(row, "question", lang),
        answer: pick(row, "answer", lang),
      })) as DbFaq[];
    },
  });
}

export function usePricing() {
  const { lang, tr } = useTranslation();
  return useQuery({
    placeholderData: (prev) => prev,
    queryKey: ["cms", "pricing", lang],
    // Same reason as the FAQ: /#pricing has to exist in the server HTML.
    initialData: () => fallbackPricing(tr),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing").select("*").order("order");
      if (error || !data || data.length === 0) return fallbackPricing(tr);
      return data.map((row) => ({
        ...row,
        service: pick(row, "service", lang),
        description: pick(row, "description", lang),
      })) as DbPricing[];
    },
  });
}

export function useWeBuild() {
  const { lang, tr } = useTranslation();
  return useQuery({
    placeholderData: (prev) => prev,
    queryKey: ["cms", "we_build", lang],
    // #we-build points at these rows, so they ship with the server HTML.
    initialData: () => fallbackWeBuild(tr),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("we_build").select("*").order("order");
      if (error || !data || data.length === 0) return fallbackWeBuild(tr);
      return data.map((row) => ({ ...row, item: pick(row, "item", lang) })) as DbWeBuild[];
    },
  });
}

export function useTestimonials() {
  const { lang, tr } = useTranslation();
  return useQuery({
    placeholderData: (prev) => prev,
    queryKey: ["cms", "testimonials", lang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("order");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        text: pick(row, "text", lang),
      })) as DbTestimonial[];
    },
  });
}

export function useStudio() {
  const { lang, tr } = useTranslation();
  const query = useQuery({
    queryKey: ["cms", "studio_content", lang],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_content").select("*");
      if (error) throw error;
      const map: Record<string, string> = { ...STUDIO_DEFAULTS };
      for (const row of data ?? []) {
        // studio_content keeps per-language columns too; fall back to base.
        const localized = (row as Record<string, string | null>)[`value_${lang}`];
        const value = lang !== "en" && localized?.trim() ? localized : row.value;
        if (value) map[row.key] = value;
      }
      return map;
    },
  });
  // A CMS row always wins. Otherwise use the translated default when the
  // field has one, and only then the literal English default.
  const t = (key: string) => {
    const row = query.data?.[key];
    if (row && row !== STUDIO_DEFAULTS[key]) return row;
    const k = STUDIO_I18N[key];
    if (k) return tr(k);
    return row ?? STUDIO_DEFAULTS[key] ?? "";
  };
  return { t, studio: query.data ?? STUDIO_DEFAULTS };
}

export function waLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Uploads to the private site-images bucket and returns a long-lived signed URL. */
export async function uploadSiteImage(file: File, folder: string) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("site-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signError) throw signError;
  return data.signedUrl;
}
