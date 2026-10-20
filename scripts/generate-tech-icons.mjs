/**
 * Generates src/lib/tech-icons.ts from the simple-icons package.
 *
 * Why generate instead of hitting a CDN: cdn.simpleicons.org 404s for brands
 * that were removed over trademark policy (OpenAI, Adobe, Canva, Twilio, C#,
 * LlamaIndex), which is exactly why some tiles rendered a logo and others fell
 * back to initials. Bundling makes the set verifiable at build time — this
 * script THROWS if any slug is missing, so a broken tile can't reach the page.
 *
 * Run: node scripts/generate-tech-icons.mjs
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as si from "simple-icons";

/**
 * slug -> display name. Every slug here must exist in simple-icons.
 *
 * A slug may appear in more than one group (PostgreSQL is both a language and
 * a database); ICON_PATHS dedupes, TECH_GROUPS does not.
 *
 * Group ids are also i18n keys: each one needs a `stack.g.<id>` entry in
 * src/i18n/extra.ts for all seven languages, or the build fails on a missing
 * translation key.
 */
const TECHS = {
  languages: [
    ["typescript", "TypeScript"],
    ["javascript", "JavaScript"],
    ["python", "Python"],
    ["openjdk", "Java"],
    ["dotnet", ".NET / C#"],
    ["cplusplus", "C++"],
    ["php", "PHP"],
    ["go", "Go"],
    ["rust", "Rust"],
    ["kotlin", "Kotlin"],
    ["swift", "Swift"],
    ["dart", "Dart"],
    ["ruby", "Ruby"],
    ["r", "R"],
    ["gnubash", "Bash"],
    ["postgresql", "SQL"],
  ],
  frontend: [
    ["react", "React"],
    ["nextdotjs", "Next.js"],
    ["vuedotjs", "Vue"],
    ["svelte", "Svelte"],
    ["angular", "Angular"],
    ["astro", "Astro"],
    ["vite", "Vite"],
    ["tailwindcss", "Tailwind CSS"],
    ["shadcnui", "shadcn/ui"],
    ["radixui", "Radix UI"],
    ["framer", "Framer Motion"],
    ["threedotjs", "Three.js"],
    ["redux", "Redux"],
    ["reactquery", "React Query"],
    ["reacthookform", "React Hook Form"],
    ["sass", "Sass"],
    ["bootstrap", "Bootstrap"],
    ["storybook", "Storybook"],
  ],
  mobile: [
    ["expo", "Expo"],
    ["flutter", "Flutter"],
    ["ionic", "Ionic"],
    ["capacitor", "Capacitor"],
    ["swift", "Swift"],
    ["kotlin", "Kotlin"],
    ["androidstudio", "Android Studio"],
    ["xcode", "Xcode"],
    ["tauri", "Tauri"],
    ["electron", "Electron"],
  ],
  backend: [
    ["nodedotjs", "Node.js"],
    ["express", "Express"],
    ["nestjs", "NestJS"],
    ["springboot", "Spring Boot"],
    ["fastapi", "FastAPI"],
    ["django", "Django"],
    ["flask", "Flask"],
    ["laravel", "Laravel"],
    ["graphql", "GraphQL"],
    ["trpc", "tRPC"],
    ["deno", "Deno"],
    ["bun", "Bun"],
    ["socketdotio", "Socket.IO"],
    ["apachekafka", "Kafka"],
    ["rabbitmq", "RabbitMQ"],
    ["celery", "Celery"],
    ["jsonwebtokens", "JWT"],
    ["auth0", "Auth0"],
  ],
  data: [
    ["postgresql", "PostgreSQL"],
    ["mysql", "MySQL"],
    ["sqlite", "SQLite"],
    ["mongodb", "MongoDB"],
    ["redis", "Redis"],
    ["supabase", "Supabase"],
    ["firebase", "Firebase"],
    ["prisma", "Prisma"],
    ["drizzle", "Drizzle"],
    ["neo4j", "Neo4j"],
    ["elasticsearch", "Elasticsearch"],
    ["clickhouse", "ClickHouse"],
    ["duckdb", "DuckDB"],
    ["pandas", "pandas"],
    ["numpy", "NumPy"],
    ["apacheairflow", "Airflow"],
    ["googlebigquery", "BigQuery"],
    ["metabase", "Metabase"],
  ],
  ai: [
    ["anthropic", "Claude"],
    ["elevenlabs", "ElevenLabs"],
    ["suno", "Suno"],
    ["openrouter", "OpenRouter"],
    ["googlegemini", "Gemini"],
    ["mistralai", "Mistral"],
    ["perplexity", "Perplexity"],
    ["huggingface", "Hugging Face"],
    ["langchain", "LangChain"],
    ["ollama", "Ollama"],
    ["pytorch", "PyTorch"],
    ["tensorflow", "TensorFlow"],
    ["keras", "Keras"],
    ["scikitlearn", "scikit-learn"],
    ["opencv", "OpenCV"],
    ["jupyter", "Jupyter"],
    ["googlecolab", "Colab"],
    ["kaggle", "Kaggle"],
    ["replicate", "Replicate"],
  ],
  automation: [
    ["n8n", "n8n"],
    ["make", "Make"],
    ["zapier", "Zapier"],
    ["stripe", "Stripe"],
    ["mercadopago", "Mercado Pago"],
    ["paypal", "PayPal"],
    ["resend", "Resend"],
    ["mailchimp", "Mailchimp"],
    ["whatsapp", "WhatsApp"],
    ["telegram", "Telegram"],
    ["discord", "Discord"],
    ["googlesheets", "Google Sheets"],
    ["googlecalendar", "Google Calendar"],
    ["googledrive", "Google Drive"],
    ["airtable", "Airtable"],
    ["notion", "Notion"],
  ],
  cloud: [
    ["git", "Git"],
    ["github", "GitHub"],
    ["githubactions", "GitHub Actions"],
    ["docker", "Docker"],
    ["kubernetes", "Kubernetes"],
    ["linux", "Linux"],
    ["nginx", "Nginx"],
    ["vercel", "Vercel"],
    ["netlify", "Netlify"],
    ["cloudflare", "Cloudflare"],
    ["googlecloud", "Google Cloud"],
    ["digitalocean", "DigitalOcean"],
    ["railway", "Railway"],
    ["render", "Render"],
    ["terraform", "Terraform"],
    ["ansible", "Ansible"],
    ["grafana", "Grafana"],
    ["sentry", "Sentry"],
  ],
  quality: [
    ["jest", "Jest"],
    ["vitest", "Vitest"],
    ["cypress", "Cypress"],
    ["testinglibrary", "Testing Library"],
    ["selenium", "Selenium"],
    ["puppeteer", "Puppeteer"],
    ["k6", "k6"],
    ["pytest", "pytest"],
    ["postman", "Postman"],
    ["insomnia", "Insomnia"],
    ["swagger", "Swagger"],
    ["eslint", "ESLint"],
    ["prettier", "Prettier"],
    ["biome", "Biome"],
  ],
  design: [
    ["figma", "Figma"],
    ["blender", "Blender"],
    ["sketch", "Sketch"],
    ["webflow", "Webflow"],
    ["davinciresolve", "DaVinci Resolve"],
    ["wordpress", "WordPress"],
    ["shopify", "Shopify"],
    ["woocommerce", "WooCommerce"],
    ["strapi", "Strapi"],
    ["sanity", "Sanity"],
    ["contentful", "Contentful"],
    ["ghost", "Ghost"],
    ["googleanalytics", "Google Analytics"],
    ["posthog", "PostHog"],
  ],
};

/**
 * Tools with no redistributable mark.
 *
 * simple-icons ships 3,461 icons and none of these are among them: their
 * owners' trademark policies forbid redistributing the logo, so the icon was
 * removed or never accepted. No CDN can serve them and drawing a lookalike
 * would be the exact thing those policies prohibit.
 *
 * So they are listed as names instead. A deliberate typographic row is honest;
 * a tile with initials in a green box just looks like a broken image, which is
 * what the grid used to do.
 */
const WORDMARK_ONLY = [
  "OpenAI",
  "ChatGPT",
  "Canva",
  "CapCut",
  "Higgsfield",
  "Midjourney",
  "Runway",
  "Adobe CC",
  "Photoshop",
  "Premiere Pro",
  "After Effects",
  "Illustrator",
  "AWS",
  "Azure",
  "Slack",
  "Twilio",
  "SendGrid",
  "Playwright",
  "LlamaIndex",
  "Zoom",
];

function iconFor(slug) {
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = si[key];
  if (!icon) {
    throw new Error(
      `simple-icons has no "${slug}". Pick a slug that exists or drop the entry — ` +
        `a tech without an icon is what made the grid look half-broken.`,
    );
  }
  return icon;
}

const groups = [];
const seen = new Map();

for (const [group, list] of Object.entries(TECHS)) {
  const items = list.map(([slug, name]) => {
    const icon = iconFor(slug);
    if (!seen.has(slug)) seen.set(slug, icon);
    return { slug, name };
  });
  groups.push({ id: group, items });
}

const paths = Object.fromEntries([...seen].map(([slug, icon]) => [slug, icon.path]));

const out = `// GENERATED FILE — do not edit by hand.
// Source: scripts/generate-tech-icons.mjs  ·  simple-icons
//
// Icons are bundled, not fetched: the CDN 404s for brands removed over
// trademark policy, which is what left some tiles showing initials. The
// generator throws on an unknown slug, so every entry below is guaranteed
// to render a real logo.

/** SVG path data, 24x24 viewBox, currentColor fill. */
export const ICON_PATHS: Record<string, string> = ${JSON.stringify(paths, null, 2)};

export type TechGroupId = ${groups.map((g) => `"${g.id}"`).join(" | ")};

export type Tech = { slug: string; name: string };

export const TECH_GROUPS: { id: TechGroupId; items: Tech[] }[] = ${JSON.stringify(groups, null, 2)};

/**
 * Tools whose owners do not permit redistributing their mark, so they are
 * named rather than drawn. See the generator for the full reasoning.
 */
export const WORDMARK_ONLY: string[] = ${JSON.stringify(WORDMARK_ONLY, null, 2)};
`;

const target = new URL("../src/lib/tech-icons.ts", import.meta.url);
writeFileSync(target, out);

// Run the project formatter over the generated file so `npm run lint` stays
// green — otherwise every regeneration reintroduces hundreds of style errors.
try {
  execSync(`npx prettier --write "${fileURLToPath(target)}"`, { stdio: "ignore" });
} catch {
  console.warn("prettier not available; generated file left unformatted");
}
console.log(
  `generated src/lib/tech-icons.ts — ${groups.length} groups, ${seen.size} unique icons, ` +
    `0 missing, ${WORDMARK_ONLY.length} named-only`,
);
