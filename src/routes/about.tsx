import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import portraitLocal from "@/assets/portrait.jpg";
import signature from "@/assets/signature.png";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TrackRecord } from "@/components/site/TrackRecord";
import { useStudio, waLink } from "@/lib/cms";
import { useTranslation } from "@/i18n";
import { aboutCopy } from "@/lib/about-content";
import { SITE } from "@/lib/content";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  const { t } = useStudio();
  const { tr, dir, lang } = useTranslation();
  const navigate = useNavigate();
  const copy = aboutCopy(lang);
  const reduced = useReducedMotion();
  const whatsapp = t("whatsapp") || SITE.whatsapp;
  const photo = t("photo_url") || portraitLocal;
  const founder = t("founder") || "John Salazar";

  return (
    <>
      <Navbar
        waHref={waLink(whatsapp, tr("chat.waIntro"))}
        // Router navigation, not window.location — a full reload here threw
        // away the in-memory app state for no reason.
        onStart={() => void navigate({ to: "/", hash: "contact" })}
      />

      <main id="main">
        {/* EDITORIAL HERO — deliberately unlike the landing's hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-32 sm:px-6 md:pb-24 md:pt-44">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="label-mono"
            >
              {tr("about.eyebrow")}
            </motion.p>

            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.85, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="display-xl mt-6 max-w-[14ch]"
            >
              {copy.heroLine}
              <br />
              <span className="text-signal">{copy.heroAccent}</span>
            </motion.h1>

            <div className="mt-12 grid gap-10 md:grid-cols-12 md:items-end">
              <p className="lede md:col-span-6 md:col-start-6">{copy.lede}</p>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
              {copy.roles.map((r, i) => (
                <span key={r} className="font-mono text-xs text-muted-foreground">
                  {r}
                  {i < copy.roles.length - 1 && <span className="ms-6 text-signal/40">/</span>}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PORTRAIT + STORY */}
        <section className="border-b border-border">
          <div
            className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-16"
            style={{ paddingBlock: "var(--section-y)" }}
          >
            <figure className="md:col-span-5">
              <div className="photo-grain relative aspect-[4/5] overflow-hidden border border-border bg-surface">
                <img
                  src={photo}
                  alt={founder}
                  loading="lazy"
                  className="size-full object-cover object-top grayscale transition-all duration-[1200ms] hover:grayscale-0"
                  style={{ transitionTimingFunction: "var(--ease-out)" }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <div>
                    <p className="label-mono text-[9px] text-signal">{tr("about.founder")}</p>
                    <p className="font-display text-sm font-semibold">{founder}</p>
                  </div>
                  <p className="label-mono numeric text-[9px] opacity-60">01 / 01</p>
                </div>
              </div>
              <img
                src={signature}
                alt=""
                aria-hidden
                width={480}
                height={240}
                loading="lazy"
                className="signature-ink relative -mt-8 ms-4 h-20 w-auto"
              />
            </figure>

            <div className="md:col-span-6 md:col-start-7">
              <h2 className="display-md">{copy.storyTitle}</h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {copy.story.map((para) => (
                  <p key={para.slice(0, 32)}>{para}</p>
                ))}
              </div>

              {/* The line that carries the whole story — given room to breathe. */}
              <blockquote className="mt-10 border-s-2 border-signal ps-5">
                <p className="font-display text-lg font-semibold leading-snug tracking-tight md:text-xl">
                  {copy.pullQuote}
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* MEANING — the name is the brand's one piece of real symbolism,
            so it gets its own quiet full-width moment rather than a sidebar. */}
        <section className="border-b border-border">
          <div
            className="mx-auto max-w-4xl px-5 text-center sm:px-6"
            style={{ paddingBlock: "var(--section-y)" }}
          >
            <p className="label-mono">{copy.meaningTitle}</p>
            <p className="display-lg mx-auto mt-6 max-w-[16ch]">
              <span className="italic">Ruah</span>
            </p>
            <div className="mx-auto mt-6 max-w-[52ch] space-y-4">
              {copy.meaning.map((line, i) => (
                <p
                  key={line.slice(0, 24)}
                  className={
                    i === 0
                      ? "font-display text-lg font-semibold tracking-tight text-signal"
                      : "text-sm leading-relaxed text-muted-foreground"
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="border-b border-border bg-surface/30">
          <div
            className="mx-auto max-w-6xl px-5 sm:px-6"
            style={{ paddingBlock: "var(--section-y)" }}
          >
            <h2 className="display-lg max-w-[16ch]">{copy.principlesTitle}</h2>
            <div className="mt-10 md:mt-14">
              {copy.principles.map((p, i) => (
                <motion.div
                  key={p.n}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.07 }}
                  className="grid gap-3 border-t border-border py-7 last:border-b md:grid-cols-12 md:gap-8"
                >
                  <span className="label-mono numeric text-signal md:col-span-2">{p.n}</span>
                  <h3 className="font-display text-lg font-bold tracking-tight md:col-span-4">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground md:col-span-6">
                    {p.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <TrackRecord />

        {/* CTA */}
        <section>
          <div
            className="mx-auto max-w-4xl px-5 text-center sm:px-6"
            style={{ paddingBlock: "var(--section-y)" }}
          >
            <h2 className="display-lg mx-auto max-w-[18ch]">{copy.ctaTitle}</h2>
            <p className="lede mx-auto mt-5 text-center">{copy.ctaBody}</p>
            <Button asChild size="lg" className="mt-9 font-mono text-xs uppercase tracking-widest">
              <Link to="/" hash="contact">
                {tr("nav.start")}
                <ArrowRight
                  className={`ms-1 size-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter siteName={t("name") || SITE.name} />
    </>
  );
}
