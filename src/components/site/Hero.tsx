import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { Atmosphere } from "@/components/motion/Atmosphere";
import { HeroScene } from "@/components/three/HeroScene";
import { useTranslation } from "@/i18n";

/**
 * Renders a headline where the accented span is marked in the translation
 * with [[double brackets]] instead of being matched against a hard-coded
 * English substring. The previous implementation only highlighted text when
 * the string ended with "working product." — so the accent silently vanished
 * in the other six languages.
 */
function AccentedTitle({ text }: { text: string }) {
  const parts = text.split(/\[\[(.+?)\]\]/s);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-signal">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const STATS: { value: string; key: Parameters<ReturnType<typeof useTranslation>["tr"]>[0] }[] = [
  { value: "4", key: "stats.platforms" },
  { value: "48h", key: "stats.prototype" },
  // "1" is the actual differentiator: you talk to the person who builds it.
  { value: "1", key: "stats.direct" },
  { value: "100%", key: "stats.remote" },
];

export function Hero({
  eyebrow,
  title,
  subtitle,
  onStart,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  onStart: () => void;
}) {
  const { tr, dir } = useTranslation();
  const reduced = useReducedMotion();

  const rise = {
    hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="top"
      className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden border-b border-border"
    >
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" />
      <Atmosphere />
      <HeroScene />

      {/* Technical metadata rail — desktop only, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-6 hidden flex-col justify-center gap-3 lg:flex"
      >
        {["SYS/ONLINE", "LAT 11.02°N", "LON 63.86°W", "BUILD 2.0"].map((meta) => (
          <span
            key={meta}
            className="label-mono numeric rotate-180 text-[9px] opacity-40 [writing-mode:vertical-rl]"
          >
            {meta}
          </span>
        ))}
      </div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 md:py-24"
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.11 } } }}
      >
        <motion.div variants={rise} className="flex items-center gap-3">
          <span className="rule-fade hidden w-16 sm:block" />
          <p className="label-mono">{eyebrow}</p>
        </motion.div>

        <motion.h1 variants={rise} className="display-xl mt-5 max-w-[15ch] md:mt-7">
          <AccentedTitle text={title} />
        </motion.h1>

        {/* Asymmetric second column: subtitle sits right of centre, not stacked */}
        <div className="mt-7 grid gap-8 md:mt-10 md:grid-cols-12 md:items-end">
          <motion.p variants={rise} className="lede md:col-span-6 md:col-start-6">
            {subtitle}
          </motion.p>
        </div>

        <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-3 md:mt-12">
          <Magnetic>
            <Button
              size="lg"
              className="font-mono text-xs uppercase tracking-widest"
              onClick={onStart}
            >
              {tr("hero.primaryCta")}
            </Button>
          </Magnetic>
          <Magnetic>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-mono text-xs uppercase tracking-widest"
            >
              <a href="#work">{tr("hero.secondaryCta")}</a>
            </Button>
          </Magnetic>
        </motion.div>

        <motion.dl
          variants={rise}
          className="mt-12 grid max-w-3xl grid-cols-2 border-t border-border md:mt-20 md:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.key} className="border-b border-border py-5 pe-6 md:border-b-0">
              <dt className="numeric font-display text-3xl font-bold text-signal">{s.value}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{tr(s.key)}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <motion.a
        href="#pillars"
        aria-hidden
        tabIndex={-1}
        className="absolute bottom-6 start-1/2 -translate-x-1/2 text-muted-foreground/60"
        style={{ transform: dir === "rtl" ? "translateX(50%)" : "translateX(-50%)" }}
        animate={reduced ? {} : { y: [0, 7, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="size-4" />
      </motion.a>
    </section>
  );
}
