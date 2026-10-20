import { useEffect, useMemo, useState } from "react";
import { FileText, Instagram, Mail, MessageCircle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rich } from "@/components/site/Rich";
import { Copilot } from "@/components/admin/Copilot";
import { MeetingPanel } from "@/components/admin/MeetingPanel";
import { budgetLabel, timelineLabel } from "@/lib/agent";
import { goalLabel } from "@/lib/goals";
import { buildTimeline, byDay, type TimelineEvent } from "@/lib/timeline";
import {
  STAGES,
  STAGE_LABEL,
  leadInstagram,
  leadMailto,
  leadWhatsApp,
  quoteLink,
  useAddNote,
  useDeleteLead,
  useLeadNotes,
  useUpdateLead,
  type Lead,
} from "@/lib/crm";
import type { LeadStatus } from "@/integrations/supabase/types";
import { translate, type AnyKey } from "@/i18n";

/**
 * One lead, in full.
 *
 * Organised the way a conversation with that client actually goes: the four
 * numbers that decide whether to call at all, then four tabs —
 *
 *   Resumen        what they asked for and what it costs
 *   Conversaciones the transcripts and what the assistant read in them
 *   Historial      everything that happened, with its source
 *   Copiloto       questions about THIS lead
 *
 * Tabs rather than one long page because the panel used to run past three
 * screens: the note box, which is what John reaches for after every call,
 * was the furthest thing from the top.
 */

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const SCORE_LABEL = { hot: "Caliente", warm: "Tibio", cold: "Frío" } as const;
const SCORE_TONE = {
  hot: "border-signal bg-signal text-signal-foreground",
  warm: "border-signal/50 text-foreground",
  cold: "border-border text-muted-foreground",
} as const;
const FIT_LABEL: Record<string, string> = {
  within: "Entra en su presupuesto",
  phased: "Su presupuesto cubre una Fase 1",
  below: "Presupuesto por debajo de una primera fase",
  unknown: "Presupuesto sin definir",
};

const DOT: Record<string, string> = {
  lead: "bg-signal",
  conversation: "bg-signal/60",
  quote: "bg-signal",
  stage: "bg-border",
  note: "bg-foreground/60",
  system: "bg-border",
  followup: "bg-destructive",
};

const TABS = ["resumen", "conversaciones", "historial", "copiloto"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  historial: "Historial",
  copiloto: "Copiloto",
};

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border-e border-border px-4 py-3 last:border-e-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`numeric mt-1 truncate font-display text-lg font-bold ${tone ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

export function LeadSheet({
  lead,
  leads,
  onClose,
  onOpenLead,
}: {
  lead: Lead;
  leads: Lead[];
  onClose: () => void;
  onOpenLead: (id: string) => void;
}) {
  const update = useUpdateLead();
  const addNote = useAddNote();
  const del = useDeleteLead();
  const { data: notes } = useLeadNotes(lead.id);
  const [tab, setTab] = useState<Tab>("resumen");
  const [noteBody, setNoteBody] = useState("");
  const [value, setValue] = useState("");

  // A different lead means a different sheet: start at the top, and take its
  // own numbers instead of keeping the previous one's in the boxes.
  useEffect(() => {
    setTab("resumen");
    setNoteBody("");
    setValue(lead.value_usd?.toString() ?? lead.estimate_usd?.toString() ?? "");
  }, [lead.id, lead.value_usd, lead.estimate_usd]);

  const events: TimelineEvent[] = useMemo(() => buildTimeline(lead, notes ?? []), [lead, notes]);

  const wa = leadWhatsApp(lead);
  const mail = leadMailto(lead);
  const ig = leadInstagram(lead);

  const setStage = (status: LeadStatus) =>
    update.mutate({ id: lead.id, patch: { status } }, { onError: (e) => toast.error(String(e)) });

  const saveValue = () => {
    const n = Number(value.replace(/[^\d.]/g, ""));
    update.mutate({ id: lead.id, patch: { value_usd: Number.isFinite(n) && n > 0 ? n : null } });
    toast.success("Valor guardado");
  };

  async function openQuote() {
    const url = await quoteLink(lead);
    if (!url) {
      toast.error("Este lead no tiene cotización guardada.");
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  const icon =
    "flex size-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-signal hover:text-signal";

  return (
    <section
      className="flex h-full min-h-0 flex-col border border-border bg-card"
      data-testid="lead-sheet"
      aria-label={`Ficha de ${lead.name}`}
    >
      {/* Cabecera */}
      <header className="flex shrink-0 flex-wrap items-start gap-3 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold tracking-tight">{lead.name}</h3>
            {lead.score && (
              <span
                className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${SCORE_TONE[lead.score]}`}
              >
                {SCORE_LABEL[lead.score]}
              </span>
            )}
          </div>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
            {lead.business || "—"}
            {lead.ref ? ` · ${lead.ref}` : ""}
            {lead.lang ? ` · ${lead.lang}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={icon}
              aria-label="WhatsApp"
            >
              <MessageCircle className="size-4" />
            </a>
          )}
          {ig && (
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              className={icon}
              aria-label="Instagram"
            >
              <Instagram className="size-4" />
            </a>
          )}
          {mail && (
            <a href={mail} className={icon} aria-label="Email">
              <Mail className="size-4" />
            </a>
          )}
          {lead.quote_path && (
            <button
              type="button"
              onClick={() => void openQuote()}
              className={icon}
              aria-label="Ver cotización"
            >
              <FileText className="size-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className={icon} aria-label="Cerrar ficha">
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* Las cuatro cifras que deciden si vale la pena llamar ahora */}
      <div className="grid shrink-0 grid-cols-2 border-b border-border sm:grid-cols-4">
        <Cell label="Cotizado" value={lead.estimate_usd ? money(lead.estimate_usd) : "—"} />
        <Cell
          label="Valor del trato"
          value={lead.value_usd ? money(lead.value_usd) : "—"}
          tone={lead.value_usd ? "text-signal" : ""}
        />
        <Cell label="Presupuesto" value={budgetLabel("es", lead.budget) || "—"} />
        <Cell
          label="Próxima acción"
          value={
            lead.next_action_at
              ? new Date(lead.next_action_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                })
              : "sin fecha"
          }
          tone={
            lead.next_action_at && new Date(lead.next_action_at) < new Date()
              ? "text-destructive"
              : ""
          }
        />
      </div>

      {/* Pestañas */}
      <nav
        className="flex shrink-0 gap-1 border-b border-border px-2"
        aria-label="Secciones del lead"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={tab === t}
            className={`-mb-px border-b-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
              tab === t
                ? "border-signal text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "resumen" && (
          <div className="space-y-6">
            <div>
              <p className="label-mono">Etapa</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={update.isPending}
                    onClick={() => setStage(s)}
                    aria-pressed={lead.status === s}
                    className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 ${
                      lead.status === s
                        ? "border-signal bg-signal text-signal-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {STAGE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-mono" htmlFor="next-action">
                  Próximo seguimiento
                </label>
                <Input
                  id="next-action"
                  type="date"
                  className="mt-2"
                  value={lead.next_action_at ? lead.next_action_at.slice(0, 10) : ""}
                  onChange={(e) =>
                    update.mutate({
                      id: lead.id,
                      patch: {
                        next_action_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="label-mono" htmlFor="value">
                  Valor del trato (USD)
                </label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="value"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0"
                  />
                  <Button variant="outline" onClick={saveValue} disabled={update.isPending}>
                    Guardar
                  </Button>
                </div>
              </div>
            </div>

            <dl className="grid gap-1 border border-border p-3 font-mono text-xs sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd>{lead.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-all">{lead.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Instagram</dt>
                <dd>{lead.instagram ? `@${lead.instagram}` : "—"}</dd>
              </div>
            </dl>

            <p className="whitespace-pre-wrap text-sm leading-relaxed">{lead.problem}</p>

            {lead.brief && (
              <dl className="grid gap-2 border border-border p-4 text-sm sm:grid-cols-2">
                {(
                  [
                    ["Negocio", lead.brief.business],
                    ["Problema", lead.brief.problem],
                    ["Quiere", lead.brief.outcome],
                    ["Hoy", lead.brief.current],
                    ["Plazo", timelineLabel("es", lead.timeline || lead.brief.timeline || "")],
                    ["Presupuesto", budgetLabel("es", lead.budget || lead.brief.budget || "")],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {k}
                    </dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
                {lead.budget_fit && (
                  <div className="sm:col-span-2">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Encaje con el presupuesto
                    </dt>
                    <dd>{FIT_LABEL[lead.budget_fit] ?? lead.budget_fit}</dd>
                  </div>
                )}
              </dl>
            )}

            {(lead.goals?.length ?? 0) > 0 && (
              <div data-testid="lead-goals">
                <p className="label-mono">Objetivos</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {lead.goals.map((g) => (
                    <li key={g} className="border border-signal/40 bg-signal/10 px-2 py-1 text-xs">
                      {g === "other" && lead.goal_other ? lead.goal_other : goalLabel("es", g)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lead.chat_summary && (
              <div className="border-s-2 border-signal ps-4">
                <p className="label-mono">Resumen del asistente</p>
                <div className="mt-2 text-sm leading-relaxed">
                  <Rich text={lead.chat_summary} />
                </div>
              </div>
            )}

            {lead.modules.length > 0 && (
              <div>
                <p className="label-mono">Sistema cotizado en el sitio</p>
                <p className="mt-2 text-sm">
                  {lead.modules.map((m) => translate("es", `mod.${m}` as AnyKey)).join(" · ")}
                </p>
                {lead.estimate_usd != null && (
                  <p className="numeric mt-1 font-mono text-xs text-muted-foreground">
                    {money(lead.estimate_usd)}
                    {lead.weeks ? ` · ~${lead.weeks} semanas` : ""} · lo que vio el cliente
                  </p>
                )}
                {lead.quote_path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void openQuote()}
                    className="mt-2 font-mono text-[10px] uppercase tracking-widest"
                  >
                    <FileText className="me-1 size-4" /> Abrir la cotización que recibió
                  </Button>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (
                    !window.confirm(`¿Borrar el lead de ${lead.name}? Esto no se puede deshacer.`)
                  ) {
                    return;
                  }
                  del.mutate(lead.id, {
                    onSuccess: () => {
                      toast.success("Lead borrado");
                      onClose();
                    },
                    onError: (e) => toast.error(String(e)),
                  });
                }}
              >
                <Trash2 className="me-1 size-4" /> Borrar lead
              </Button>
            </div>
          </div>
        )}

        {tab === "conversaciones" && (
          <div className="space-y-6">
            <MeetingPanel lead={lead} />

            {lead.chat_transcript && lead.chat_transcript.length > 0 && (
              <details className="border border-border p-4" open>
                <summary className="label-mono cursor-pointer">
                  Chat del sitio ({lead.chat_transcript.length} mensajes)
                </summary>
                <ul className="mt-3 space-y-2">
                  {lead.chat_transcript.map((m, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {m.role === "user" ? "Cliente" : "Asistente"}
                      </span>
                      <div>
                        {m.role === "user" ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <Rich text={m.content} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {tab === "historial" && (
          <div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
            ) : (
              <div className="space-y-5" data-testid="lead-timeline">
                {byDay(events).map(([day, group]) => (
                  <div key={day} className="grid gap-2 sm:grid-cols-[4.5rem_1fr]">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {day}
                    </p>
                    <ul className="space-y-3 border-s border-border ps-4">
                      {group.map((e, i) => (
                        <li key={`${e.at}-${i}`} className="relative">
                          <span
                            className={`absolute -start-[21px] top-1.5 size-2 rounded-full ${DOT[e.kind]}`}
                            aria-hidden
                          />
                          <p className="text-sm">
                            {e.future && <span className="text-signal">◷ </span>}
                            {e.title}
                          </p>
                          {e.detail && (
                            <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                              {e.detail}
                            </p>
                          )}
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                            {new Date(e.at).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {e.source}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Textarea
                rows={2}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Qué se habló, qué quedó pendiente…"
              />
              <Button
                disabled={!noteBody.trim() || addNote.isPending}
                onClick={() =>
                  addNote.mutate(
                    { leadId: lead.id, body: noteBody },
                    {
                      onSuccess: () => setNoteBody(""),
                      onError: (e) => toast.error(String(e)),
                    },
                  )
                }
              >
                Añadir
              </Button>
            </div>
          </div>
        )}

        {tab === "copiloto" && <Copilot leads={leads} lead={lead} onOpenLead={onOpenLead} />}
      </div>
    </section>
  );
}
