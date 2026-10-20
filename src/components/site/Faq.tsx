import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import type { DbFaq } from "@/lib/cms";
import { useTranslation } from "@/i18n";

/**
 * FAQ as an editorial index rather than a boxed accordion.
 * Emits FAQPage structured data from the same content, so the answers can
 * surface directly in search results — built from real CMS rows only, never
 * from invented questions.
 */
export function Faq({ faqs }: { faqs: DbFaq[] }) {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);

  if (faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section id="faq" className="border-b border-border">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="label-mono">{tr("faq.eyebrow")}</p>
            <h2 className="display-lg mt-4 max-w-[14ch]">{tr("faq.title")}</h2>
          </div>

          <ul className="md:col-span-8" role="list">
            {faqs.map((f, i) => {
              const isOpen = open === f.id;
              const panelId = `faq-panel-${f.id}`;
              const btnId = `faq-btn-${f.id}`;
              return (
                <li key={f.id} className="border-b border-border first:border-t">
                  <h3>
                    <button
                      id={btnId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : f.id)}
                      className="group flex w-full items-start gap-5 py-6 text-start"
                    >
                      <span
                        className={`label-mono numeric mt-1.5 w-6 shrink-0 transition-colors ${
                          isOpen ? "text-signal" : ""
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`flex-1 font-display text-lg font-semibold tracking-tight transition-colors sm:text-xl ${
                          isOpen
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {f.question}
                      </span>
                      <Plus
                        aria-hidden
                        className={`mt-1.5 size-4 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-45 text-signal" : "text-muted-foreground"
                        }`}
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                      />
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                        exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-7 ps-11 pe-9 text-sm leading-relaxed text-muted-foreground">
                          {f.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
