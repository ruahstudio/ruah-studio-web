/**
 * The page a visitor sees when the server itself fails.
 *
 * It was hard-coded English, which meant the one moment the site is already
 * failing someone was also the one moment it stopped speaking their language.
 *
 * The strings live here rather than coming from `@/i18n` on purpose: this
 * runs on the error path, after something has already gone wrong, and it must
 * not depend on a module that could be part of what broke. Twenty-eight
 * strings duplicated is a fair price for a page that cannot fail.
 *
 * Language is read from the request — `?lang=` first, then `Accept-Language`
 * — which mirrors what `detectLang()` does in the browser, minus the stored
 * preference the server cannot see.
 */

const LANGS = ["en", "es", "pt", "fr", "de", "it", "ar"] as const;
type Lang = (typeof LANGS)[number];

type Copy = { title: string; body: string; retry: string; home: string };

const COPY: Record<Lang, Copy> = {
  en: {
    title: "This page didn't load",
    body: "Something went wrong on our end. You can try refreshing, or head back home.",
    retry: "Try again",
    home: "Go home",
  },
  es: {
    title: "Esta página no cargó",
    body: "Algo falló de nuestro lado. Puedes recargar o volver al inicio.",
    retry: "Reintentar",
    home: "Ir al inicio",
  },
  pt: {
    title: "Esta página não carregou",
    body: "Algo falhou do nosso lado. Você pode recarregar ou voltar ao início.",
    retry: "Tentar de novo",
    home: "Ir para o início",
  },
  fr: {
    title: "Cette page n'a pas pu se charger",
    body: "Quelque chose a échoué de notre côté. Rechargez la page ou revenez à l'accueil.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
  de: {
    title: "Diese Seite konnte nicht geladen werden",
    body: "Auf unserer Seite ist etwas schiefgelaufen. Laden Sie neu oder kehren Sie zur Startseite zurück.",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
  },
  it: {
    title: "Questa pagina non si è caricata",
    body: "Qualcosa è andato storto da parte nostra. Puoi ricaricare o tornare alla home.",
    retry: "Riprova",
    home: "Torna alla home",
  },
  ar: {
    title: "تعذّر تحميل هذه الصفحة",
    body: "حدث خطأ من جانبنا. يمكنك إعادة التحميل أو العودة إلى الصفحة الرئيسية.",
    retry: "أعد المحاولة",
    home: "العودة إلى الرئيسية",
  },
};

function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** `?lang=` wins, then the browser's own preference order. */
function detectLang(request?: Request): Lang {
  if (!request) return "en";
  try {
    const param = new URL(request.url).searchParams.get("lang");
    if (param && isLang(param)) return param;
  } catch {
    /* malformed URL */
  }
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const base = part.trim().split(";")[0]?.split("-")[0]?.toLowerCase() ?? "";
    if (isLang(base)) return base;
  }
  return "en";
}

/** Minimal escaping — the copy above is ours, but never interpolate blindly. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderErrorPage(request?: Request): string {
  const lang = detectLang(request);
  const t = COPY[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(t.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      :root { color-scheme: light dark; }
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fbfaf8; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .mark { width: 2.5rem; height: 2.5rem; border-radius: 0.7rem; background: #7eff07; color: #011536; font-weight: 700; display: grid; place-items: center; margin: 0 auto 1.25rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      @media (prefers-color-scheme: dark) {
        body { background: #090e12; color: #f2f4f7; }
        p { color: #9aa4b2; }
        .primary { background: #7eff07; color: #011536; }
        .secondary { background: transparent; color: #f2f4f7; border-color: #2a323c; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="mark" aria-hidden="true">R</div>
      <h1>${escapeHtml(t.title)}</h1>
      <p>${escapeHtml(t.body)}</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">${escapeHtml(t.retry)}</button>
        <a class="secondary" href="/">${escapeHtml(t.home)}</a>
      </div>
    </div>
  </body>
</html>`;
}
