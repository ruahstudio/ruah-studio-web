/**
 * Single source of truth for SEO metadata.
 *
 * `SITE_URL` drives the canonical, the hreflang alternates, og:url, the
 * sitemap and robots.txt. It used to be hard-coded to `ruahstudio.com`, a
 * domain the studio does not own — so every one of those told Google that the
 * real version of this site lived somewhere else. That is the kind of mistake
 * that costs rankings silently.
 *
 * It now comes from `VITE_SITE_URL`, so moving to the real domain is a
 * Cloudflare variable, not a code change. The fallback is the address the
 * site actually answers on today.
 *
 * Set it in Cloudflare Pages → Settings → Environment variables:
 *     VITE_SITE_URL = https://weareruahstudio.com
 * and run `npm run build` (prebuild rewrites sitemap.xml and robots.txt).
 */
const CONFIGURED =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SITE_URL"]) ||
  (typeof process !== "undefined" && process.env?.["SITE_URL"]) ||
  "";

/** No trailing slash, ever: every URL below appends its own path. */
export const SITE_URL = (CONFIGURED || "https://ruah-studio-web.pages.dev").replace(/\/+$/, "");

/** Absolute URL for a path, which is what canonical and og:url require. */
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "Ruah Studio";

export const SITE_TITLE = "Ruah Studio — AI, Software & Digital Systems";

export const SITE_DESCRIPTION =
  "We build the systems businesses run on: dashboards, internal tools, AI workflows, automation and custom web products. Direct work with the engineer who builds them.";

/**
 * Social preview card, 1200×630.
 *
 * This pointed at `/favicon.png` — 64×64 — so every time the link was shared
 * on WhatsApp or LinkedIn the preview came out as a blurry thumbnail. For a
 * site whose job is to be sent to prospective clients, that is the first
 * impression.
 */
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Organization + service structured data. Deliberately conservative: no
 * invented ratings, review counts, awards or client names — fabricated
 * structured data is a manual-action risk, not just bad taste.
 */
export function structuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    slogan: "From idea to working product.",
    knowsAbout: [
      "Software Development",
      "Artificial Intelligence",
      "Business Automation",
      "Web Application Development",
      "Dashboard Development",
      "MVP Development",
    ],
    areaServed: { "@type": "Place", name: "Worldwide" },
    availableLanguage: ["en", "es", "pt", "fr", "de", "it", "ar"],
  };
}
