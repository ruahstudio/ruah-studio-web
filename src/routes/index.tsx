import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Github, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { SystemBuilder } from "@/components/SystemBuilder";
import { About } from "@/components/About";
import { Reveal } from "@/components/Reveal";
import type { ExtraKey } from "@/i18n/extra";
import { Testimonials } from "@/components/Testimonials";
import { SITE } from "@/lib/content";
import {
  STUDIO_DEFAULTS,
  useFaqs,
  usePricing,
  useProjects,
  useStudio,
  useWeBuild,
} from "@/lib/cms";
import { useTranslation } from "@/i18n";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/site/Hero";
import { Capabilities } from "@/components/site/Capabilities";
import { TechStack } from "@/components/site/TechStack";
import { WhatsAppChat } from "@/components/site/WhatsAppChat";
import { WorkGrid } from "@/components/site/WorkGrid";
import { ProcessTimeline } from "@/components/site/ProcessTimeline";
import { Faq } from "@/components/site/Faq";
import { Pricing } from "@/components/site/Pricing";
import { ValueStack } from "@/components/site/ValueStack";
import {
  ContactForm,
  EMPTY_FORM,
  type ContactForm as ContactFormState,
} from "@/components/site/ContactForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE.seo.title },
      { name: "description", content: SITE.seo.description },
      { property: "og:title", content: SITE.seo.title },
      { property: "og:description", content: SITE.seo.description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE.seo.title },
      { name: "twitter:description", content: SITE.seo.description },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.name,
          description: SITE.seo.description,
          email: SITE.email,
          founder: { "@type": "Person", name: SITE.founder },
        }),
      },
    ],
  }),
  component: Index,
});

/** Uses the translated text unless the admin customized the value. */
function cmsOr(t: (key: string) => string, key: string, translated: string) {
  const value = t(key);
  return value && value !== STUDIO_DEFAULTS[key] ? value : translated;
}

function Index() {
  const { t } = useStudio();
  const { tr, lang } = useTranslation();
  // Hero copy is translated by default; admin overrides still win.
  // Admin edits win; untouched defaults get translated.
  const heroEyebrow = cmsOr(t, "hero_eyebrow", tr("hero.eyebrow"));
  const heroTitleText = cmsOr(t, "hero_title", tr("hero.title"));
  const heroSubtitle = cmsOr(t, "hero_subtitle", tr("hero.subtitle"));
  const { data: projects } = useProjects();
  const { data: faqs } = useFaqs();
  const { data: pricing } = usePricing();
  const { data: weBuild } = useWeBuild();
  const PILLARS = [1, 2, 3].map((n) => ({
    num: `0${n}`,
    title: t(`pillar_${n}_title`),
    body: t(`pillar_${n}_body`),
  }));
  const whatsapp = t("whatsapp") || SITE.whatsapp;
  const siteName = t("site_name") || SITE.name;
  const email = t("email") || SITE.email;
  const [form, setForm] = useState<ContactFormState>({ ...EMPTY_FORM });
  const needRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = tr("meta.title");
    const set = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };
    set('meta[name="description"]', tr("meta.description"));
    set('meta[property="og:title"]', tr("meta.title"));
    set('meta[property="og:description"]', tr("meta.description"));
    set('meta[name="twitter:title"]', tr("meta.title"));
    set('meta[name="twitter:description"]', tr("meta.description"));
  }, [lang, tr]);

  function goToForm(prefill?: string) {
    if (prefill) setForm((f) => ({ ...f, need: prefill }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => needRef.current?.focus(), 600);
  }

  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    `${siteName} — ${tr("wa.hello")}`,
  )}`;

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <Navbar waHref={waHref} onStart={() => goToForm()} />
      <WhatsAppChat whatsapp={whatsapp} siteName={siteName} />

      {/* Skip-link landmark */}
      <div id="main" tabIndex={-1} />

      {/* HERO */}
      <Hero
        eyebrow={heroEyebrow}
        title={heroTitleText}
        subtitle={heroSubtitle}
        onStart={() => goToForm()}
      />

      {/* CAPABILITIES — answers "what do you do" once */}
      <Capabilities items={weBuild ?? []} pillars={PILLARS} />

      {/* WORK */}
      <WorkGrid
        projects={projects ?? []}
        eyebrow={tr("work.eyebrow")}
        title={tr("work.title")}
        body={tr("work.body")}
        onPrefill={goToForm}
      />

      {/* ABOUT — the founder, before the stack. In a one-person studio the
          person is the differentiator, and the landing page had never once
          shown him. */}
      <About />

      {/* STACK */}
      <TechStack />

      {/* BUILDER */}
      <section id="builder" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-24">
          <p className="label-mono">{tr("builder.eyebrow")}</p>
          <h2 className="display-lg mt-4 max-w-[22ch]">{tr("builder.sectionTitle")}</h2>
          <div className="mt-12">
            <SystemBuilder />
          </div>
          <Reveal delay={100} className="mt-12">
            <p className="label-mono">{tr("included.title")}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-xl border border-border bg-card px-5 py-4 text-sm transition-colors hover:border-signal/40"
                >
                  {tr(`included.${n}` as ExtraKey)}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <ValueStack onStart={() => goToForm()} />

      <Pricing tiers={pricing ?? []} onSelect={goToForm} />

      {/* PROCESS */}
      <ProcessTimeline />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* FAQ */}
      <Faq faqs={faqs ?? []} />

      {/* CONTACT */}
      <section id="contact" className="relative overflow-hidden scroll-mt-20">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="label-mono">{tr("contact.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
              {t("form_title")}
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              {t("form_subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { icon: Github, label: "GitHub", href: t("url_github") },
                { icon: Linkedin, label: "LinkedIn", href: t("url_linkedin") },
                { icon: Instagram, label: "Instagram", href: t("url_instagram") },
                { icon: MessageCircle, label: "WhatsApp", href: waHref },
                { icon: Mail, label: "Email", href: `mailto:${email}` },
              ]
                // Hide unconfigured profiles instead of linking to a
                // platform homepage.
                .filter((s) => Boolean(s.href))
                .map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground"
                  >
                    <s.icon className="size-4" aria-hidden /> {s.label}
                  </a>
                ))}
            </div>
          </div>

          <ContactForm
            form={form}
            setForm={setForm}
            whatsapp={whatsapp}
            siteName={siteName}
            needRef={needRef}
          />
        </div>
      </section>

      <SiteFooter siteName={siteName} />
    </div>
  );
}
