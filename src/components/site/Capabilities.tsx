import { motion, useReducedMotion } from "framer-motion";
import { capabilityMeta, capabilityKey } from "@/lib/capabilities";
import type { DbWeBuild } from "@/lib/cms";
import { useTranslation } from "@/i18n";

/**
 * One section answers "what do you do", once.
 *
 * This replaces two sections that both answered it — a pillars card grid and
 * a full-viewport capability explorer whose detail panel carried about thirty
 * words of real information. The explorer's flow diagrams were decorative
 * pseudo-data: "Trigger → Classify → Act → Notify" tells a buyer nothing.
 *
 * Here each pillar is a row: a large number, the discipline, one line of
 * plain language, and the actual capabilities as dense inline text. Dense
 * beats spacious when the content is a list of things you can do.
 */

/** capabilities.ts categories collapsed onto the three public pillars. */
const PILLAR_OF: Record<string, 0 | 1 | 2> = {
  AI: 0,
  DATA: 1,
  OPS: 1,
  PRODUCT: 2,
  INTERFACE: 2,
};

type Pillar = { num: string; title: string; body: string };

/** Pillars come from the CMS so they stay translated; passing them in keeps
 *  this component from silently rendering the untranslated English defaults. */
export function Capabilities({ items, pillars }: { items: DbWeBuild[]; pillars: Pillar[] }) {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();

  const grouped: DbWeBuild[][] = [[], [], []];
  for (const item of items) {
    // Prefer the row's stable key: the visible label is translated, so
    // deriving the key from it only works in English.
    const key = item.capKey ?? capabilityKey(item.item);
    const idx = PILLAR_OF[capabilityMeta(key).category] ?? 2;
    grouped[idx]!.push(item);
  }

  return (
    <section id="pillars" className="relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        {/* Header sits narrow and left; the rows below run full width. */}
        <div className="max-w-[34ch]">
          <p className="label-mono">{tr("pillars.eyebrow")}</p>
          <h2 className="display-lg mt-4">{tr("pillars.title")}</h2>
        </div>

        {/* The header is #pillars; the rows below are what the "We build" link
            points at, so that anchor has a target of its own instead of
            silently resolving to nothing. */}
        <div id="we-build" className="mt-10 md:mt-16">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.num}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.65, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group grid gap-4 border-t border-border py-7 last:border-b md:grid-cols-12 md:gap-10 md:py-12"
            >
              {/* Oversized numeral — the only decoration, and it carries meaning */}
              <div className="md:col-span-3">
                <span
                  className="numeric block font-display text-[3.5rem] font-bold leading-none tracking-tighter text-border transition-colors duration-500 group-hover:text-signal md:text-[4.5rem]"
                  style={{ transitionTimingFunction: "var(--ease-out)" }}
                  aria-hidden
                >
                  {pillar.num}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold tracking-tight md:text-2xl">
                  {pillar.title}
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground md:col-span-4 md:pt-4">
                {pillar.body}
              </p>

              {/* Capabilities as dense text, not eleven boxes */}
              <ul className="flex flex-wrap gap-x-1.5 gap-y-2 md:col-span-5 md:pt-4">
                {grouped[i]!.map((w, j) => (
                  <li key={w.id} className="font-mono text-xs text-foreground/80">
                    {w.item}
                    {j < grouped[i]!.length - 1 && (
                      <span className="ms-1.5 text-signal/50" aria-hidden>
                        /
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
