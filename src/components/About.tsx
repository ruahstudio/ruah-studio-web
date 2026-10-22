import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import portraitLocal from "@/assets/portrait.jpg";
import signature from "@/assets/signature.png";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { aboutCopy } from "@/lib/about-content";
import { useStudio } from "@/lib/cms";
import { useTranslation } from "@/i18n";

/**
 * Founder strip on the landing page.
 *
 * It had been written and then never rendered — the landing had a bare
 * `{/* ABOUT *\/}` comment where it should have been, so a visitor could read
 * the whole page without once meeting the person who would answer them. That
 * is a strange gap for a one-person studio, where the founder IS the
 * differentiator.
 *
 * Short on purpose: the full story lives on /about. This is the face, the
 * claim, and the door to it.
 */
export function About() {
  const { t } = useStudio();
  const { tr, lang, dir } = useTranslation();
  const reduced = useReducedMotion();
  const copy = aboutCopy(lang);

  // The Lovable asset JSON points at /__l5e/... which only resolves inside
  // Lovable's preview. Locally and in production it 404s, so the bundled
  // portrait is the real fallback. Set photo_url in the admin to override.
  const photo = t("photo_url") || portraitLocal;
  const founder = t("founder") || "John Salazar";

  return (
    <section id="founder" className="relative overflow-hidden border-b border-border">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-20" />

      <div
        className="relative mx-auto max-w-6xl px-5 sm:px-6"
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-14">
          {/* PORTRAIT — cropped tall, signature breaking the frame */}
          <Reveal className="md:col-span-4">
            <figure className="relative">
              <div className="photo-grain relative aspect-[4/5] overflow-hidden border border-border bg-surface">
                <img
                  src={photo}
                  alt={`${tr("about.portraitAlt")} ${founder}`}
                  width={1183}
                  height={888}
                  loading="lazy"
                  className="size-full object-cover object-top grayscale transition-all duration-[1200ms] hover:grayscale-0"
                  style={{ transitionTimingFunction: "var(--ease-out)" }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <p className="label-mono text-[9px] text-signal">{tr("about.founder")}</p>
                  <p className="font-display text-sm font-semibold">{founder}</p>
                </div>
              </div>

              <motion.img
                src={signature}
                alt={`${tr("about.signatureAlt")} ${founder}`}
                width={480}
                height={240}
                loading="lazy"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="signature-ink relative -mt-8 ms-4 h-16 w-auto"
              />
            </figure>
          </Reveal>

          <Reveal delay={120} className="md:col-span-7 md:col-start-6">
            <p className="label-mono">{tr("about.eyebrow")}</p>
            <h2 className="display-lg mt-4 max-w-[16ch]">
              {copy.heroLine} <span className="text-signal">{copy.heroAccent}</span>
            </h2>
            <p className="lede mt-6 max-w-[48ch]">{copy.lede}</p>

            <blockquote className="mt-8 border-s-2 border-signal ps-5">
              <p className="font-display text-lg font-semibold leading-snug tracking-tight">
                {copy.pullQuote}
              </p>
            </blockquote>

            <Button
              asChild
              variant="outline"
              className="mt-9 font-mono text-xs uppercase tracking-widest"
            >
              <Link to="/about">
                {tr("about.readMore")}
                <ArrowRight
                  className={`ms-1 size-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
