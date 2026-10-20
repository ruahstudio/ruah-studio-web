import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Fade + translateY reveal on viewport entry. Honors prefers-reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger delay in milliseconds. */
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
