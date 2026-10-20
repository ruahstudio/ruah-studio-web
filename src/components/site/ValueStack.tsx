import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

/**
 * Value stack + risk reversal.
 *
 * Everything here is something the studio actually does. No invented
 * guarantees, no fabricated scarcity, no countdowns. The persuasion comes from
 * specificity and from removing uncertainty about what happens after payment —
 * which is the real objection for a buyer who has been burned by a freelancer
 * who disappeared at handover.
 */

const INCLUDED = [
  ["Discovery", "We find the actual bottleneck before writing code."],
  ["Architecture", "Data model, roles and integrations decided up front."],
  ["Interface", "Designed, not templated. Responsive from the start."],
  ["Development", "Built by the person you spoke to in discovery."],
  ["AI & automation", "Where it removes real hours, not as decoration."],
  ["Deployment", "Live, monitored, with environments separated."],
  ["Documentation", "How it works and how to change it. You own it."],
  ["30 days support", "Bug fixes and adjustments after launch, included."],
];

const AFTER_YES = [
  ["01", "Discovery", "A short call. We map the process and find what to build first."],
  ["02", "Scope", "Written scope, price and timeline. What's in, what's out."],
  ["03", "Build", "You see progress, not silence."],
  ["04", "Review", "You test it. Changes within scope are expected, not extra."],
  ["05", "Launch", "Deployed, documented, handed over."],
  ["06", "Support", "30 days included. Care plan optional after that."],
];

const CARE = [
  "Monitoring and uptime checks",
  "Security and dependency updates",
  "Bug fixes on what we built",
  "Small adjustments and content changes",
  "Backups where applicable",
  "Direct technical contact",
];

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
          {INCLUDED.map(([title, body], i) => (
            <motion.div
              key={title}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              className="flex gap-3 border-b border-border py-5"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
              <div>
                <h3 className="font-display text-sm font-bold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AFTER YOU SAY YES */}
        <div className="mt-20 md:mt-28">
          <h2 className="display-md max-w-[22ch]">{tr("offer.afterTitle")}</h2>
          <ol className="mt-8 grid gap-px border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {AFTER_YES.map(([n, title, body]) => (
              <li key={n} className="border-b border-border py-5 pe-6">
                <span className="label-mono numeric text-signal">{n}</span>
                <h3 className="mt-2 font-display text-base font-bold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
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
            {CARE.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                <span className="text-muted-foreground">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
