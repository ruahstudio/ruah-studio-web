/**
 * Ruah Studio — single source of truth for all site copy.
 * Edit text here; components only render.
 */
import type { AnyKey } from "@/i18n";

export type Pillar = { num: string; title: string; body: string };
/**
 * Static content below stores TRANSLATION KEYS, not finished text, for
 * anything the visitor reads as a sentence. Product names, stack names and
 * numbers stay literal — they are the same in every language.
 *
 * These are the fallbacks used when Supabase has no rows, which is the normal
 * state today. Before this they were a fixed mix of English and Spanish, so a
 * visitor reading the site in German got German chrome around English pricing
 * copy and Spanish bullet points.
 */
export type WeBuildItem = {
  /** Stable lookup key for capabilities.ts — must NOT change with language. */
  capKey: string;
  labelKey: AnyKey;
};
export type Project = {
  num: string;
  name: string;
  kindKey: AnyKey;
  descriptionKey: AnyKey;
  stack: string[];
  /** Pre-filled into the contact form when the user clicks the project CTA. */
  prefillKey: AnyKey;
};
export type PricingCard = {
  titleKey: AnyKey;
  /** Literal amount; the word before it is translated separately. */
  fromAmount: string;
  bodyKey: AnyKey;
  bulletKeys: AnyKey[];
};
export type FaqItem = { q: string; a: string };
export type Testimonial = { name: string; business: string; quote: string; avatar: string };
export type SelectOption = { value: string; label: string };

export const SITE = {
  name: "Ruah Studio",
  tagline: "AI • Software • Automation • Digital Systems",
  whatsapp: "584222010041",
  email: "hola@ruahstudio.com",
  founder: "John Salazar",
  seo: {
    title: "Ruah Studio — From idea to working product.",
    description:
      "AI-powered software, automation and digital systems built around your business. AI assistants, dashboards, CRMs, web apps and MVPs.",
  },
} as const;

export const HERO = {
  eyebrow: "AI • Software • Automation • Digital Systems",
  title: "From idea to working product.",
  subtitle: "AI-powered software, automation and digital systems built around your business.",
  primaryCta: "START A PROJECT →",
  secondaryCta: "Ver proyectos",
} as const;

export const PILLARS: Pillar[] = [
  {
    num: "01",
    title: "INTELLIGENCE",
    body: "AI assistants, automation, content systems, analysis, agents.",
  },
  {
    num: "02",
    title: "SYSTEMS",
    body: "Dashboards, CRMs, internal tools, business software.",
  },
  {
    num: "03",
    title: "EXPERIENCE",
    body: "Web apps, landing pages, UI/UX, digital products, branding.",
  },
];

export const WE_BUILD: WeBuildItem[] = [
  { capKey: "aiassistants", labelKey: "we.aiAssistants" },
  { capKey: "aiautomation", labelKey: "we.aiAutomation" },
  { capKey: "businessdashboards", labelKey: "we.dashboards" },
  { capKey: "crms", labelKey: "we.crms" },
  { capKey: "interactivecalculators", labelKey: "we.calculators" },
  { capKey: "internaltools", labelKey: "we.internalTools" },
  { capKey: "landingpages", labelKey: "we.landing" },
  { capKey: "webapplications", labelKey: "we.webApps" },
  { capKey: "mvps", labelKey: "we.mvps" },
  { capKey: "creatorplatforms", labelKey: "we.creator" },
  { capKey: "customsoftware", labelKey: "we.customSoftware" },
];

export const PROJECTS: Project[] = [
  {
    num: "01",
    name: "Nexo Criminal",
    kindKey: "proj.p1.kind",
    descriptionKey: "proj.p1.body",
    stack: ["Java", "Spring Boot", "React", "TypeScript", "PostgreSQL", "PostGIS"],
    prefillKey: "proj.p1.prefill",
  },
  {
    num: "02",
    name: "Business Management & Accounting System",
    kindKey: "proj.p2.kind",
    descriptionKey: "proj.p2.body",
    stack: ["FastAPI", "Python", "React", "PostgreSQL"],
    prefillKey: "proj.p2.prefill",
  },
  {
    num: "03",
    name: "Video Creation & Editing Platform",
    kindKey: "proj.p3.kind",
    descriptionKey: "proj.p3.body",
    stack: ["Next.js", "Supabase", "AI APIs"],
    prefillKey: "proj.p3.prefill",
  },
  {
    num: "04",
    name: "Interactive Calculator Suite",
    kindKey: "proj.p4.kind",
    descriptionKey: "proj.p4.body",
    stack: ["React", "TypeScript"],
    prefillKey: "proj.p4.prefill",
  },
  {
    num: "05",
    name: "VitalCare",
    kindKey: "proj.p5.kind",
    descriptionKey: "proj.p5.body",
    stack: ["Embedded Systems", "IoT", "Medical Sensors", "ESP32", "MQTT"],
    prefillKey: "proj.p5.prefill",
  },
];

export const PRICING: PricingCard[] = [
  {
    titleKey: "price.t1.title",
    fromAmount: "$100",
    bodyKey: "price.t1.body",
    bulletKeys: ["price.t1.b1", "price.t1.b2", "price.t1.b3"],
  },
  {
    titleKey: "price.t2.title",
    fromAmount: "$200",
    bodyKey: "price.t2.body",
    bulletKeys: ["price.t2.b1", "price.t2.b2", "price.t2.b3"],
  },
  {
    titleKey: "price.t3.title",
    fromAmount: "$350",
    bodyKey: "price.t3.body",
    bulletKeys: ["price.t3.b1", "price.t3.b2", "price.t3.b3"],
  },
];

export const FAQ: FaqItem[] = [
  {
    q: "¿Trabajan con negocios pequeños o solo con empresas grandes?",
    a: "Trabajamos con negocios de cualquier tamaño. Lo que importa es el problema, no el tamaño de la empresa.",
  },
  {
    q: "¿Cuánto tarda un proyecto típico?",
    a: "Depende de la complejidad. Una herramienta sencilla puede estar lista en pocos días, mientras que sistemas y productos personalizados requieren más planificación. Antes de comenzar definimos alcance, entregables y timeline.",
  },
  {
    q: "¿Y si no sé exactamente qué necesito?",
    a: "No necesitas tener la solución definida. Cuéntanos qué quieres mejorar, qué problema estás intentando resolver o qué quieres construir. Analizamos el problema y te recomendamos el camino más adecuado.",
  },
  {
    q: "¿Pueden trabajar sobre una idea que todavía no está completamente definida?",
    a: "Sí. Muchas veces el proyecto comienza precisamente ahí. Partimos del problema, definimos la solución, construimos un prototipo y evolucionamos hacia un producto funcional.",
  },
  {
    q: "¿Trabajan de forma remota, con clientes fuera del país?",
    a: "Sí. Trabajamos con clientes en cualquier país, de forma completamente remota.",
  },
];

/** Testimonials are hidden until there is real, verifiable social proof. */
export const showTestimonials = false;

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "María Rivas",
    business: "Clínica Dental Rivas",
    quote:
      "Pasamos de agendar por WhatsApp a un sistema que organiza pacientes y recordatorios solo.",
    avatar: "MR",
  },
  {
    name: "Andrés Peña",
    business: "Peña Logística",
    quote:
      "El dashboard nos dio visibilidad real de la operación. Dejamos de trabajar con hojas de cálculo.",
    avatar: "AP",
  },
  {
    name: "Laura Gómez",
    business: "Estudio Creativo LG",
    quote:
      "La calculadora interactiva se volvió nuestra principal fuente de solicitudes de presupuesto.",
    avatar: "LG",
  },
];

export const FORM = {
  title: "Have an idea? Let's build it.",
  subtitle: "Tell us what you're trying to build, improve or automate.",
  submit: "START A PROJECT →",
  needPlaceholder:
    "Website, AI, automation, dashboard, calculator, CRM, MVP, internal tool, redesign, other...",
} as const;

export const GOALS: SelectOption[] = [
  { value: "Get more clients", label: "Get more clients" },
  { value: "Automate repetitive work", label: "Automate repetitive work" },
  { value: "Build a new product", label: "Build a new product" },
  { value: "Improve my website", label: "Improve my website" },
  { value: "Improve my brand", label: "Improve my brand" },
  { value: "Organize my business", label: "Organize my business" },
  { value: "Use AI in my business", label: "Use AI in my business" },
  { value: "Other", label: "Other" },
];

export const BUDGETS: SelectOption[] = [
  { value: "<$100", label: "<$100" },
  { value: "$100–300", label: "$100–300" },
  { value: "$300–600", label: "$300–600" },
  { value: "$600–1,000", label: "$600–1,000" },
  { value: "$1,000+", label: "$1,000+" },
];

export const NEXT_STEPS = [
  { step: "01", name: "Diagnóstico", body: "Entendemos el problema real y el resultado esperado." },
  { step: "02", name: "Propuesta", body: "Alcance, entregables, timeline y precio cerrado." },
  { step: "03", name: "Construcción", body: "Build en ciclos cortos con demos revisables." },
  { step: "04", name: "Lanzamiento", body: "Despliegue, documentación y plan de evolución." },
];
