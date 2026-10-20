import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useTranslation, type AnyKey } from "@/i18n";

const STEPS = [1, 2, 3, 4] as const;

/**
 * Process as a system that completes itself while you scroll.
 * One rail fills across the section and each step's node lights up as the
 * fill passes it. The rail is vertical on mobile and horizontal on desktop —
 * two separate elements so the axis swap stays declarative instead of
 * measured in JS. Under reduced motion everything renders already complete.
 */
export function ProcessTimeline() {
  const { tr } = useTranslation();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.4 });
  const fill = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <section id="process">
      <div className="mx-auto max-w-6xl px-5 sm:px-6" style={{ paddingBlock: "var(--section-y)" }}>
        <div className="md:max-w-[60%]">
          <p className="label-mono">{tr("process.eyebrow")}</p>
          <h2 className="display-lg mt-4 max-w-[20ch]">{tr("process.title")}</h2>
        </div>

        <div ref={ref} className="relative mt-10 md:mt-16">
          {/* Track */}
          <div
            aria-hidden
            className="absolute start-[7px] top-0 h-full w-px bg-border md:start-0 md:top-[7px] md:h-px md:w-full"
          />
          {/* Vertical fill (mobile) */}
          <motion.div
            aria-hidden
            className="absolute start-[7px] top-0 w-px bg-signal md:hidden"
            style={{ height: reduced ? "100%" : fill }}
          />
          {/* Horizontal fill (desktop) */}
          <motion.div
            aria-hidden
            className="absolute start-0 top-[7px] hidden h-px bg-signal md:block"
            style={{ width: reduced ? "100%" : fill }}
          />

          <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
            {STEPS.map((n, i) => (
              <Step
                key={n}
                n={n}
                threshold={i / STEPS.length}
                progress={progress}
                reduced={Boolean(reduced)}
                name={tr(`process.${n}name` as AnyKey)}
                body={tr(`process.${n}body` as AnyKey)}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** One step. Hooks live here so they are never called inside a loop. */
function Step({
  n,
  threshold,
  progress,
  reduced,
  name,
  body,
}: {
  n: number;
  threshold: number;
  progress: MotionValue<number>;
  reduced: boolean;
  name: string;
  body: string;
}) {
  const range: [number, number] = [threshold - 0.02, threshold + 0.02];
  const borderColor = useTransform(progress, range, ["var(--border)", "var(--signal)"]);
  const backgroundColor = useTransform(progress, range, ["var(--background)", "var(--signal)"]);

  return (
    <li className="relative ps-8 md:ps-0 md:pt-8">
      <motion.span
        aria-hidden
        className="absolute start-0 top-1 size-[15px] rounded-full border-2 md:top-0"
        style={
          reduced
            ? { borderColor: "var(--signal)", backgroundColor: "var(--signal)" }
            : { borderColor, backgroundColor }
        }
      />
      <span className="label-mono numeric text-signal">{`0${n}`}</span>
      <h3 className="display-md mt-3 text-lg md:text-xl">{name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </li>
  );
}
