/**
 * Writes public/sitemap.xml and public/robots.txt from the configured domain.
 *
 * Both files used to carry `https://ruahstudio.com` typed by hand, a domain
 * the studio does not own. A static file cannot read an environment variable,
 * so the only way to keep them honest is to generate them at build time from
 * the same value the app uses.
 *
 * Runs automatically on `npm run build` (see the `prebuild` script). To move
 * to the real domain, set VITE_SITE_URL in Cloudflare and rebuild — nothing
 * here needs editing.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, "../public");

const SITE_URL = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  "https://ruah-studio-web.pages.dev"
).replace(/\/+$/, "");

/** Every language the site serves, for the hreflang alternates. */
const LANGS = ["en", "es", "pt", "fr", "de", "it", "ar"];

/** Public routes worth indexing. /work/:slug is added once there are cases. */
const ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
];

const alternates = (path) =>
  [
    ...LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${path}?lang=${l}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}"/>`,
  ].join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${ROUTES.map(
  (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
${alternates(r.path)}
  </url>`,
).join("\n")}
</urlset>
`;

const robots = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

# Admin is auth-gated; keep it out of the index
Disallow: /admin
Disallow: /auth

Sitemap: ${SITE_URL}/sitemap.xml
`;

writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(resolve(publicDir, "robots.txt"), robots, "utf8");

console.log(`SEO files written for ${SITE_URL}`);
