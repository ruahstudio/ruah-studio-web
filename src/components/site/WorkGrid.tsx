import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectSlug } from "@/lib/slug";
import type { DbProject } from "@/lib/cms";
import { useTranslation } from "@/i18n";

/**
 * Column spans cycle so the grid never reads as a repeating card wall:
 * full-width lead, then a 7/5 pair, then 5/7 reversed, then full again.
 * Index modulo the pattern length keeps it stable for any project count.
 */
const SPAN_PATTERN = [
  "md:col-span-12",
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
] as const;

function spanFor(i: number) {
  return SPAN_PATTERN[i % SPAN_PATTERN.length]!;
}

/** Lead items get a taller image; narrow items get a shorter crop. */
function aspectFor(span: string) {
  if (span === "md:col-span-12") return "aspect-[21/9]";
  if (span === "md:col-span-7") return "aspect-[16/10]";
  return "aspect-[4/3]";
}

/**
 * Shown while there are no published case studies.
 *
 * It says the work exists and is being written up, rather than pretending the
 * section isn't there — a studio page with a silent gap where the portfolio
 * should be reads worse than one that explains itself. The slow rotating mark
 * is the "being organised" signal; it carries no claim of its own.
 */
function ComingSoon({ onPrefill }: { onPrefill: (prefill?: string) => void }) {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative mt-10 overflow-hidden border border-border bg-card md:mt-16"
    >
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative grid gap-8 p-8 md:grid-cols-12 md:items-center md:gap-12 md:p-14">
        {/* The mark: a slow, patient rotation — work in progress, not an error */}
        <div className="md:col-span-3">
          <span className="relative inline-flex size-20 items-center justify-center md:size-24">
            <span className="absolute inset-0 rounded-full border border-signal/25" />
            <motion.span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center text-signal"
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            >
              <LoaderCircle className="size-20 md:size-24" strokeWidth={0.6} />
            </motion.span>
            <span className="size-2 rounded-full bg-signal" />
          </span>
          <p className="label-mono mt-5 text-signal">{tr("work.soonLabel")}</p>
        </div>

        <div className="md:col-span-9">
          <h3 className="display-md max-w-[20ch]">{tr("work.soonTitle")}</h3>
          <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {tr("work.soonBody")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-[11px] uppercase tracking-widest"
              onClick={() => onPrefill()}
            >
              {tr("work.soonCta")}
            </Button>
            <span className="label-mono text-muted-foreground/70">{tr("work.soonMeta")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function WorkGrid({
  projects,
  eyebrow,
  title,
  body,
  onPrefill,
}: {
  projects: DbProject[];
  eyebrow: string;
  title: string;
  body: string;
  onPrefill: (prefill?: string) => void;
}) {
  const { tr, dir } = useTranslation();
  const reduced = useReducedMotion();

  // Runs wider than the text-led sections: images earn the extra width.
  return (
    <section id="work" className="border-y border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-5 sm:px-8" style={{ paddingBlock: "var(--section-y)" }}>
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="label-mono">{eyebrow}</p>
            <h2 className="display-lg mt-4 max-w-[20ch]">{title}</h2>
          </div>
          <p className="lede md:col-span-5">{body}</p>
        </div>

        {projects.length === 0 && <ComingSoon onPrefill={onPrefill} />}

        <div className="mt-10 grid gap-x-6 gap-y-12 md:mt-16 md:grid-cols-12 md:gap-y-16">
          {projects.map((p, i) => {
            const span = spanFor(i);
            const lead = span === "md:col-span-12";
            return (
              <motion.article
                key={p.id}
                className={span}
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to="/work/$slug"
                  params={{ slug: projectSlug(p) }}
                  className="group block"
                  aria-label={p.title}
                >
                  <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                    <span className="label-mono numeric text-signal">
                      {String(i + 1).padStart(2, "0")} · {p.code}
                    </span>
                    <span className="label-mono max-w-[12rem] text-end">{p.subtitle}</span>
                  </div>

                  <div
                    className={`relative mt-5 overflow-hidden rounded-xl border border-border bg-surface ${aspectFor(span)}`}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.03]"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                      />
                    ) : (
                      /* Structural placeholder — deliberately empty, no fake screenshot. */
                      <div className="grid-lines flex size-full items-center justify-center opacity-40">
                        <span className="label-mono">{p.code}</span>
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-transparent transition-colors group-hover:ring-signal/30" />
                  </div>

                  <h3
                    className={`mt-6 font-display font-bold tracking-tight transition-colors group-hover:text-signal ${
                      lead ? "display-lg" : "display-md"
                    }`}
                  >
                    {p.title}
                  </h3>
                  <p
                    className={`mt-3 text-muted-foreground ${lead ? "lede" : "text-sm leading-relaxed"}`}
                  >
                    {p.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {p.stack.slice(0, lead ? 8 : 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                    <span className="link-underline ms-auto inline-flex items-center gap-1 font-mono text-xs text-signal">
                      {tr("work.cta")}
                      <ArrowUpRight
                        className={`size-3.5 transition-transform group-hover:translate-x-0.5 ${
                          dir === "rtl" ? "-scale-x-100" : ""
                        }`}
                        aria-hidden
                      />
                    </span>
                  </div>
                </Link>

                <div className="mt-5 border-t border-border pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-[11px] uppercase tracking-widest"
                    onClick={() => onPrefill(p.prefill)}
                  >
                    {tr("work.similar")}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
