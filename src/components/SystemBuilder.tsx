import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, FileDown, MessageCircle } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useStudio, waLink } from "@/lib/cms";
import { composeWhatsAppMessage, useSession } from "@/lib/session";
import { generateProposalPdf } from "@/lib/proposal";
import { LAYERS, MODULES, SPEED, estimate, isModuleId } from "@/lib/pricing";
import { budgetFit } from "@/lib/brief";
import { budgetLabel, timelineLabel } from "@/lib/agent";
import { useTranslation } from "@/i18n";
import type { ExtraKey } from "@/i18n/extra";

/** Layer is a technical grouping label, kept in English like the stack chips. */

/** Smoothly counts to `value`; jumps straight there under reduced motion. */
function AnimatedPrice({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const raw = useMotionValue(value);
  const spring = useSpring(raw, { stiffness: 90, damping: 18, mass: 0.6 });
  const text = useTransform(spring, (v) => `$${Math.round(v).toLocaleString("en-US")}`);

  useEffect(() => {
    if (reduced) {
      spring.jump(value);
      raw.set(value);
    } else {
      raw.set(value);
    }
  }, [value, raw, spring, reduced]);

  return (
    <motion.span
      className="numeric block font-display text-4xl font-bold tracking-tight text-signal"
      dir="ltr"
    >
      {text}
    </motion.span>
  );
}

/**
 * Live system map. Selected modules orbit a central hub and connect to it,
 * so the estimate panel shows a system being assembled rather than a subtotal.
 * Pure SVG — no canvas, no extra dependency.
 */
function SystemMap({ ids, labels }: { ids: string[]; labels: (id: string) => string }) {
  const reduced = useReducedMotion();
  const R = 46;
  const cx = 70;
  const cy = 70;

  return (
    <svg viewBox="0 0 140 140" className="size-full" role="img" aria-hidden>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth="0.5" />
      {ids.map((id, i) => {
        const angle = (i / Math.max(ids.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * R;
        const y = cy + Math.sin(angle) * R;
        return (
          <g key={id}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--signal)"
              strokeWidth="0.6"
              opacity="0.35"
            />
            <motion.circle
              cx={x}
              cy={y}
              r="4"
              fill="var(--signal)"
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <title>{labels(id)}</title>
            </motion.circle>
          </g>
        );
      })}
      <circle
        cx={cx}
        cy={cy}
        r="11"
        fill="var(--surface-2)"
        stroke="var(--signal)"
        strokeWidth="0.8"
      />
      <text
        x={cx}
        y={cy + 2.5}
        textAnchor="middle"
        fill="var(--signal)"
        fontSize="6"
        fontFamily="var(--font-mono)"
      >
        {ids.length}
      </text>
    </svg>
  );
}

export function SystemBuilder() {
  const { t } = useStudio();
  const { tr, lang, dir } = useTranslation();

  const { session, patch } = useSession();

  // Seed from the session so someone who already talked to the assistant
  // doesn't land on a blank builder.
  const [selected, setSelected] = useState<string[]>(
    session.modules.length ? session.modules : ["dashboard", "automation"],
  );
  const [speed, setSpeed] = useState(session.speed ?? 0);
  const [scale, setScale] = useState<number[]>([session.scale ?? 2]);
  const [fromChat, setFromChat] = useState(false);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const { chosen, total, weeks } = useMemo(
    () => estimate(selected, speed, scale[0] ?? 2),
    [selected, speed, scale],
  );
  const label = (id: string) => tr(`mod.${id}` as ExtraKey);
  const hint = (id: string) => tr(`mod.${id}.hint` as ExtraKey);

  /** Complexity read from breadth of layers touched plus module count. */
  const complexity = useMemo(() => {
    const layers = new Set(chosen.map((m) => m.layer)).size;
    return Math.min(5, Math.max(chosen.length ? 1 : 0, Math.ceil(chosen.length / 2) + layers - 1));
  }, [chosen]);

  // Publish the estimate so the form, the WhatsApp handoff and the PDF all
  // describe the same system.
  useEffect(() => {
    patch({ modules: selected, estimate: total, weeks, speed, scale: scale[0] ?? 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(","), total, weeks, speed, scale[0]]);

  // A plan pushed by the chat ("build my estimate"). The builder is already
  // on the page when that happens, so its initial state is stale — this is
  // what makes the chat and the configurator one flow instead of two.
  useEffect(() => {
    if (!session.planVersion) return;
    setSelected(session.modules);
    setSpeed(session.speed);
    setScale([session.scale]);
    setFromChat(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.planVersion]);

  const speedKey = SPEED[speed]?.key ?? "standard";
  const speedLabel = tr(`speed.${speedKey}` as ExtraKey);
  const speedNote = tr(`speed.${speedKey}.note` as ExtraKey);
  const scaleLabel = tr(`scale.${scale[0] ?? 2}` as ExtraKey);

  const waMessage = composeWhatsAppMessage({
    session: { ...session, modules: selected, estimate: total, weeks },
    studio: t("site_name"),
    moduleNames: chosen.map((m) => label(m.id)),
    labels: {
      greeting: tr("wa.greeting"),
      summary: tr("wa.summary"),
      goal: tr("wa.goal"),
      budget: tr("wa.budget"),
      system: tr("wa.system"),
      estimate: tr("wa.estimate2"),
      weeks: tr("wa.weeks2"),
      ask: tr("wa.ask2"),
      ref: tr("wa.ref"),
    },
  });

  const downloadPdf = () =>
    generateProposalPdf({
      studio: t("site_name"),
      founder: t("founder"),
      email: t("email"),
      whatsapp: t("whatsapp"),
      items: chosen.map((m) => ({ label: label(m.id), description: hint(m.id), price: m.price })),
      total,
      weeks,
      speed: speedLabel,
      scale: scaleLabel,
      lang,
      // Stable for the whole visit: two downloads carry the same number.
      ref: session.ref,
      client: session.name || session.brief.business,
      summary: session.summary,
      budgetLabel: budgetLabel(lang, session.brief.budget),
      timelineLabel: timelineLabel(lang, session.brief.timeline),
      phases: (() => {
        // Priority order (as the chat set it), not catalogue order: phase 1
        // must be the same modules the chat and WhatsApp message quoted.
        const fit = budgetFit(
          selected.filter(isModuleId),
          speed,
          scale[0] ?? 2,
          session.brief.budget,
        );
        return fit.kind === "phased"
          ? {
              phase1: fit.phase1.map((id) => label(id)),
              phase1Total: fit.phase1Total,
              phase2: fit.phase2.map((id) => label(id)),
            }
          : undefined;
      })(),
    });

  // Emit the quote once the chat's plan has been applied. Waits for the
  // numbers to reflect that plan, so the PDF never shows the previous one.
  useEffect(() => {
    if (!session.pendingQuote || !fromChat || !chosen.length) return;
    if (selected.join(",") !== session.modules.join(",")) return;
    downloadPdf();
    patch({ pendingQuote: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.pendingQuote, fromChat, total]);

  return (
    /* Compact by design: the builder is a tool inside the page, not a dashboard
     that eats the viewport. Padding, type and spacing are all a step down. */
    <div className="mx-auto grid max-w-4xl gap-px border border-border lg:grid-cols-[1.5fr_0.9fr]">
      {/* ── BUILD SURFACE ─────────────────────────────── */}
      <div className="bg-card p-5 sm:p-6">
        <p className="label-mono">{tr("builder.step1")}</p>

        <div className="mt-5 space-y-5">
          {LAYERS.map((layer) => {
            const mods = MODULES.filter((m) => m.layer === layer);
            const activeInLayer = mods.filter((m) => selected.includes(m.id)).length;
            return (
              <fieldset key={layer}>
                <legend className="mb-3 flex w-full items-center gap-3">
                  <span className="label-mono text-[9px] text-signal">{layer}</span>
                  <span className="rule-fade flex-1" />
                  <span className="label-mono numeric text-[9px]">
                    {activeInLayer}/{mods.length}
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {mods.map((m) => {
                    const on = selected.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          toggle(m.id);
                          patch({ planTouched: true });
                        }}
                        aria-pressed={on}
                        className={`group relative flex flex-col gap-1 border p-2.5 text-start transition-all duration-300 ${
                          on
                            ? "border-signal/60 bg-signal/[0.07]"
                            : "border-border bg-surface hover:border-signal/30 hover:bg-surface-2"
                        }`}
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium leading-tight">
                            {label(m.id)}
                          </span>
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                              on ? "border-signal bg-signal" : "border-border"
                            }`}
                          >
                            {on && (
                              <Check className="size-3 text-signal-foreground" strokeWidth={3} />
                            )}
                          </span>
                        </span>
                        <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                          {hint(m.id)}
                        </span>
                        <span
                          className="numeric mt-1 font-mono text-[10px] text-muted-foreground/70"
                          dir="ltr"
                        >
                          +${m.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <p className="label-mono">{tr("builder.step2")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SPEED.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSpeed(i);
                    patch({ planTouched: true });
                  }}
                  aria-pressed={speed === i}
                  className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                    speed === i
                      ? "border-signal bg-signal text-signal-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tr(`speed.${s.key}` as ExtraKey)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{speedNote}</p>
          </div>
          <div>
            <p className="label-mono">{tr("builder.step3")}</p>
            <Slider
              className="mt-6"
              value={scale}
              onValueChange={(v) => {
                setScale(v);
                patch({ planTouched: true });
              }}
              min={1}
              max={4}
              step={1}
            />
            <p className="mt-3 text-xs text-muted-foreground">{scaleLabel}</p>
          </div>
        </div>
      </div>

      {/* ── ESTIMATE PANEL ────────────────────────────── */}
      <aside className="flex flex-col justify-between bg-surface p-5 sm:p-6">
        <div>
          {fromChat && (
            <p
              data-testid="from-chat"
              className="mb-4 border-s-2 border-signal ps-3 text-xs leading-relaxed text-muted-foreground"
            >
              {tr("builder.fromChat")}
            </p>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-mono">{tr("builder.estimate")}</p>
              <AnimatedPrice value={total} />
            </div>
            <div className="size-14 shrink-0 opacity-95">
              <SystemMap ids={selected} labels={label} />
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {chosen.length} {chosen.length === 1 ? tr("builder.module") : tr("builder.modules")} · ~
            {weeks} {weeks === 1 ? tr("builder.week") : tr("builder.weeks")} {tr("builder.ofBuild")}
          </p>

          {/* Complexity meter — segmented, no invented wording */}
          <div className="mt-4 flex items-center gap-3">
            <span className="label-mono text-[9px]">{tr("builder.complexity")}</span>
            <span className="flex flex-1 gap-1" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <motion.span
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  animate={{
                    backgroundColor:
                      i < complexity
                        ? "var(--signal)"
                        : "color-mix(in oklch, var(--border) 90%, transparent)",
                  }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                />
              ))}
            </span>
            <span className="numeric label-mono text-[9px]">{complexity}/5</span>
          </div>

          <ul className="mt-5 max-h-36 space-y-1.5 overflow-y-auto border-t border-border pt-4">
            {chosen.length === 0 && (
              <li className="text-sm text-muted-foreground">{tr("builder.empty")}</li>
            )}
            {chosen.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline justify-between gap-3 font-mono text-xs text-muted-foreground"
              >
                <span className="truncate">{label(m.id)}</span>
                <span className="numeric shrink-0" dir="ltr">
                  ${m.price}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-2.5">
          <Button asChild size="lg" className="w-full font-mono text-xs uppercase tracking-widest">
            <a href="#contact">
              {tr("builder.validate")}
              <ArrowRight
                className={`ms-1 size-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                aria-hidden
              />
            </a>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={!chosen.length}
              onClick={downloadPdf}
              className="font-mono text-[11px] uppercase tracking-widest"
            >
              <FileDown className="me-1 size-4" aria-hidden /> PDF
            </Button>
            <Button
              asChild={chosen.length > 0}
              variant="outline"
              disabled={!chosen.length}
              className="font-mono text-[11px] uppercase tracking-widest"
            >
              {chosen.length ? (
                <a
                  href={waLink(t("whatsapp"), waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="me-1 size-4" aria-hidden /> WhatsApp
                </a>
              ) : (
                <span>
                  <MessageCircle className="me-1 size-4" aria-hidden /> WhatsApp
                </span>
              )}
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {tr("builder.disclaimer")}
          </p>
        </div>
      </aside>
    </div>
  );
}
