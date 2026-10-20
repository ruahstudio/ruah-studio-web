import { Suspense, lazy, useEffect, useState } from "react";

const NodeNetwork = lazy(() => import("@/components/three/NodeNetwork"));

type Mode = "none" | "static" | "webgl";

/**
 * Decides how much hero background the device should pay for.
 *
 * Three.js is roughly 600 kB of JavaScript. Loading it on a phone delayed
 * first paint noticeably even at a reduced node count, so mobile now gets a
 * pure-CSS constellation instead and never downloads the 3D bundle at all.
 * Data-saver mode and slow connections get the same treatment.
 */
function decide(): Mode {
  if (typeof window === "undefined") return "none";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "none";

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return "static";
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return "static";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return "static";
  if (window.matchMedia("(max-width: 900px)").matches) return "static";

  return "webgl";
}

export function HeroScene() {
  const [mode, setMode] = useState<Mode>("none");

  useEffect(() => {
    const chosen = decide();
    if (chosen === "none") return;
    if (chosen === "static") {
      setMode("static");
      return;
    }
    // Defer the heavy bundle until the browser is idle.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMode("webgl"))
      : window.setTimeout(() => setMode("webgl"), 500);
    return () => {
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      clearTimeout(idle as number);
    };
  }, []);

  if (mode === "none") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-70 [mask-image:radial-gradient(70%_60%_at_50%_45%,black,transparent)]"
    >
      {mode === "static" ? (
        <StaticConstellation />
      ) : (
        <Suspense fallback={<StaticConstellation />}>
          <NodeNetwork count={46} />
        </Suspense>
      )}
    </div>
  );
}

/** Zero-JavaScript stand-in: one inline SVG, animated with CSS only. */
function StaticConstellation() {
  const nodes = [
    [18, 26],
    [34, 14],
    [52, 30],
    [70, 18],
    [84, 34],
    [24, 52],
    [46, 46],
    [66, 58],
    [88, 54],
    [30, 76],
    [54, 70],
    [74, 82],
  ] as const;
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [0, 5],
    [2, 6],
    [4, 8],
    [5, 6],
    [6, 7],
    [7, 8],
    [5, 9],
    [6, 10],
    [7, 11],
    [9, 10],
    [10, 11],
  ] as const;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="size-full">
      <g stroke="var(--signal)" strokeWidth="0.15" opacity="0.28">
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a]![0]} y1={nodes[a]![1]} x2={nodes[b]![0]} y2={nodes[b]![1]} />
        ))}
      </g>
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.55" fill="var(--signal)" opacity="0.65">
          <animate
            attributeName="opacity"
            values="0.25;0.8;0.25"
            dur={`${3 + (i % 4)}s`}
            begin={`${i * 0.25}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
