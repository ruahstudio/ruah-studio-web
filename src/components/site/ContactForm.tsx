import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation, type AnyKey } from "@/i18n";
import { budgetLabel, requestBrief, timelineLabel } from "@/lib/agent";
import {
  BUDGETS,
  TIMELINES,
  TIMELINE_SPEED,
  isBudget,
  isTimeline,
  type BriefData,
  briefKey,
} from "@/lib/brief";
import { validateName } from "@/lib/contact";
import { GOAL_IDS, cleanGoals, goalLabel, goalsText } from "@/lib/goals";
import { composeHandoff, quoteFor } from "@/lib/leads";
import { completeHandoff, openHandoffTab, waUrl } from "@/lib/handoff";
import { getSession, useSession } from "@/lib/session";
import { QuoteCard } from "@/components/site/BriefCards";
import {
  ContactFields,
  EMPTY_CONTACT,
  checkContact,
  type ContactValues,
} from "@/components/site/ContactFields";

/** The form's own fields. Contact details live in ContactFields. */
export type ContactForm = {
  name: string;
  business: string;
  /** The problem, in their words. */
  need: string;
  /** What they want to achieve: several fixed codes (see lib/goals.ts). */
  goals: string[];
  /** Their own words, when "other" is among the goals. */
  goalOther: string;
  /** The goals as one sentence — what the brief and the assistant read. */
  outcome: string;
  /** How they handle it today. */
  current: string;
  timeline: string;
  budget: string;
};

export const EMPTY_FORM: ContactForm = {
  name: "",
  business: "",
  need: "",
  goals: [],
  goalOther: "",
  outcome: "",
  current: "",
  timeline: "",
  budget: "",
};

type Step = 0 | 1 | 2 | 3 | 4;
const TOTAL_STEPS = 5;
const LAST_STEP = 4 as Step;
/** Below this, "what do you need" is a word, not a problem statement. */
const MIN_NEED = 12;

/**
 * The form runs the same sales process as the chat, as a sequence of pages:
 *
 *   0 who        name, business
 *   1 the need   problem, goal, how it's done today
 *   2 frame      deadline and budget — fixed options, both required
 *   3 conclusion what we understood + the estimate against the budget;
 *                the visitor confirms or corrects it
 *   4 contact    WhatsApp, email, Instagram → lead saved → WhatsApp
 *
 * Step 3 is the point of the whole thing: nobody sends a project to John
 * without first reading back, in one paragraph, what they're asking for and
 * what it costs. A vague request can't get through; a clear one arrives
 * already priced.
 *
 * It shares the session with the chat, so a visitor who started there finds
 * every step already filled in.
 */
export function ContactForm({
  form,
  setForm,
  whatsapp,
  siteName,
  needRef,
}: {
  form: ContactForm;
  setForm: React.Dispatch<React.SetStateAction<ContactForm>>;
  whatsapp: string;
  siteName: string;
  needRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const { tr, dir, lang } = useTranslation();
  const reduced = useReducedMotion();
  const { session, patch } = useSession();
  const [step, setStep] = useState<Step>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [contact, setContact] = useState<ContactValues>(EMPTY_CONTACT);
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactValues, string>>>(
    {},
  );
  const [concluding, setConcluding] = useState(false);
  const [sending, setSending] = useState(false);
  // Offered again on the confirmation: a popup blocker or a closed tab must
  // not be the end of the hand-off.
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const Next = dir === "rtl" ? ArrowLeft : ArrowRight;
  const Prev = dir === "rtl" ? ArrowRight : ArrowLeft;

  // Pick up whatever the chat already learned, without overwriting typing.
  useEffect(() => {
    const b = session.brief;
    setForm((f) => ({
      ...f,
      name: f.name || session.name,
      business: f.business || b.business,
      need: f.need || b.problem,
      goals: f.goals.length ? f.goals : session.goals,
      goalOther: f.goalOther || session.goalOther,
      outcome: f.outcome || b.outcome,
      current: f.current || b.current,
      timeline: f.timeline || b.timeline,
      budget: f.budget || b.budget,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.brief, session.name, session.goals]);

  // …and keep the shared brief current, so the chat sees the form's answers.
  useEffect(() => {
    const brief: BriefData = {
      problem: form.need.trim(),
      business: form.business.trim(),
      outcome: form.outcome.trim(),
      current: form.current.trim(),
      timeline: isTimeline(form.timeline) ? form.timeline : "",
      budget: isBudget(form.budget) ? form.budget : "",
    };
    patch({
      brief,
      goals: form.goals,
      goalOther: form.goalOther.trim(),
      name: form.name.trim() || getSession().name,
      need: brief.problem,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.need,
    form.business,
    form.outcome,
    form.current,
    form.timeline,
    form.budget,
    form.name,
    form.goals.join(","),
    form.goalOther,
  ]);

  /** Ticking a goal rewrites the one-sentence outcome the brief carries. */
  function toggleGoal(id: string) {
    setForm((f) => {
      const goals = cleanGoals(
        f.goals.includes(id) ? f.goals.filter((g) => g !== id) : [...f.goals, id],
      );
      return { ...f, goals, outcome: goalsText(lang, goals, f.goalOther) };
    });
  }
  function setGoalOther(v: string) {
    setForm((f) => ({ ...f, goalOther: v, outcome: goalsText(lang, f.goals, v) }));
  }

  function errorsFor(s: Step): Partial<Record<keyof ContactForm, string>> {
    const e: Partial<Record<keyof ContactForm, string>> = {};
    if (s === 0) {
      if (!validateName(form.name)) e.name = tr("form.errName");
      if (!form.business.trim()) e.business = tr("form.errBusiness");
    }
    if (s === 1) {
      if (form.need.trim().length < MIN_NEED) e.need = tr("form.errNeed");
      if (!form.outcome.trim()) e.outcome = tr("form.errGoal");
      if (!form.current.trim()) e.current = tr("form.errCurrent");
    }
    if (s === 2) {
      if (!isTimeline(form.timeline)) e.timeline = tr("form.errTimeline");
      if (!isBudget(form.budget)) e.budget = tr("form.errBudget");
    }
    return e;
  }

  function validateStep(s: Step): boolean {
    const e = errorsFor(s);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /**
   * Build the conclusion: the assistant's summary of the answers (or the
   * free local version), a plan ordered by priority, and the estimate. The
   * deadline sets the pace; the quote PDF is emitted by the configurator.
   */
  async function conclude() {
    setConcluding(true);
    const s = getSession();
    const answers = [
      `${tr("card.business")}: ${form.business}`,
      `${tr("card.problem")}: ${form.need}`,
      `${tr("card.outcome")}: ${form.outcome}`,
      `${tr("card.current")}: ${form.current}`,
      `${tr("card.timeline")}: ${timelineLabel(lang, form.timeline)}`,
      `${tr("card.budget")}: ${budgetLabel(lang, form.budget)}`,
    ].join("\n");
    const messages = [...s.conversation, { role: "user" as const, content: answers }];
    const b = await requestBrief(messages, lang, s.brief, form.goals);
    patch({
      summary: b.summary,
      modules: b.modules,
      speed: TIMELINE_SPEED[form.timeline as keyof typeof TIMELINE_SPEED] ?? b.speed,
      scale: b.scale,
      planVersion: getSession().planVersion + 1,
      quotedFor: briefKey(getSession().brief),
      pendingQuote: true,
    });
    setConcluding(false);
  }

  function advance() {
    if (!validateStep(step)) return;
    const next = Math.min(LAST_STEP, step + 1) as Step;
    setStep(next);
    if (next === 3) void conclude();
  }

  /**
   * The only submit path. Enter or any stray submit before the last step just
   * advances; the final send re-checks every step and jumps back to the
   * first one that fails.
   */
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < LAST_STEP) {
      advance();
      return;
    }
    for (const s of [0, 1, 2] as Step[]) {
      if (Object.keys(errorsFor(s)).length) {
        setStep(s);
        validateStep(s);
        return;
      }
    }
    void send();
  }

  async function send() {
    const { contact: c, errors: ce } = checkContact({ ...contact, name: form.name }, tr);
    setContactErrors(ce);
    if (!c) return;

    // Opened inside the submit (a window.open() after an await is a blocked
    // popup), already pointing at a page that can reach WhatsApp on its own.
    const tab = openHandoffTab(
      waUrl(whatsapp, composeHandoff(getSession(), c.name, lang, null)),
      lang,
    );
    setSending(true);

    try {
      const { url } = await completeHandoff({
        tab,
        contact: c,
        lang,
        channel: "form",
        siteName,
        whatsapp,
      });
      setSentUrl(url);
    } finally {
      patch({ leadSaved: true, name: c.name });
      setSending(false);
    }
  }

  if (session.leadSaved) {
    return (
      <div
        data-testid="form-sent"
        className="flex flex-col items-start justify-center border border-signal/40 bg-surface p-8 sm:p-10"
      >
        <span className="flex size-11 items-center justify-center rounded-full border border-signal bg-signal/10">
          <Check className="size-5 text-signal" aria-hidden />
        </span>
        <p className="display-md mt-6">
          {tr("chat.sent", { name: (session.name || form.name).split(" ")[0] ?? "" })}
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {tr("wa.ref")}: {session.ref}
        </p>
        {sentUrl && (
          <a
            href={sentUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="form-wa-fallback"
            className="mt-6 font-mono text-[11px] uppercase tracking-widest text-signal underline-offset-4 hover:underline"
          >
            {tr("wa.fallback")}
          </a>
        )}
      </div>
    );
  }

  const quote = step >= 3 && !concluding && session.planVersion > 0 ? quoteFor(session) : null;
  const chip = (active: boolean) =>
    `border px-3 py-2 text-xs transition-colors ${
      active
        ? "border-signal bg-signal/10 text-foreground"
        : "border-border bg-surface text-muted-foreground hover:text-foreground"
    }`;

  return (
    <form
      className="border border-border bg-card p-6 sm:p-8"
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        // Enter in a single-line field moves on; textareas keep their newline.
        const t = e.target as HTMLElement;
        if (e.key === "Enter" && t.tagName === "INPUT" && step < LAST_STEP) {
          e.preventDefault();
          advance();
        }
      }}
      noValidate
    >
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="label-mono numeric">
          {String(step + 1).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
        </span>
        <span className="flex flex-1 gap-1" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <motion.span
              key={i}
              className="h-0.5 flex-1 rounded-full"
              animate={{
                backgroundColor:
                  i <= step
                    ? "var(--signal)"
                    : "color-mix(in oklch, var(--border) 90%, transparent)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </span>
      </div>

      <p ref={liveRef} aria-live="polite" className="sr-only">
        {`${step + 1} / ${TOTAL_STEPS}`}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -18 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 grid gap-5"
        >
          {step === 0 && (
            <>
              <Field
                id="name"
                label={tr("form.name")}
                required
                autoComplete="name"
                value={form.name}
                error={errors.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder={tr("form.namePlaceholder")}
              />
              <Field
                id="business"
                label={tr("form.business")}
                required
                value={form.business}
                error={errors.business}
                onChange={(v) => setForm((f) => ({ ...f, business: v }))}
                placeholder={tr("form.businessPlaceholder")}
              />
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-2">
                <label className="label-mono" htmlFor="need">
                  {tr("form.need")} *
                </label>
                <Textarea
                  id="need"
                  ref={needRef}
                  rows={4}
                  maxLength={1200}
                  aria-invalid={Boolean(errors.need)}
                  aria-describedby={errors.need ? "need-error" : undefined}
                  placeholder={tr("form.needPlaceholder")}
                  value={form.need}
                  onChange={(e) => setForm((f) => ({ ...f, need: e.target.value }))}
                />
                {errors.need && (
                  <p id="need-error" className="font-mono text-xs text-destructive">
                    {errors.need}
                  </p>
                )}
              </div>

              <fieldset
                className="grid gap-2"
                aria-describedby={errors.outcome ? "goal-error" : undefined}
              >
                <legend className="label-mono mb-2">{tr("form.goal")} *</legend>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {tr("goals.hint")}
                </p>
                <div className="flex flex-wrap gap-2" data-testid="form-goals">
                  {GOAL_IDS.map((id) => {
                    const on = form.goals.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleGoal(id)}
                        className={chip(on)}
                      >
                        {on ? "\u2713 " : ""}
                        {goalLabel(lang, id)}
                      </button>
                    );
                  })}
                </div>
                {form.goals.includes("other") && (
                  <Input
                    id="goal-other"
                    value={form.goalOther}
                    maxLength={200}
                    placeholder={tr("goals.otherPlaceholder")}
                    onChange={(e) => setGoalOther(e.target.value)}
                    className="mt-2"
                  />
                )}
                {/* An outcome carried over from the chat, in their own words */}
                {!form.goals.length && form.outcome && (
                  <p className="text-xs text-foreground">\u2713 {form.outcome}</p>
                )}
                {errors.outcome && (
                  <p id="goal-error" className="font-mono text-xs text-destructive">
                    {errors.outcome}
                  </p>
                )}
              </fieldset>

              <Field
                id="current"
                label={tr("form.current")}
                required
                value={form.current}
                error={errors.current}
                onChange={(v) => setForm((f) => ({ ...f, current: v }))}
                placeholder={tr("form.currentPlaceholder")}
              />
            </>
          )}

          {step === 2 && (
            <>
              <fieldset className="grid gap-2">
                <legend className="label-mono mb-2">{tr("form.timeline")} *</legend>
                <div className="flex flex-wrap gap-2">
                  {TIMELINES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={form.timeline === code}
                      onClick={() => setForm((f) => ({ ...f, timeline: code }))}
                      className={chip(form.timeline === code)}
                    >
                      {timelineLabel(lang, code)}
                    </button>
                  ))}
                </div>
                {errors.timeline && (
                  <p id="timeline-error" className="font-mono text-xs text-destructive">
                    {errors.timeline}
                  </p>
                )}
              </fieldset>
              <fieldset className="grid gap-2">
                <legend className="label-mono mb-2">{tr("form.budgetQ")} *</legend>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={form.budget === code}
                      onClick={() => setForm((f) => ({ ...f, budget: code }))}
                      className={`numeric ${chip(form.budget === code)}`}
                    >
                      {budgetLabel(lang, code)}
                    </button>
                  ))}
                </div>
                {errors.budget && (
                  <p id="budget-error" className="font-mono text-xs text-destructive">
                    {errors.budget}
                  </p>
                )}
              </fieldset>
            </>
          )}

          {step === 3 && (
            <div className="grid gap-4" data-testid="form-conclusion">
              <p className="display-md">{tr("form.conclusionTitle")}</p>
              {concluding ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> {tr("form.generating")}
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{tr("form.conclusionHint")}</p>
                  <Textarea
                    id="summary"
                    rows={6}
                    maxLength={2000}
                    value={session.summary}
                    onChange={(e) => patch({ summary: e.target.value })}
                    className="text-sm leading-relaxed"
                  />
                  {quote && <QuoteCard quote={quote} />}
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <>
              <p className="text-sm text-muted-foreground">{tr("chat.contactTitle")}</p>
              <ContactFields
                values={{ ...contact, name: form.name }}
                onChange={(v) => setContact(v)}
                errors={contactErrors}
                showName={false}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
            className="font-mono text-[11px] uppercase tracking-widest"
          >
            <Prev className="me-1 size-4" aria-hidden />
            {tr("form.back")}
          </Button>
        )}

        {/*
         * Distinct keys force React to create a new element instead of
         * mutating one button's `type` mid-click — that mutation is what
         * submitted the form from "Next". onSubmit guards it too.
         */}
        {step < LAST_STEP ? (
          <Button
            key="next"
            type="button"
            onClick={advance}
            disabled={step === 3 && concluding}
            className="ms-auto font-mono text-xs uppercase tracking-widest"
          >
            {tr("form.next")}
            <Next className="ms-1 size-4" aria-hidden />
          </Button>
        ) : (
          <Button
            key="send"
            type="submit"
            disabled={sending}
            className="ms-auto font-mono text-xs uppercase tracking-widest"
          >
            {sending && <Loader2 className="me-1 size-4 animate-spin" aria-hidden />}
            {tr("chat.sendJohn")}
          </Button>
        )}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{tr("form.privacy")}</p>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  autoComplete?: string | undefined;
}) {
  return (
    <div className="grid gap-2">
      <label className="label-mono" htmlFor={id}>
        {label} {required && "*"}
      </label>
      <Input
        id={id}
        autoComplete={autoComplete}
        maxLength={200}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p id={`${id}-error`} className="font-mono text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
