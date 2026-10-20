import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, summary";

/** Dot cursor that grows over interactive elements. Pointer-devices only. */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.25 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.25 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as Element | null;
      setActive(Boolean(target?.closest?.(INTERACTIVE)));
    };
    const leave = () => {
      x.set(-100);
      y.set(-100);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[80] hidden sm:block"
    >
      <motion.span
        animate={{
          width: active ? 44 : 12,
          height: active ? 44 : 12,
          opacity: active ? 0.5 : 0.9,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="block -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal bg-signal/25 backdrop-blur-[1px]"
      />
    </motion.div>
  );
}
