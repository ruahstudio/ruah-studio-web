import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation, type AnyKey } from "@/i18n";

type NavItem = { key: AnyKey; hash: string };

const NAV_ITEMS: NavItem[] = [
  { key: "nav.pillars", hash: "pillars" },
  { key: "nav.weBuild", hash: "we-build" },
  { key: "nav.work", hash: "work" },
  { key: "nav.pricing", hash: "pricing" },
  { key: "nav.faq", hash: "faq" },
];

/**
 * A link to a section of the landing page, from anywhere in the app.
 *
 * On `/` it stays a plain fragment so the browser's native smooth scroll and
 * scroll-spy keep working. Off `/` it becomes a router navigation to the
 * landing page plus that hash, which is what makes the header usable from
 * /about instead of silently doing nothing.
 */
function SectionLink({
  hash,
  onLanding,
  className,
  onClick,
  label,
  children,
}: {
  hash: string;
  onLanding: boolean;
  className?: string;
  onClick?: () => void;
  label?: string;
  children: ReactNode;
}) {
  if (onLanding) {
    return (
      <a href={`#${hash}`} className={className} onClick={onClick} aria-label={label}>
        {children}
      </a>
    );
  }
  return (
    <Link to="/" hash={hash} className={className} onClick={onClick} aria-label={label}>
      {children}
    </Link>
  );
}

/**
 * Floating navbar. Condenses on scroll, exposes a fullscreen menu on mobile
 * (the previous header had no mobile navigation at all), and keeps focus
 * trapped while the menu is open.
 */
export function Navbar({ waHref, onStart }: { waHref: string; onStart: () => void }) {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();
  // Section links are fragments on the landing page but have to become real
  // routes anywhere else. Without this, every header link on /about resolved
  // to /about#pillars — a section that doesn't exist there — so the page was
  // a dead end with no way back.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onLanding = pathname === "/";
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll + wire Escape while the fullscreen menu is open.
  useEffect(() => {
    if (!open) return;
    // Copy the ref now; it may point elsewhere by cleanup time.
    const trigger = triggerRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div
          className={`pointer-events-auto mx-auto flex items-center justify-between gap-4 transition-all duration-500 ${
            condensed
              ? "my-2 max-w-5xl rounded-full border border-border/70 bg-background/80 px-4 py-2 backdrop-blur-xl sm:px-5"
              : "my-0 max-w-6xl border-b border-transparent px-5 py-5 sm:px-6"
          }`}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
          {/* The wordmark is the universal way home, so off the landing page it
              has to be a route, not a fragment. */}
          <SectionLink
            hash="top"
            onLanding={onLanding}
            className="flex items-center gap-2.5"
            label="Ruah Studio"
          >
            <span className="relative inline-flex size-2">
              <span className="absolute inset-0 rounded-full bg-signal" />
              {!reduced && (
                <span className="absolute inset-0 animate-ping rounded-full bg-signal opacity-60" />
              )}
            </span>
            <span className="font-display text-sm font-bold tracking-tight">RUAH STUDIO</span>
          </SectionLink>

          <nav className="hidden items-center gap-7 md:flex" aria-label={tr("nav.sections")}>
            {NAV_ITEMS.map((item) => (
              <SectionLink
                key={item.hash}
                hash={item.hash}
                onLanding={onLanding}
                className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {tr(item.key)}
              </SectionLink>
            ))}
            {/* About is its own page now, not an anchor on the landing. */}
            <Link
              to="/about"
              activeProps={{ className: "text-foreground" }}
              className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {tr("nav.about")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Button
              asChild
              size="sm"
              variant="outline"
              className="hidden font-mono text-xs uppercase tracking-widest lg:inline-flex"
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                {/* logical margin so it mirrors correctly in Arabic */}
                <MessageCircle className="me-1 size-4" aria-hidden /> WhatsApp
              </a>
            </Button>
            <Button
              size="sm"
              className="hidden font-mono text-[11px] uppercase tracking-widest md:inline-flex"
              onClick={onStart}
            >
              {tr("nav.start")}
            </Button>

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label={tr("nav.menu")}
              className="flex size-9 flex-col items-center justify-center gap-[5px] rounded-full border border-border/70 md:hidden"
            >
              <span className="h-px w-4 bg-foreground" />
              <span className="h-px w-4 bg-foreground" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden"
            initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduced ? 0.15 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-20" />

            <div className="relative flex items-center justify-between px-5 py-5">
              <SectionLink
                hash="top"
                onLanding={onLanding}
                onClick={() => setOpen(false)}
                className="font-display text-sm font-bold tracking-tight"
              >
                RUAH STUDIO
              </SectionLink>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-full border border-border/70"
                aria-label={tr("nav.close")}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <nav className="relative flex flex-1 flex-col justify-center px-5 pb-10">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.hash}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : 0.12 + i * 0.05, duration: 0.5 }}
                >
                  <SectionLink
                    hash={item.hash}
                    onLanding={onLanding}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 border-b border-border/50 py-4"
                  >
                    <span className="label-mono numeric w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="display-md transition-colors group-hover:text-signal">
                      {tr(item.key)}
                    </span>
                  </SectionLink>
                </motion.div>
              ))}
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 border-b border-border/50 py-4"
              >
                <span className="label-mono numeric w-6 shrink-0">
                  {String(NAV_ITEMS.length + 1).padStart(2, "0")}
                </span>
                <span className="display-md transition-colors group-hover:text-signal">
                  {tr("nav.about")}
                </span>
              </Link>
            </nav>

            <div className="relative space-y-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <Button
                className="w-full font-mono text-xs uppercase tracking-widest"
                onClick={() => {
                  setOpen(false);
                  onStart();
                }}
              >
                {tr("nav.start")}
              </Button>
              <div className="flex items-center gap-3">
                <Button asChild variant="outline" className="flex-1 font-mono text-xs uppercase">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="me-1 size-4" aria-hidden /> WhatsApp
                  </a>
                </Button>
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
