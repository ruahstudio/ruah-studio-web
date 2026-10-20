import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TECH_GROUPS, ICON_PATHS, WORDMARK_ONLY, type TechGroupId } from "@/lib/tech-icons";
import { useTranslation, type AnyKey } from "@/i18n";

/**
 * Stack grid. Every tile renders a real logo — no CDN, no fallbacks.
 *
 * Icons are bundled from the simple-icons package by
 * scripts/generate-tech-icons.mjs, which throws on an unknown slug. That is
 * what finally fixed the "some logos, some initials" inconsistency: a tech
 * without an icon can no longer reach this component.
 *
 * Marks are drawn as inline SVG with currentColor, so they inherit the theme
 * instead of needing a differently-tinted file per mode.
 */

/**
 * Group id -> translation key. Written out rather than built with a template
 * literal so TypeScript checks every group has a real key: adding a group to
 * the generator without translating it becomes a compile error instead of a
 * raw "stack.g.whatever" rendered on the page.
 */
const LABEL_KEYS: Record<TechGroupId, AnyKey> = {
  languages: "stack.g.languages",
  frontend: "stack.g.frontend",
  mobile: "stack.g.mobile",
  backend: "stack.g.backend",
  data: "stack.g.data",
  ai: "stack.g.ai",
  automation: "stack.g.automation",
  cloud: "stack.g.cloud",
  quality: "stack.g.quality",
  design: "stack.g.design",
};

function Mark({ slug }: { slug: string }) {
  const d = ICON_PATHS[slug];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden focusable="false">
      <path d={d} />
    </svg>
  );
}

export function TechStack() {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();
  const [active, setActive] = useState<TechGroupId>(TECH_GROUPS[0]!.id);
  const group = TECH_GROUPS.find((g) => g.id === active) ?? TECH_GROUPS[0]!;

  return (
    <section id="stack" className="border-y border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        <div className="max-w-[34ch]">
          <p className="label-mono">{tr("stack.eyebrow")}</p>
          <h2 className="display-lg mt-4">{tr("stack.title")}</h2>
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2 md:mt-12"
          role="tablist"
          aria-label={tr("stack.aria")}
        >
          {TECH_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={active === g.id}
              onClick={() => setActive(g.id)}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                active === g.id
                  ? "border-signal bg-signal text-signal-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr(LABEL_KEYS[g.id])}
            </button>
          ))}
        </div>

        <motion.ul
          key={group.id}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        >
          {group.items.map((t) => (
            <li
              key={`${group.id}-${t.name}`}
              className="group flex items-center gap-2.5 border border-border bg-surface px-3 py-2.5 text-foreground/85 transition-colors hover:border-signal/50 hover:bg-surface-2 hover:text-signal"
            >
              <span className="transition-transform duration-300 group-hover:scale-110">
                <Mark slug={t.slug} />
              </span>
              <span className="truncate font-mono text-xs">{t.name}</span>
            </li>
          ))}
        </motion.ul>

        {/*
         * Tools whose owners don't allow their mark to be redistributed, so
         * there is no logo to ship. Naming them is accurate and legal; a tile
         * with initials in a box just reads as a failed image load, which is
         * exactly what this section used to look like.
         */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="label-mono">{tr("stack.alsoUsing")}</p>
          <ul className="mt-3 flex flex-wrap gap-x-1.5 gap-y-2">
            {WORDMARK_ONLY.map((name, i) => (
              <li key={name} className="font-mono text-xs text-muted-foreground">
                {name}
                {i < WORDMARK_ONLY.length - 1 && (
                  <span className="ms-1.5 text-signal/40" aria-hidden>
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
