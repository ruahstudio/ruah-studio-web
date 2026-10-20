import { Check } from "lucide-react";
import { useTranslation, type AnyKey } from "@/i18n";
import { budgetLabel, timelineLabel } from "@/lib/agent";
import { BRIEF_FIELDS, briefProgress, type BriefData } from "@/lib/brief";
import type { Quote } from "@/lib/leads";

/**
 * The visitor's project, taking shape as they talk.
 *
 * Six rows fill in live. Seeing the project assemble does two jobs: it
 * proves the assistant is listening (trust), and an unfinished checklist is
 * something people want to finish (momentum). It also makes the rule visible:
 * nothing is priced until all six are clear.
 */
export function ProjectCard({ brief, compact = false }: { brief: BriefData; compact?: boolean }) {
  const { tr, lang } = useTranslation();
  const n = briefProgress(brief);
  const value = (f: (typeof BRIEF_FIELDS)[number]) =>
    f === "timeline"
      ? timelineLabel(lang, brief.timeline)
      : f === "budget"
        ? budgetLabel(lang, brief.budget)
        : brief[f];

  return (
    <section
      data-testid="project-card"
      aria-label={tr("card.title")}
      className="border border-border bg-surface/60 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-[10px]">{tr("card.title")}</p>
        <p
          className="numeric font-mono text-[10px] text-muted-foreground"
          data-testid="card-progress"
        >
          {tr("card.progress", { n: String(n) })}
        </p>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {BRIEF_FIELDS.map((f) => (
          <span
            key={f}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              brief[f] ? "bg-signal" : "bg-border"
            }`}
          />
        ))}
      </div>
      {!compact && (
        <ul className="mt-3 grid gap-1.5">
          {BRIEF_FIELDS.map((f) => {
            const v = value(f);
            return (
              <li key={f} className="flex items-start gap-2 text-xs">
                <span
                  className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
                    v ? "border-signal bg-signal text-signal-foreground" : "border-border"
                  }`}
                >
                  {v && <Check className="size-2.5" aria-hidden />}
                </span>
                <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tr(`card.${f}` as AnyKey)}
                </span>
                <span
                  className={`line-clamp-1 ${v ? "text-foreground" : "text-muted-foreground/60"}`}
                >
                  {v || "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * The estimate, read against the budget.
 *
 * Over budget is never "too expensive": it's the first phase that fits, with
 * the rest as a second phase. A lead lost on price is usually a lead nobody
 * offered a smaller first step to.
 */
export function QuoteCard({ quote }: { quote: Quote }) {
  const { tr } = useTranslation();
  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  const mod = (m: string) => tr(`mod.${m}` as AnyKey);

  let fitText = tr("quote.unknown");
  let tone = "text-muted-foreground";
  if (quote.fit.kind === "within") {
    fitText = tr("quote.within");
    tone = "text-signal";
  } else if (quote.fit.kind === "phased") {
    fitText = tr("quote.phased", {
      modules: quote.fit.phase1.map(mod).join(" · "),
      total: money(quote.fit.phase1Total),
    });
    tone = "text-foreground";
  } else if (quote.fit.kind === "below") {
    fitText = tr("quote.below", { min: money(quote.fit.smallest) });
  }

  return (
    <section data-testid="quote-card" className="border border-signal/60 bg-card p-3">
      <p className="label-mono text-[10px]">{tr("quote.title")}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p
          className="numeric font-display text-2xl font-bold tracking-tight"
          data-testid="quote-total"
        >
          {money(quote.total)}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {tr("quote.weeks", { n: String(quote.weeks) })}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{quote.modules.map(mod).join(" · ")}</p>
      <p className={`mt-2 text-xs leading-relaxed ${tone}`} data-testid="quote-fit">
        {fitText}
      </p>
    </section>
  );
}
