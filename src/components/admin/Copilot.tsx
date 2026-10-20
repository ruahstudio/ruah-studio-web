import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUGGESTED, SUGGESTED_LEAD, ask, type Answer } from "@/lib/copilot";
import type { Lead } from "@/lib/crm";
import { Rich } from "@/components/site/Rich";

/**
 * "Pregúntale al CRM".
 *
 * Two things make this trustworthy enough to act on, and both are visible on
 * screen: every answer names the leads it used (and clicking one opens it),
 * and the answer says whether it came from the assistant or from the free
 * local reading of dates and stages.
 *
 * Citations that pointed at a lead that doesn't exist are dropped by the
 * server; when that happens the count is shown rather than hidden.
 */
export function Copilot({
  leads,
  lead,
  onOpenLead,
}: {
  leads: Lead[];
  /** When set, the questions are about this lead only. */
  lead?: Lead;
  onOpenLead: (id: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);

  async function run(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setQuestion(text);
    setAnswer(await ask(text, lead ? [lead] : leads, lead?.id ?? null));
    setBusy(false);
  }

  return (
    <section className="mt-6 border border-border bg-card p-4" data-testid="crm-copilot">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-signal" aria-hidden />
        <p className="label-mono">
          {lead ? `Pregunta sobre ${lead.business || lead.name}` : "Pregúntale al CRM"}
        </p>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(question);
        }}
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            lead ? "¿Qué me dijo del presupuesto?" : "¿A quién contacto hoy? ¿Qué falta por hacer?"
          }
          maxLength={500}
          aria-label="Pregunta al copiloto"
        />
        <Button type="submit" disabled={busy || !question.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Preguntar"}
        </Button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {(lead ? SUGGESTED_LEAD : SUGGESTED).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void run(s)}
            className="border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-signal/60 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {answer && (
        <div className="mt-4 border-s-2 border-signal ps-4" data-testid="copilot-answer">
          <div className="text-sm leading-relaxed">
            <Rich text={answer.reply} />
          </div>

          {answer.cites.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {answer.cites.map((c) => (
                <li key={`${c.ref}-${c.leadId}`}>
                  <button
                    type="button"
                    onClick={() => onOpenLead(c.leadId)}
                    className="border border-signal/40 bg-signal/10 px-2 py-1 text-xs transition-colors hover:border-signal"
                    title={c.why}
                  >
                    {c.name} ↗
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {answer.live ? "asistente · con tus datos" : "lectura local · sin IA"}
            {!answer.confident && " · es una lectura, no un dato"}
            {answer.dropped > 0 && ` · ${answer.dropped} cita(s) descartada(s) por no existir`}
          </p>
        </div>
      )}
    </section>
  );
}
