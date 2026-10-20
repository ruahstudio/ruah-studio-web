/**
 * Single source of truth for SEO metadata.
 * CHANGE `SITE_URL` to the production domain before deploying — canonical,
 * hreflang and og:url all derive from it, and a wrong value here silently
 * breaks all three.
 */
export const SITE_URL = "https://ruahstudio.com";

export const SITE_NAME = "Ruah Studio";

export const SITE_TITLE = "Ruah Studio — AI, Software & Digital Systems";

export const SITE_DESCRIPTION =
  "We build the systems businesses run on: dashboards, internal tools, AI workflows, automation and custom web products. Direct work with the engineer who builds them.";

/** Social preview image. Replace with a real 1200×630 asset when available. */
export const OG_IMAGE = `${SITE_URL}/favicon.png`;

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
