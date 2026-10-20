import { motion, useReducedMotion } from "framer-motion";
import portraitLocal from "@/assets/portrait.jpg";
import signature from "@/assets/signature.png";
import { Reveal } from "@/components/Reveal";
import { useStudio } from "@/lib/cms";
import { useTranslation } from "@/i18n";

/**
 * Founder section, treated editorially rather than as an "about me" card.
 * The portrait carries technical metadata like a contact sheet, and the
 * signature is used as a brand mark instead of decoration. The competitive
 * point being made is "you work directly with the person who builds it".
 */
export function About() {
  const { t } = useStudio();
  const { tr } = useTranslation();
  const reduced = useReducedMotion();

  // The Lovable asset JSON points at /__l5e/... which only resolves inside
  // Lovable's preview. Locally and in production it 404s, so the bundled
  // portrait is the real fallback. Set photo_url in the admin to override.
  const photo = t("photo_url") || portraitLocal;
  const founder = t("founder") || "John Salazar";

  const facts = [
    [tr("about.fact1k"), tr("about.fact1v")],
    [tr("about.fact2k"), tr("about.fact2v")],
    [tr("about.fact3k"), tr("about.fact3v")],
    [tr("about.fact4k"), tr("about.fact4v")],
  ];

  return (
    <section id="about" className="relative overflow-hidden border-b border-border">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-20" />

      <div
        className="relative mx-auto max-w-6xl px-5 sm:px-6"
        style={{ paddingBlock: "var(--section-y)" }}
      >
        {/* Header spans the full grid so the headline can run wide */}
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="label-mono">{tr("about.eyebrow")}</p>
            <h2 className="display-lg mt-4 max-w-[18ch]">{tr("about.title")}</h2>
          </div>
          <p className="lede md:col-span-5">{tr("about.body")}</p>
        </div>

        <div className="mt-10 grid gap-9 md:mt-16 md:grid-cols-12 md:items-start md:gap-12">
          {/* PORTRAIT — offset, cropped tall, with a metadata rail */}
          <Reveal className="md:col-span-5">
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
                {/* Contact-sheet metadata, bottom-left over the image */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <div>
                    <p className="label-mono text-[9px] text-signal">{tr("about.founder")}</p>
                    <p className="font-display text-sm font-semibold">{founder}</p>
                  </div>
                  <p className="label-mono numeric text-[9px] opacity-60">01 / 01</p>
                </div>
              </div>

              {/* Signature as brand mark, breaking the frame */}
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
                className="signature-ink relative -mt-8 ms-4 h-20 w-auto"
              />
            </figure>
          </Reveal>

          {/* FACTS — editorial rows, not a boxed grid */}
          <Reveal delay={120} className="md:col-span-6 md:col-start-7">
            <dl>
              {facts.map(([k, v], i) => (
                <div
                  key={k}
                  className="flex items-baseline gap-6 border-b border-border py-5 first:border-t"
                >
                  <dt className="label-mono numeric w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </dt>
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="label-mono">{k}</span>
                    <dd className="font-display text-base font-semibold sm:text-lg">{v}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <p className="mt-10 max-w-[46ch] whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {tr("about.commitment")}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
