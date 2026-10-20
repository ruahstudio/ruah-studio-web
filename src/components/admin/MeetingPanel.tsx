import { useRef, useState } from "react";
import { CalendarClock, FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeMeeting,
  prepareMeeting,
  type Analysis,
  type Claim,
  type Prep,
} from "@/lib/copilot";
import { useAddMeeting, useMeetings, useUpdateLead, type Lead } from "@/lib/crm";

/**
 * Conversations: the transcript John uploads, and what the assistant reads
 * in it.
 *
 * Recording happens outside — the phone, Zoom, a browser extension — and
 * nothing here pretends otherwise: no fake integration, no "connected" badge
 * for something that isn't. What this does is the part that actually takes
 * John's time: turning an hour of conversation into budget, deadline,
 * objections and next steps.
 *
 * Every statement carries the exact line it came from and how sure it is:
 *   DATO       it was said, word for word
 *   INFERENCIA read between the lines
 *   DUDOSO     might be, unclear
 * Anything the model couldn't quote from the transcript is dropped before it
 * gets here, and the count is shown.
 *
 * Nothing is written to the lead automatically. Applying a budget, a deadline
 * or a follow-up date is a button John presses.
 */

const KIND_LABEL: Record<string, string> = {
  FACT: "DATO",
  INFERENCE: "INFERENCIA",
  UNCERTAIN: "DUDOSO",
};
const KIND_TONE: Record<string, string> = {
  FACT: "border-signal/50 bg-signal/10 text-foreground",
  INFERENCE: "border-border bg-surface text-muted-foreground",
  UNCERTAIN: "border-destructive/40 bg-destructive/5 text-muted-foreground",
};
const FIELD_LABEL: Record<string, string> = {
  budget: "Presupuesto",
  timeline: "Plazo",
  urgency: "Urgencia",
  authority: "Quién decide",
  need: "Necesidad",
  requirement: "Requisito",
  integration: "Integración",
  competitor: "Competencia",
  risk: "Riesgo",
  opportunity: "Oportunidad",
  other: "Otro",
};
const SOURCES = ["Zoom", "Google Meet", "Teams", "Grabadora del teléfono", "Notas a mano", "Otro"];

function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <li className="border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${KIND_TONE[claim.kind] ?? ""}`}
        >
          {KIND_LABEL[claim.kind] ?? claim.kind}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {FIELD_LABEL[claim.field] ?? claim.field}
        </span>
      </div>
      <p className="mt-2 text-sm">{claim.text}</p>
      <p className="mt-1 border-s-2 border-border ps-2 text-xs italic text-muted-foreground">
        “{claim.quote}”
      </p>
    </li>
  );
}

export function MeetingPanel({ lead }: { lead: Lead }) {
  const { data: meetings } = useMeetings(lead.id);
  const addMeeting = useAddMeeting();
  const update = useUpdateLead();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("call");
  const [source, setSource] = useState(SOURCES[0] ?? "Otro");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [prep, setPrep] = useState<Prep | null>(null);
  const [busy, setBusy] = useState<"" | "analyze" | "prep">("");

  async function onFile(file: File) {
    const text = await file.text();
    setTranscript(text.slice(0, 60000));
    if (!title) setTitle(file.name.replace(/\.[a-z]+$/i, "").slice(0, 200));
    toast.success(`Transcripción cargada (${text.length.toLocaleString("es")} caracteres)`);
  }

  async function analyze() {
    if (transcript.trim().length < 40) {
      toast.error("La transcripción es muy corta.");
      return;
    }
    setBusy("analyze");
    setAnalysis(await analyzeMeeting(lead.id, transcript));
    setBusy("");
  }

  async function runPrep() {
    setBusy("prep");
    setPrep(await prepareMeeting(lead.id, lead));
    setBusy("");
  }

  function save() {
    if (!analysis) return;
    addMeeting.mutate(
      {
        leadId: lead.id,
        kind,
        title: title.trim() || "Conversación",
        source,
        transcript,
        analysis,
        analyzedBy: analysis.live ? "asistente" : "local",
      },
      {
        onSuccess: () => {
          toast.success("Reunión guardada en el historial del lead");
          setOpen(false);
          setTranscript("");
          setAnalysis(null);
          setTitle("");
        },
        onError: (e) => toast.error(String(e)),
      },
    );
  }

  /** Applying what was said to the lead is always a decision, never automatic. */
  function applyBudget() {
    if (!analysis?.budget) return;
    const usd = Math.round((analysis.budget.min + analysis.budget.max) / 2);
    update.mutate(
      { id: lead.id, patch: { value_usd: usd } },
      { onSuccess: () => toast.success(`Valor del trato: $${usd.toLocaleString("en-US")}`) },
    );
  }

  function scheduleFollowUp(days: number) {
    const at = new Date(Date.now() + days * 86400000).toISOString();
    update.mutate(
      { id: lead.id, patch: { next_action_at: at } },
      { onSuccess: () => toast.success(`Seguimiento en ${days} días`) },
    );
  }

  return (
    <div className="mt-8" data-testid="meeting-panel">
      <div className="flex flex-wrap items-center gap-3">
        <p className="label-mono">Conversaciones</p>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {meetings?.length ?? 0} registrada(s)
        </span>
        <div className="ms-auto flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void runPrep()}
            disabled={busy === "prep"}
            className="font-mono text-[11px] uppercase tracking-widest"
          >
            {busy === "prep" ? (
              <Loader2 className="me-1 size-4 animate-spin" aria-hidden />
            ) : (
              <CalendarClock className="me-1 size-4" aria-hidden />
            )}
            Preparar reunión
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-[11px] uppercase tracking-widest"
          >
            <FileUp className="me-1 size-4" aria-hidden />
            Procesar reunión
          </Button>
        </div>
      </div>

      {/* Ya guardadas */}
      {(meetings?.length ?? 0) > 0 && (
        <ul className="mt-3 space-y-2">
          {meetings?.map((m) => {
            const a = m.analysis as Analysis | null;
            return (
              <li key={m.id} className="border border-border bg-surface p-3">
                <p className="text-sm font-semibold">
                  {m.title || "Conversación"}{" "}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {new Date(m.held_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                    {m.source ? ` · ${m.source}` : ""}
                  </span>
                </p>
                {a?.summary && <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {/* Preparación */}
      {prep && (
        <div className="mt-4 border border-signal/40 bg-signal/5 p-4" data-testid="meeting-prep">
          <p className="label-mono">Antes de hablar con {lead.business || lead.name}</p>
          <p className="mt-2 text-sm">{prep.opening}</p>
          {prep.known.length > 0 && (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {prep.known.map((k) => (
                <div key={`${k.label}-${k.value}`}>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {k.label} · {k.source}
                  </dt>
                  <dd className="text-sm">{k.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {prep.ask.length > 0 && (
            <>
              <p className="mt-3 label-mono">Preguntar</p>
              <ol className="mt-1 ms-4 list-decimal space-y-1 text-sm">
                {prep.ask.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </>
          )}
          {prep.watchouts.length > 0 && (
            <>
              <p className="mt-3 label-mono">Ojo con</p>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {prep.watchouts.map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
            </>
          )}
          {prep.missing.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Falta saber: {prep.missing.join(" · ")}
            </p>
          )}
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {prep.live ? "asistente · con tus datos" : "lectura local · sin IA"}
          </p>
        </div>
      )}

      {/* Subir y analizar */}
      {open && (
        <div className="mt-4 border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label-mono" htmlFor="meeting-title">
                Título
              </label>
              <Input
                id="meeting-title"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Llamada de diagnóstico"
                className="mt-1"
              />
            </div>
            <div>
              <label className="label-mono" htmlFor="meeting-kind">
                Tipo
              </label>
              <select
                id="meeting-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="mt-1 h-10 w-full border border-border bg-surface px-3 text-sm"
              >
                <option value="call">Llamada</option>
                <option value="video">Videollamada</option>
                <option value="meeting">Presencial</option>
                <option value="notes">Notas</option>
                <option value="chat">Chat</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="label-mono" htmlFor="meeting-source">
              De dónde salió la transcripción
            </label>
            <select
              id="meeting-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 h-10 w-full border border-border bg-surface px-3 text-sm sm:w-64"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="label-mono" htmlFor="meeting-transcript">
                Transcripción
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.vtt,.srt,.csv,.json,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="font-mono text-[10px] uppercase tracking-widest"
              >
                Subir archivo (.txt, .vtt, .srt)
              </Button>
            </div>
            <Textarea
              id="meeting-transcript"
              rows={8}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={"Pega aquí la transcripción.\n\nCLIENTE: …\nJOHN: …"}
              className="mt-1 font-mono text-xs"
            />
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {transcript.length.toLocaleString("es")} caracteres · se guarda tal cual, es la fuente
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void analyze()} disabled={busy === "analyze"}>
              {busy === "analyze" ? (
                <Loader2 className="me-1 size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="me-1 size-4" aria-hidden />
              )}
              Analizar
            </Button>
            {analysis && (
              <Button
                type="button"
                variant="secondary"
                onClick={save}
                disabled={addMeeting.isPending}
              >
                Guardar en el CRM
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Resultado */}
      {analysis && (
        <div className="mt-4 border border-signal/40 p-4" data-testid="meeting-analysis">
          <p className="label-mono">Lo que se dijo</p>
          <p className="mt-2 text-sm leading-relaxed">{analysis.summary}</p>

          {(analysis.budget || analysis.timeline) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {analysis.budget && (
                <div className="border border-border p-3" data-testid="analysis-budget">
                  <p className="label-mono">Presupuesto mencionado</p>
                  <p className="mt-1 text-lg font-semibold">
                    {analysis.budget.min === analysis.budget.max
                      ? `${analysis.budget.currency} ${analysis.budget.min.toLocaleString("en-US")}`
                      : `${analysis.budget.currency} ${analysis.budget.min.toLocaleString("en-US")} – ${analysis.budget.max.toLocaleString("en-US")}`}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    confianza {analysis.budget.confidence}
                  </p>
                  <p className="mt-1 border-s-2 border-border ps-2 text-xs italic text-muted-foreground">
                    “{analysis.budget.quote}”
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={applyBudget}
                    className="mt-2 font-mono text-[10px] uppercase tracking-widest"
                  >
                    Usar como valor del trato
                  </Button>
                </div>
              )}
              {analysis.timeline && (
                <div className="border border-border p-3">
                  <p className="label-mono">Plazo mencionado</p>
                  <p className="mt-1 text-sm">{analysis.timeline.text}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    confianza {analysis.timeline.confidence}
                  </p>
                  <p className="mt-1 border-s-2 border-border ps-2 text-xs italic text-muted-foreground">
                    “{analysis.timeline.quote}”
                  </p>
                </div>
              )}
            </div>
          )}

          {analysis.claims.length > 0 && (
            <>
              <p className="mt-4 label-mono">Afirmaciones</p>
              <ul className="mt-2 grid gap-2">
                {analysis.claims.map((c, i) => (
                  <ClaimRow key={`${c.field}-${i}`} claim={c} />
                ))}
              </ul>
            </>
          )}

          {analysis.objections.length > 0 && (
            <>
              <p className="mt-4 label-mono">Objeciones</p>
              <ul className="mt-2 grid gap-2">
                {analysis.objections.map((o, i) => (
                  <li key={`${o.type}-${i}`} className="border border-border bg-surface p-3">
                    <p className="text-sm font-semibold capitalize">{o.type}</p>
                    <p className="mt-1 text-sm">{o.context}</p>
                    {o.reply && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-mono text-[10px] uppercase tracking-widest">
                          Respuesta sugerida:{" "}
                        </span>
                        {o.reply}
                      </p>
                    )}
                    <p className="mt-1 border-s-2 border-border ps-2 text-xs italic text-muted-foreground">
                      “{o.quote}”
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {analysis.next_steps.length > 0 && (
            <>
              <p className="mt-4 label-mono">Próximos pasos</p>
              <ul className="mt-2 space-y-1 text-sm">
                {analysis.next_steps.map((s, i) => (
                  <li key={`${s.owner}-${i}`}>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                      {s.owner === "cliente" ? "cliente" : "ruah"}
                    </span>{" "}
                    {s.text}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                {[2, 7].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => scheduleFollowUp(d)}
                    className="font-mono text-[10px] uppercase tracking-widest"
                  >
                    Seguimiento en {d} días
                  </Button>
                ))}
              </div>
            </>
          )}

          {(analysis.questions.length > 0 || analysis.missing.length > 0) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {analysis.questions.length > 0 && (
                <div>
                  <p className="label-mono">Quedó sin preguntar</p>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {analysis.questions.map((q) => (
                      <li key={q}>· {q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.missing.length > 0 && (
                <div>
                  <p className="label-mono">Falta para decidir</p>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {analysis.missing.map((m) => (
                      <li key={m}>· {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {analysis.live
              ? "asistente · citas verificadas contra la transcripción"
              : "lectura local · sin IA"}
            {analysis.dropped > 0 &&
              ` · ${analysis.dropped} afirmación(es) descartada(s) por no encontrarse en el texto`}
          </p>
        </div>
      )}
    </div>
  );
}
