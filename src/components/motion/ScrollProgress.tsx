import { motion, useScroll, useSpring } from "framer-motion";

/** Thin signal-colored scroll progress bar pinned to the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: width }}
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-signal/80"
    />
  );
}
