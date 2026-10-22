import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Command, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Copilot } from "@/components/admin/Copilot";
import { CommandPalette, type Command as Cmd } from "@/components/admin/CommandPalette";
import { LeadSheet } from "@/components/admin/LeadSheet";
import { recommendations, type Reco } from "@/lib/recommend";
import {
  OPEN_STAGES,
  STAGES,
  STAGE_LABEL,
  daysSince,
  isDue,
  isStale,
  useLeads,
  useUpdateLead,
  type Lead,
} from "@/lib/crm";
import type { LeadStatus } from "@/integrations/supabase/types";

/**
 * The CRM, as a working surface rather than a page.
 *
 * Left: every lead that matters right now, one dense row each, moved with the
 * keyboard. Right: the lead itself, in tabs. Between them, the two things a
 * one-person studio actually opens the CRM for — what to do next, and a
 * question about a client.
 *
 * It replaces a stacked layout where opening a lead pushed the list off
 * screen, so comparing two leads meant scrolling back and losing your place.
 *
 * Keyboard: ⌘K anywhere, "/" to search, j/k through the list, ⏎ to open,
 * Esc to close. Typing in a field never triggers any of it.
 */

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const SCORE_RANK = { hot: 0, warm: 1, cold: 2 } as const;
const SCORE_LABEL = { hot: "Caliente", warm: "Tibio", cold: "Frío" } as const;
const SCORE_TONE = {
  hot: "border-signal bg-signal text-signal-foreground",
  warm: "border-signal/50 text-foreground",
  cold: "border-border text-muted-foreground",
} as const;

function stageTone(stage: LeadStatus): string {
  if (stage === "ganado") return "border-signal bg-signal/10 text-foreground";
  if (stage === "perdido") return "border-border bg-surface text-muted-foreground line-through";
  return "border-border bg-surface text-muted-foreground";
}

/** Recommendations John chose not to act on, kept out of his way for a week. */
const SNOOZE_KEY = "ruah.crm.dismissed";
type Dismissed = Record<string, number>;

function readDismissed(): Dismissed {
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Dismissed) : {};
    const now = Date.now();
    return Object.fromEntries(Object.entries(parsed).filter(([, until]) => until > now));
  } catch {
    return {};
  }
}

/**
 * One figure in the pipeline readout.
 *
 * A stat that points at work to do is clickable and filters the list to it;
 * one that only reports is not a button, so nothing invites a dead click.
 */
function Stat({
  label,
  value,
  note,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "signal" | "warn" | undefined;
  onClick?: (() => void) | undefined;
}) {
  const valueTone =
    tone === "signal" ? "text-signal" : tone === "warn" ? "text-signal" : "text-foreground";
  const inner = (
    <>
      <dt className="label-mono text-[10px] text-muted-foreground">{label}</dt>
      <dd className={`numeric mt-1.5 font-display text-2xl font-bold tracking-tight ${valueTone}`}>
        {value}
      </dd>
      {note && <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{note}</p>}
    </>
  );

  if (!onClick) return <div className="bg-card px-4 py-3.5">{inner}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card px-4 py-3.5 text-start transition-colors hover:bg-surface-2"
    >
      {inner}
    </button>
  );
}

export function Crm() {
  const { data, isLoading, error } = useLeads();
  const update = useUpdateLead();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStatus | "todos" | "pendientes">("pendientes");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Dismissed>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setDismissed(readDismissed()), []);

  const leads = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => {
        if (stageFilter === "pendientes" && !OPEN_STAGES.includes(l.status)) return false;
        if (stageFilter !== "todos" && stageFilter !== "pendientes" && l.status !== stageFilter) {
          return false;
        }
        if (!q) return true;
        return [
          l.name,
          l.business,
          l.problem,
          l.email ?? "",
          l.phone ?? "",
          l.instagram ?? "",
          l.ref,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const ra = a.score ? SCORE_RANK[a.score] : 3;
        const rb = b.score ? SCORE_RANK[b.score] : 3;
        return ra - rb || b.created_at.localeCompare(a.created_at);
      });
  }, [leads, query, stageFilter]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const c = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<LeadStatus, number>;
    // A status the app doesn't know about must not turn the tally into NaN.
    for (const l of leads) if (l.status in c) c[l.status] += 1;
    return c;
  }, [leads]);

  /**
   * The numbers that decide what John does with the next hour.
   *
   * The header used to carry one line — lead count, pipeline, won — which
   * says how things have gone but not what needs doing. Overdue and unanswered
   * are the two that cost money today, so they are stated next to the money.
   *
   * `value_usd` is what John set after talking; `estimate_usd` is what the
   * site quoted. Falling back to the estimate means the pipeline figure isn't
   * zero just because nobody has typed a number in yet.
   */
  const stats = useMemo(() => {
    const open = leads.filter((l) => OPEN_STAGES.includes(l.status));
    const won = leads.filter((l) => l.status === "ganado");
    const closed = won.length + leads.filter((l) => l.status === "perdido").length;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const worth = (l: Lead) => l.value_usd ?? l.estimate_usd ?? 0;
    return {
      open: open.length,
      pipeline: open.reduce((s, l) => s + worth(l), 0),
      won: won.length,
      wonValue: won.reduce((s, l) => s + worth(l), 0),
      // Conversion is meaningless until something has actually closed.
      winRate: closed > 0 ? Math.round((won.length / closed) * 100) : null,
      thisWeek: leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo).length,
      due: open.filter(isDue).length,
      untouched: leads.filter((l) => l.status === "nuevo").length,
    };
  }, [leads]);

  const recos = useMemo(
    () =>
      recommendations(leads)
        .filter((r) => !dismissed[`${r.leadId}-${r.kind}`])
        .slice(0, 5),
    [leads, dismissed],
  );

  /**
   * Opens a lead from anywhere — a recommendation, the copilot, the palette —
   * widening the filter when the lead isn't in the current one.
   *
   * The cursor is set in an effect rather than here, because `filtered` still
   * holds the pre-widening list at this point: computing the index now meant
   * jumping to a lead left the keyboard cursor on whatever row happened to be
   * under it.
   */
  function open(id: string) {
    setSelectedId(id);
    if (!filtered.some((l) => l.id === id)) setStageFilter("todos");
  }

  // Keep the keyboard cursor on the open lead once the list has settled.
  useEffect(() => {
    if (!selectedId) return;
    const i = filtered.findIndex((l) => l.id === selectedId);
    if (i >= 0) setCursor(i);
  }, [selectedId, filtered]);

  function dismiss(r: Reco) {
    const next = { ...readDismissed(), [`${r.leadId}-${r.kind}`]: Date.now() + 7 * 86400000 };
    window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
    setDismissed(next);
  }

  function snooze(r: Reco, days: number) {
    update.mutate(
      {
        id: r.leadId,
        patch: { next_action_at: new Date(Date.now() + days * 86400000).toISOString() },
      },
      { onSuccess: () => toast.success(`Pospuesto ${days} días`) },
    );
  }

  // Shortcuts. Anything typed into a field belongs to that field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el?.isContentEditable === true;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && !paletteOpen) {
        if (typing) return;
        setSelectedId(null);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(filtered.length - 1, c + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter") {
        const lead = filtered[cursor];
        if (lead) {
          e.preventDefault();
          setSelectedId(lead.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, cursor, paletteOpen]);

  // Keep the highlighted row visible while moving with j/k.
  useEffect(() => {
    listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const commands: Cmd[] = useMemo(
    () => [
      { id: "f-pend", label: "Ver pendientes", run: () => setStageFilter("pendientes") },
      { id: "f-all", label: "Ver todos los leads", run: () => setStageFilter("todos") },
      ...STAGES.map((s) => ({
        id: `f-${s}`,
        label: `Filtrar: ${STAGE_LABEL[s]}`,
        run: () => setStageFilter(s),
      })),
      { id: "close", label: "Cerrar la ficha abierta", run: () => setSelectedId(null) },
    ],
    [],
  );

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </p>
    );
  }

  if (error) {
    return (
      <div className="border border-destructive/40 bg-destructive/5 p-6">
        <p className="font-display text-base font-semibold">No se pudieron cargar los leads</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa que las migraciones del CRM estén aplicadas en Supabase.
        </p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">{String(error)}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera: el estado del negocio */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length} lead{leads.length === 1 ? "" : "s"} en total
            {stats.thisWeek > 0 && ` · ${stats.thisWeek} esta semana`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 border border-border bg-surface px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-signal/60 hover:text-foreground"
        >
          <Command className="size-3.5" aria-hidden /> Buscar · ⌘K
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="En juego" value={money(stats.pipeline)} note={`${stats.open} abiertos`} />
        <Stat
          label="Ganado"
          value={money(stats.wonValue)}
          note={`${stats.won} cerrado${stats.won === 1 ? "" : "s"}`}
          tone="signal"
        />
        <Stat
          label="Conversión"
          value={stats.winRate === null ? "—" : `${stats.winRate}%`}
          note={stats.winRate === null ? "nada cerrado aún" : "de los cerrados"}
        />
        <Stat
          label="Sin tocar"
          value={String(stats.untouched)}
          note="en Nuevo"
          tone={stats.untouched > 0 ? "warn" : undefined}
          onClick={stats.untouched > 0 ? () => setStageFilter("nuevo") : undefined}
        />
        <Stat
          label="Vencidos"
          value={String(stats.due)}
          note="seguimiento pasado"
          tone={stats.due > 0 ? "warn" : undefined}
          onClick={stats.due > 0 ? () => setStageFilter("pendientes") : undefined}
        />
      </dl>

      {/* Qué hacer ahora */}
      {recos.length > 0 && (
        <section
          className="mt-5 border border-signal/40 bg-signal/5 p-4"
          data-testid="crm-recommendations"
        >
          <p className="label-mono">Qué hacer ahora</p>
          <ul className="mt-3 space-y-2">
            {recos.map((r) => (
              <li
                key={`${r.leadId}-${r.kind}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border border-border bg-card px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => open(r.leadId)}
                  className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1 text-start"
                >
                  <span className="text-sm font-semibold">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.why}</span>
                  <span className="ms-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-signal">
                    {r.action} →
                  </span>
                </button>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => snooze(r, 3)}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Posponer
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(r)}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Ignorar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!selected && <Copilot leads={leads} onOpenLead={open} />}

      {/* Lista + ficha */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…  (/)"
              aria-label="Buscar leads"
              className="ps-9"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ["pendientes", "Pendientes", OPEN_STAGES.reduce((n, s) => n + counts[s], 0)],
                ...STAGES.map((s) => [s, STAGE_LABEL[s], counts[s]] as const),
                ["todos", "Todos", leads.length],
              ] as [LeadStatus | "todos" | "pendientes", string, number][]
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStageFilter(value)}
                aria-pressed={stageFilter === value}
                className={`flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  stageFilter === value
                    ? "border-signal bg-signal text-signal-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                <span className="numeric opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {leads.length === 0
                ? "Todavía no hay leads. El sitio los escribe aquí solo."
                : "Ningún lead coincide con este filtro."}
            </p>
          ) : (
            <ul
              ref={listRef}
              className="mt-3 max-h-[70vh] divide-y divide-border overflow-y-auto border border-border"
            >
              {filtered.map((lead, i) => {
                const due = isDue(lead);
                const stale = isStale(lead);
                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(lead.id);
                        setCursor(i);
                      }}
                      aria-current={selectedId === lead.id}
                      className={`block w-full px-3 py-2.5 text-start transition-colors ${
                        selectedId === lead.id
                          ? "bg-signal/12"
                          : i === cursor
                            ? "bg-surface-2"
                            : "hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold">{lead.name}</span>
                        {lead.score && (
                          <span
                            className={`shrink-0 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${SCORE_TONE[lead.score]}`}
                          >
                            {SCORE_LABEL[lead.score]}
                          </span>
                        )}
                        <span className="numeric ms-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {lead.business || "—"}
                        {lead.estimate_usd ? ` · ${money(lead.estimate_usd)}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${stageTone(lead.status)}`}
                        >
                          {STAGE_LABEL[lead.status]}
                        </span>
                        {due && (
                          <span className="flex items-center gap-1 border border-signal px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal">
                            <CalendarClock className="size-3" /> vencido
                          </span>
                        )}
                        {!due && stale && (
                          <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                            <AlertTriangle className="size-3" /> {daysSince(lead.updated_at)}d
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            j/k moverse · ⏎ abrir · esc cerrar
          </p>
        </div>

        <div className="min-h-[24rem]">
          {selected ? (
            <LeadSheet
              lead={selected}
              leads={leads}
              onClose={() => setSelectedId(null)}
              onOpenLead={open}
            />
          ) : (
            /* With nothing open this pane used to be an empty dashed box with
               a sentence in it. The funnel is the one view the list can't
               give: where the leads are piled up, and where they stop. */
            <div className="border border-dashed border-border p-6 sm:p-8">
              <p className="label-mono">Embudo</p>
              <ul className="mt-5 space-y-2.5">
                {STAGES.map((s) => {
                  const n = counts[s];
                  const share = leads.length ? (n / leads.length) * 100 : 0;
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => n > 0 && setStageFilter(s)}
                        disabled={n === 0}
                        className="block w-full text-start disabled:cursor-default"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span
                            className={`text-sm ${n === 0 ? "text-muted-foreground/50" : "text-foreground"}`}
                          >
                            {STAGE_LABEL[s]}
                          </span>
                          <span className="numeric font-mono text-xs text-muted-foreground">
                            {n}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full bg-surface-2">
                          <div
                            className={`h-full transition-[width] duration-500 ${
                              s === "perdido" ? "bg-border" : "bg-signal"
                            }`}
                            style={{
                              width: `${Math.max(share, n > 0 ? 3 : 0)}%`,
                              transitionTimingFunction: "var(--ease-out)",
                            }}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-7 max-w-sm text-sm text-muted-foreground">
                Elige un lead para ver su ficha: lo que pidió, lo que se habló, su historial y las
                preguntas que le puedes hacer al copiloto.
              </p>
            </div>
          )}
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        leads={leads}
        commands={commands}
        onOpenLead={open}
      />
    </div>
  );
}
