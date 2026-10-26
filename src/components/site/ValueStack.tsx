import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import type { ExtraKey } from "@/i18n/extra";

/**
 * Value stack + risk reversal.
 *
 * Everything here is something the studio actually does. No invented
 * guarantees, no fabricated scarcity, no countdowns. The persuasion comes from
 * specificity and from removing uncertainty about what happens after payment —
 * which is the real objection for a buyer who has been burned by a freelancer
 * who disappeared at handover.
 */

/**
 * These three lists were arrays of English sentences written straight into the
 * component, so a visitor reading the site in any of the other six languages
 * got the whole value proposition in English. They are keys now; the words
 * live in the dictionary like every other string on the page.
 */
const INCLUDED = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const AFTER_YES = [1, 2, 3, 4, 5, 6] as const;
const CARE = [1, 2, 3, 4, 5, 6] as const;

export function ValueStack({ onStart }: { onStart: () => void }) {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();

  return (
    <section id="offer" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        {/* VALUE STACK */}
        <div className="max-w-[34ch]">
          <p className="label-mono">{tr("offer.eyebrow")}</p>
          <h2 className="display-lg mt-4">{tr("offer.title")}</h2>
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-px border-t border-border md:mt-14 md:grid-cols-2">
          {INCLUDED.map((n, i) => (
            <motion.div
              key={n}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              className="flex gap-3 border-b border-border py-5"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
              <div>
                <h3 className="font-display text-sm font-bold tracking-tight">
                  {tr(`vs.inc${n}.t` as ExtraKey)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {tr(`vs.inc${n}.b` as ExtraKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AFTER YOU SAY YES */}
        <div className="mt-20 md:mt-28">
          <h2 className="display-md max-w-[22ch]">{tr("offer.afterTitle")}</h2>
          <ol className="mt-8 grid gap-px border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {AFTER_YES.map((n) => (
              <li key={n} className="border-b border-border py-5 pe-6">
                <span className="label-mono numeric text-signal">{String(n).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-base font-bold tracking-tight">
                  {tr(`vs.step${n}.t` as ExtraKey)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {tr(`vs.step${n}.b` as ExtraKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* CARE PLAN */}
        <div className="mt-20 grid gap-8 border border-signal/40 p-6 md:mt-28 md:grid-cols-12 md:gap-12 md:p-10">
          <div className="md:col-span-5">
            <p className="label-mono text-signal">{tr("care.eyebrow")}</p>
            <h2 className="display-md mt-3">{tr("care.title")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tr("care.body")}</p>
            <p className="numeric mt-6 font-display text-4xl font-bold text-signal" dir="ltr">
              {tr("care.price")}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{tr("care.note")}</p>
            <Button
              className="mt-6 w-full font-mono text-xs uppercase tracking-widest md:w-auto"
              onClick={onStart}
            >
              {tr("care.cta")}
            </Button>
          </div>

          <ul className="grid gap-2.5 md:col-span-6 md:col-start-7 md:content-center">
            {CARE.map((n) => (
              <li key={n} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                <span className="text-muted-foreground">{tr(`vs.care${n}` as ExtraKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
