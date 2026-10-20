import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Check, ChevronDown, Loader2, MessageCircle, RotateCcw, X } from "lucide-react";
import { askAgent, budgetLabel, requestBrief, timelineLabel, type ChatMessage } from "@/lib/agent";
import {
  BUDGETS,
  EMPTY_BRIEF,
  TIMELINES,
  TIMELINE_SPEED,
  isBriefReady,
  type BriefData,
  briefKey,
} from "@/lib/brief";
import { composeHandoff, quoteFor, saveLead } from "@/lib/leads";
import { signQuote, uploadQuote } from "@/lib/quote";
import { GOAL_IDS, cleanGoals, goalLabel, goalsText } from "@/lib/goals";
import { Rich } from "@/components/site/Rich";
import { getSession, useSession } from "@/lib/session";
import { useTranslation, type AnyKey } from "@/i18n";
import { ProjectCard, QuoteCard } from "@/components/site/BriefCards";
import {
  ContactFields,
  EMPTY_CONTACT,
  checkContact,
  type ContactValues,
} from "@/components/site/ContactFields";

/**
 * Ruah project assistant — a sales conversation with a fixed shape.
 *
 *   discovery ── six things become clear (live project card);
 *      │         timeline and budget are answered with buttons
 *      ▼
 *   conclusion ─ the assistant says back what it understood
 *      │         → only now: "Calculate my estimate"
 *      ▼
 *   estimate ─── priced from the one price list, read against the budget
 *      │         (over budget → a Phase 1 that fits), quote PDF emitted
 *      │         → only now: "Talk to a person"
 *      ▼
 *   contact ──── WhatsApp, email, Instagram, validated
 *      │         → lead saved to the CRM with everything, then WhatsApp
 *      ▼
 *   sent
 *
 * Nothing is priced before the project is clear, and nobody reaches John
 * without a scope and a number: that is what makes his first reply a
 * proposal instead of a round of questions.
 *
 * Escape hatch: if a conversation stalls (a limit is reached, or twelve
 * turns pass without the brief completing), "Talk to a person" appears
 * anyway — a visitor is never trapped with a bot. The navbar's WhatsApp link
 * also stays available throughout.
 */

const SUGGESTIONS: AnyKey[] = ["chat.s1", "chat.s2", "chat.s3", "chat.s4"];
const STALL_TURNS = 12;

type Entry = ChatMessage & { live?: boolean };

export function WhatsAppChat({ whatsapp, siteName }: { whatsapp: string; siteName: string }) {
  const { tr, dir, lang } = useTranslation();
  const reduced = useReducedMotion();
  const { session, patch } = useSession();

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [limited, setLimited] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState<ContactValues>(EMPTY_CONTACT);
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactValues, string>>>(
    {},
  );
  const [sending, setSending] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const brief = session.brief ?? EMPTY_BRIEF;
  const ready = isBriefReady(brief);
  const quoted = ready && session.planVersion > 0 && session.quotedFor === briefKey(brief);
  const userTurns = entries.filter((e) => e.role === "user").length;
  const stalled = !ready && (limited || userTurns >= STALL_TURNS);

  // The conversation survives closing the widget and moving between pages.
  useEffect(() => {
    if (session.conversation.length && entries.length === 0) {
      setEntries(session.conversation as Entry[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.conversation.length]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, busy, ready, quoted, contactOpen, session.leadSaved]);

  const plain = (list: Entry[]) => list.map(({ role, content }) => ({ role, content }));

  /** One discovery turn. `known` carries a button the visitor just pressed. */
  async function send(text: string, known: BriefData = brief) {
    const clean = text.trim();
    if (!clean || busy) return;

    const next: Entry[] = [...entries, { role: "user", content: clean }];
    setEntries(next);
    setInput("");
    setBusy(true);
    if (known !== brief) patch({ brief: known, ask: "none" });

    const turn = await askAgent(plain(next), lang, known, getSession().asking);
    const merged: Entry[] = [...next, { role: "assistant", content: turn.text, live: turn.live }];
    setEntries(merged);
    setBusy(false);
    if (turn.limited) setLimited(true);

    patch({
      conversation: plain(merged),
      brief: turn.brief,
      ask: turn.ask,
      asking: turn.asking,
      need: turn.brief.problem || getSession().need,
      business: turn.brief.business || getSession().business,
    });
  }

  /** Timeline / budget buttons: the value is exact, never parsed from text. */
  function choose(field: "timeline" | "budget", code: string) {
    const label = field === "timeline" ? timelineLabel(lang, code) : budgetLabel(lang, code);
    void send(label, { ...brief, [field]: code });
  }

  /** Goals are many at once: the visitor ticks them and confirms. */
  function confirmGoals() {
    const goals = cleanGoals(picked);
    if (!goals.length) return;
    const text = goalsText(lang, goals, otherGoal);
    if (!text.trim()) return;
    patch({ goals, goalOther: otherGoal.trim() });
    void send(text, { ...brief, outcome: text });
    setPicked([]);
    setOtherGoal("");
  }

  /**
   * Price the project. Offered only once the brief is complete, so the
   * summary describes a clear project and the quote reflects what was said —
   * including the deadline, which sets the pace.
   */
  async function buildEstimate() {
    setWorking(true);
    const b = await requestBrief(plain(entries), lang, brief, getSession().goals);
    const speed = TIMELINE_SPEED[brief.timeline as keyof typeof TIMELINE_SPEED] ?? b.speed;
    patch({
      summary: b.summary,
      modules: b.modules,
      speed,
      scale: b.scale,
      planVersion: getSession().planVersion + 1,
      quotedFor: briefKey(brief),
      pendingQuote: true,
    });
    setWorking(false);
  }

  /**
   * Save the lead, then hand off. The tab is opened inside the click (an
   * open() after an await is blocked as a popup) and pointed at WhatsApp once
   * the lead is stored — so John has it in the CRM even if the WhatsApp
   * message is never sent.
   */
  async function sendToJohn() {
    const { contact: c, errors } = checkContact(contact, tr);
    setContactErrors(errors);
    if (!c) return;
    const tab = window.open("about:blank", "_blank");
    setSending(true);
    patch({ name: c.name });

    // The quote goes with them: built, uploaded, and linked in the message.
    // None of this may block the hand-off, so every step can come back null.
    const file = await uploadQuote(getSession(), lang, siteName, whatsapp);
    const { error } = await saveLead(getSession(), c, lang, "chat", file?.path ?? null);
    if (error) console.error("lead insert failed", error);
    const quoteUrl = file ? await signQuote(getSession().ref, file.path) : null;

    const url = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
      composeHandoff(getSession(), c.name, lang, quoteUrl),
    )}`;
    patch({ leadSaved: true });
    setSending(false);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.href = url;
    }
  }

  function restart() {
    setEntries([]);
    setLimited(false);
    setContactOpen(false);
    patch({
      conversation: [],
      brief: { ...EMPTY_BRIEF },
      ask: "none",
      asking: "",
      summary: "",
      goals: [],
      goalOther: "",
      quotedFor: "",
      leadSaved: false,
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const quote = quoted ? quoteFor(session) : null;
  const primary =
    "flex w-full items-center justify-center gap-2 bg-signal px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-signal-foreground disabled:opacity-70";
  const secondary =
    "flex w-full items-center justify-center gap-2 border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-70";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={tr("chat.launcher")}
        className="fixed bottom-5 end-5 z-[70] flex items-center gap-2 rounded-full border border-signal/50 bg-background/90 px-4 py-3 shadow-lg backdrop-blur-xl transition-transform hover:scale-[1.03] md:bottom-7 md:end-7"
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        {open ? (
          <X className="size-5 text-signal" aria-hidden />
        ) : (
          <MessageCircle className="size-5 text-signal" aria-hidden />
        )}
        <span className="hidden font-mono text-xs uppercase tracking-widest sm:inline">
          {tr("chat.launcher")}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={tr("chat.launcher")}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 end-4 z-[70] flex max-h-[min(40rem,80vh)] w-[min(24rem,calc(100vw-2rem))] flex-col border border-border bg-card shadow-2xl md:bottom-24 md:end-7"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2 rounded-full bg-signal" aria-hidden />
              <p className="font-mono text-[11px] uppercase tracking-widest">{tr("chat.title")}</p>
              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={restart}
                  aria-label={tr("chat.restart")}
                  className="ms-auto text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                </button>
              )}
            </div>

            {/* Live project card: progress always visible, details on demand */}
            {entries.length > 0 && (
              <div className="shrink-0 border-b border-border px-3 py-2">
                <button
                  type="button"
                  onClick={() => setCardOpen((o) => !o)}
                  aria-expanded={cardOpen}
                  className="block w-full text-start"
                >
                  <ProjectCard brief={brief} compact={!cardOpen} />
                  <span className="mt-1 flex justify-center text-muted-foreground" aria-hidden>
                    <ChevronDown
                      className={`size-3 transition-transform ${cardOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
              </div>
            )}

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-sm leading-relaxed">{tr("chat.greeting")}</p>

              {entries.map((e, i) => (
                <div key={i} className={e.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                      e.role === "user"
                        ? "whitespace-pre-wrap bg-signal/12 text-foreground"
                        : "border-s-2 border-signal/50 bg-surface text-foreground"
                    }`}
                  >
                    {/* The visitor's own words stay verbatim; the assistant
                        writes Markdown, so it is rendered instead of shown. */}
                    {e.role === "user" ? e.content : <Rich text={e.content} />}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    {tr("chat.thinking")}
                  </span>
                </div>
              )}

              {/* Openers, only while the conversation is empty */}
              {entries.length === 0 && (
                <div className="grid gap-2 pt-1">
                  {SUGGESTIONS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => void send(tr(k))}
                      className="border border-border bg-surface px-3 py-2 text-start text-sm transition-colors hover:border-signal/50 hover:bg-surface-2"
                    >
                      {tr(k)}
                    </button>
                  ))}
                </div>
              )}

              {/* "What do you want to achieve": several answers at once */}
              {!busy && !ready && session.ask === "goals" && (
                <div className="space-y-2" data-testid="chips-goals">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {tr("goals.hint")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_IDS.map((id) => {
                      const on = picked.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setPicked((p) => (on ? p.filter((g) => g !== id) : [...p, id]))
                          }
                          className={`border px-3 py-1.5 text-xs transition-colors ${
                            on
                              ? "border-signal bg-signal/15 text-foreground"
                              : "border-border bg-surface text-muted-foreground hover:border-signal/60 hover:text-foreground"
                          }`}
                        >
                          {on ? "✓ " : ""}
                          {goalLabel(lang, id)}
                        </button>
                      );
                    })}
                  </div>
                  {picked.includes("other") && (
                    <input
                      value={otherGoal}
                      onChange={(e) => setOtherGoal(e.target.value)}
                      maxLength={200}
                      id="chat-goal-other"
                      placeholder={tr("goals.otherPlaceholder")}
                      className="w-full bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-signal"
                    />
                  )}
                  <button
                    type="button"
                    disabled={!picked.length}
                    onClick={confirmGoals}
                    className={`${primary} disabled:opacity-40`}
                  >
                    {tr("goals.done")}
                  </button>
                </div>
              )}

              {/* Fixed options for the two answers that must be exact */}
              {!busy && !ready && (session.ask === "timeline" || session.ask === "budget") && (
                <div className="flex flex-wrap gap-2" data-testid={`chips-${session.ask}`}>
                  {(session.ask === "timeline" ? TIMELINES : BUDGETS).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => choose(session.ask as "timeline" | "budget", code)}
                      className="border border-signal/40 bg-surface px-3 py-1.5 text-xs transition-colors hover:border-signal hover:bg-signal/10"
                    >
                      {session.ask === "timeline"
                        ? timelineLabel(lang, code)
                        : budgetLabel(lang, code)}
                    </button>
                  ))}
                </div>
              )}

              {!busy && entries.length > 0 && !ready && !stalled && (
                <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {tr("card.hint")}
                </p>
              )}

              {/* 1. Clear → estimate */}
              {!busy && ready && !quoted && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void buildEstimate()}
                  className={primary}
                >
                  {working && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                  {working ? tr("chat.working") : tr("chat.ctaEstimate")}
                </button>
              )}

              {/* 2. Estimate, read against the budget */}
              {quote && (
                <div className="space-y-2">
                  <QuoteCard quote={quote} />
                  <a
                    href="#builder"
                    onClick={() => setOpen(false)}
                    className="block text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {tr("quote.adjust")}
                  </a>
                </div>
              )}

              {/* 3. Only after the estimate (or if it stalls): a person */}
              {!busy && (quoted || stalled) && !contactOpen && !session.leadSaved && (
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className={quoted ? primary : secondary}
                >
                  {tr("chat.ctaHuman")}
                </button>
              )}

              {/* 4. Contact → lead saved → WhatsApp */}
              {contactOpen && !session.leadSaved && (
                <form
                  className="space-y-3 border border-border p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendToJohn();
                  }}
                  noValidate
                >
                  <p className="text-sm">{tr("chat.contactTitle")}</p>
                  <ContactFields
                    values={contact}
                    onChange={setContact}
                    errors={contactErrors}
                    idPrefix="chat-"
                    compact
                  />
                  <button type="submit" disabled={sending} className={primary}>
                    {sending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                    {tr("chat.sendJohn")}
                  </button>
                </form>
              )}

              {/* 5. Done */}
              {session.leadSaved && (
                <div
                  data-testid="chat-sent"
                  className="flex items-start gap-2 border border-signal/50 bg-signal/10 p-3 text-sm"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                  <p>{tr("chat.sent", { name: session.name.split(" ")[0] ?? "" })}</p>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={tr("chat.placeholder")}
                  aria-label={tr("chat.placeholder")}
                  maxLength={700}
                  className="max-h-28 min-h-[2.5rem] flex-1 resize-none bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-signal"
                />
                <button
                  type="button"
                  onClick={() => void send(input)}
                  disabled={!input.trim() || busy}
                  aria-label={tr("chat.send")}
                  className="flex size-9 shrink-0 items-center justify-center bg-signal text-signal-foreground transition-opacity disabled:opacity-35"
                >
                  <ArrowUp className={`size-4 ${dir === "rtl" ? "" : ""}`} aria-hidden />
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                {tr("chat.note")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
