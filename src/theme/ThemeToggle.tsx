import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Sun/moon toggle. The icon swaps with a short rotate-and-fade so the
 * interaction reads as deliberate rather than a checkbox.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const reduced = useReducedMotion();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className={`relative flex size-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="size-4" aria-hidden />
          ) : (
            <Sun className="size-4" aria-hidden />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
