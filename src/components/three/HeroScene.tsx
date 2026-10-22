import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";

const NodeNetwork = lazy(() => import("@/components/three/NodeNetwork"));

type Mode = "none" | "static" | "webgl";

/**
 * Falls back to the flat constellation if the 3D scene throws.
 *
 * `Suspense` only covers the lazy import; it does nothing when the component
 * itself fails to render — which is exactly what happens on a machine with no
 * working WebGL context, or a driver three.js refuses. The hero then had no
 * background at all, silently. Here the SVG takes over instead.
 */
class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn("hero scene unavailable, using the flat fallback", error);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** True when the browser can actually give three.js a context to draw into. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

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
  // No point downloading 600 kB of three.js for a context that can't exist.
  if (!hasWebGL()) return "static";

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
    // Sits in the hero's empty right-hand column on wide screens rather than
    // behind the headline: a structure you can actually see the shape of, and
    // type that nothing crosses. On narrow screens it goes back to full width
    // and low contrast, behind the text.
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-0 start-0 end-0 opacity-50 [mask-image:radial-gradient(62%_62%_at_50%_48%,black,transparent)] md:-top-[12%] md:bottom-[12%] md:start-auto md:w-[54%] md:opacity-95 lg:w-[48%]"
    >
      {mode === "static" ? (
        <StaticConstellation />
      ) : (
        <SceneBoundary fallback={<StaticConstellation />}>
          <Suspense fallback={<StaticConstellation />}>
            <NodeNetwork density={10} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}

/**
 * Zero-JavaScript stand-in: one inline SVG, animated with CSS only.
 *
 * It draws the same idea as the 3D lattice — rings around, meridians through,
 * a core in the middle — projected flat, so a phone and a desktop show the
 * same structure instead of two unrelated graphics. The old version was a
 * handful of hand-placed dots that matched nothing.
 */
function StaticConstellation() {
  const CX = 50;
  const CY = 50;
  // Latitudes projected onto an ellipse: the same tilt the 3D scene uses.
  const RINGS = [
    { rx: 17, ry: 5.2, cy: -21 },
    { rx: 27, ry: 8.2, cy: -10.6 },
    { rx: 31, ry: 9.4, cy: 0 },
    { rx: 27, ry: 8.2, cy: 10.6 },
    { rx: 17, ry: 5.2, cy: 21 },
  ];
  const PER_RING = [8, 12, 14, 12, 8];

  const points = RINGS.flatMap((ring, r) =>
    Array.from({ length: PER_RING[r]! }, (_, i) => {
      const a = (i / PER_RING[r]!) * Math.PI * 2 + (r % 2 ? Math.PI / PER_RING[r]! : 0);
      return {
        x: CX + ring.rx * Math.cos(a),
        y: CY + ring.cy + ring.ry * Math.sin(a),
        key: `${r}-${i}`,
        hub: (r * 7 + i) % 6 === 0,
      };
    }),
  );

  // Meridians: join each ring's node to the nearest one on the ring above.
  const meridians: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let offset = 0;
  for (let r = 0; r < RINGS.length - 1; r++) {
    const lower = points.slice(offset, offset + PER_RING[r]!);
    const upper = points.slice(offset + PER_RING[r]!, offset + PER_RING[r]! + PER_RING[r + 1]!);
    for (const a of lower) {
      let best = upper[0]!;
      let bestD = Infinity;
      for (const b of upper) {
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      meridians.push({ x1: a.x, y1: a.y, x2: best.x, y2: best.y });
    }
    offset += PER_RING[r]!;
  }

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="size-full">
      <g stroke="var(--signal)" fill="none" opacity="0.3">
        {RINGS.map((ring, i) => (
          <ellipse key={i} cx={CX} cy={CY + ring.cy} rx={ring.rx} ry={ring.ry} strokeWidth="0.18" />
        ))}
      </g>
      <g stroke="var(--signal)" strokeWidth="0.14" opacity="0.2">
        {meridians.map((m, i) => (
          <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} />
        ))}
      </g>
      {points.map((p, i) => (
        <circle
          key={p.key}
          cx={p.x}
          cy={p.y}
          r={p.hub ? 0.62 : 0.38}
          fill="var(--signal)"
          opacity="0.7"
        >
          <animate
            attributeName="opacity"
            values="0.3;0.85;0.3"
            dur={`${3.2 + (i % 5) * 0.6}s`}
            begin={`${(i % 9) * 0.26}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      {/* The core, matching the 3D scene. */}
      <circle cx={CX} cy={CY} r="4.2" fill="var(--signal)" opacity="0.06" />
      <circle cx={CX} cy={CY} r="1.5" fill="var(--signal)" opacity="0.45">
        <animate attributeName="r" values="1.4;1.9;1.4" dur="3.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
