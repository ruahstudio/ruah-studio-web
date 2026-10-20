import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DbPricing } from "@/lib/cms";
import { useTranslation } from "@/i18n";

/**
 * Custom development doesn't sell in SaaS tiers, so this is a set of
 * editorial rows rather than three competing cards: the price reads as a
 * starting point, and the row layout removes the implied "pick the middle
 * one" pressure. Every string goes through i18n — the previous version was
 * hardcoded in Spanish, which meant six of seven languages saw Spanish here.
 */
export function Pricing({
  tiers,
  onSelect,
}: {
  tiers: DbPricing[];
  onSelect: (prefill: string) => void;
}) {
  const { tr, dir } = useTranslation();
  const reduced = useReducedMotion();

  if (tiers.length === 0) return null;

  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        <div className="md:max-w-[62%]">
          <p className="label-mono">{tr("pricing.eyebrow")}</p>
          <h2 className="display-lg mt-4 max-w-[24ch]">{tr("pricing.title")}</h2>
        </div>

        <div className="mt-9 md:mt-14 border-t border-border">
          {tiers.map((tier, i) => (
            <motion.article
              key={tier.id}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group grid gap-6 border-b border-border py-10 md:grid-cols-12 md:gap-8"
            >
              {/* Index + service */}
              <div className="md:col-span-4">
                <span className="label-mono numeric text-signal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display-md mt-2 text-xl md:text-2xl">{tier.service}</h3>
                <p
                  className="numeric mt-3 font-display text-3xl font-bold text-signal md:text-4xl"
                  dir="ltr"
                >
                  {tier.price_from}
                </p>
              </div>

              {/* Description + inclusions */}
              <div className="md:col-span-5">
                <p className="text-sm leading-relaxed text-muted-foreground">{tier.description}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {tier.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="flex items-start md:col-span-3 md:justify-end">
                <Button
                  variant="outline"
                  className="w-full font-mono text-[11px] uppercase tracking-widest transition-colors group-hover:border-signal group-hover:text-signal md:w-auto"
                  onClick={() =>
                    onSelect(
                      tr("pricing.prefill", {
                        service: tier.service,
                        price: tier.price_from,
                      }),
                    )
                  }
                >
                  {tr("pricing.cta")}
                  {/* logical margin + mirrored glyph so RTL reads correctly */}
                  <ArrowUpRight
                    className={`ms-1 size-4 ${dir === "rtl" ? "-scale-x-100" : ""}`}
                    aria-hidden
                  />
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
