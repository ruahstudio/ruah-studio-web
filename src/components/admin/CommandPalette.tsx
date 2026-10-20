import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Lead } from "@/lib/crm";
import { STAGE_LABEL } from "@/lib/crm";

/**
 * ⌘K / Ctrl+K.
 *
 * With forty leads a list is fine; with four hundred, scrolling to find
 * "the bakery from Caracas" is the slowest thing in the CRM. This jumps
 * straight there by name, business, reference, phone or email, and carries
 * the handful of commands that are otherwise three clicks away.
 *
 * Entirely keyboard-driven: type, arrows, Enter. Escape closes.
 */

export type Command = { id: string; label: string; hint?: string; run: () => void };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CommandPalette({
  open,
  onClose,
  leads,
  commands,
  onOpenLead,
}: {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  commands: Command[];
  onOpenLead: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    // The dialog mounts on the same tick as the shortcut, so focus waits.
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [open]);

  const items: Command[] = useMemo(() => {
    const q = norm(query.trim());
    const leadItems = leads
      .filter((l) =>
        !q
          ? true
          : norm(
              [l.name, l.business, l.ref, l.phone ?? "", l.email ?? "", l.problem].join(" "),
            ).includes(q),
      )
      .slice(0, 8)
      .map((l) => ({
        id: `lead-${l.id}`,
        label: l.business ? `${l.name} — ${l.business}` : l.name,
        hint: `${STAGE_LABEL[l.status]}${l.ref ? ` · ${l.ref}` : ""}`,
        run: () => onOpenLead(l.id),
      }));
    const cmdItems = commands.filter((c) => (!q ? true : norm(c.label).includes(q)));
    return [...leadItems, ...cmdItems];
  }, [query, leads, commands, onOpenLead]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  if (!open) return null;

  const choose = (i: number) => {
    const item = items[i];
    if (!item) return;
    item.run();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-background/80 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar y comandos"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg border border-border bg-card shadow-2xl"
        data-testid="command-palette"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => (i + 1) % Math.max(1, items.length));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => (i - 1 + items.length) % Math.max(1, items.length));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(index);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Buscar un lead, o escribir un comando…"
            aria-label="Buscar"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">Nada coincide.</li>
          )}
          {items.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(i)}
                className={`flex w-full items-baseline gap-3 px-3 py-2 text-start text-sm transition-colors ${
                  i === index ? "bg-signal/12 text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.hint && (
                  <span className="ms-auto shrink-0 font-mono text-[10px] uppercase tracking-widest opacity-70">
                    {item.hint}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <p className="border-t border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ↑↓ moverse · ⏎ abrir · esc cerrar
        </p>
      </div>
    </div>
  );
}
