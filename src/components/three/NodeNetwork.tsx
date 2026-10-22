import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The hero's background structure.
 *
 * The previous version scattered nodes on a jittered Fibonacci sphere and
 * joined every pair closer than a threshold. That produces a different random
 * tangle on every load — no silhouette, no repeating rhythm, denser in some
 * places than others — which is why it read as noise rather than as a system.
 *
 * This is a built lattice instead: latitude rings of evenly spaced nodes,
 * joined around each ring and up to the ring above. The shape is the same
 * every time, the spacing is regular, and the edges mean something — around,
 * and through. Signal packets run the meridians toward the core, which is the
 * one piece of motion that carries the idea: data arriving somewhere.
 */

/**
 * One palette per theme.
 *
 * The lattice used to be drawn in the dark theme's bright lime whatever the
 * background. On the light theme that is pale yellow-green on near-white: the
 * structure was technically there and effectively invisible. These match the
 * `--signal` token each theme actually resolves to.
 */
const PALETTE = {
  dark: { node: "#d2f06a", line: "#b6ff3a", fog: "#0a0d14" },
  light: { node: "#4e7000", line: "#6f9410", fog: "#fbfbf9" },
} as const;

type Ring = { y: number; radius: number; nodes: THREE.Vector3[] };
type Edge = { a: THREE.Vector3; b: THREE.Vector3 };

/** Latitudes, in degrees from the equator. Symmetric, so the form is balanced. */
const LATITUDES = [-62, -42, -21, 0, 21, 42, 62];

function buildLattice(density: number, radius: number) {
  const rings: Ring[] = LATITUDES.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const r = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);
    // Node count follows the circumference, so spacing stays even top to bottom.
    const n = Math.max(4, Math.round(density * Math.cos(rad)));
    const nodes = Array.from({ length: n }, (_, i) => {
      // Half-step offset on alternate rings: a brick bond rather than a grid,
      // which stops the meridians lining up into hard vertical bands.
      const offset = deg % 42 === 0 ? 0 : Math.PI / n;
      const a = (i / n) * Math.PI * 2 + offset;
      return new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
    });
    return { y, radius: r, nodes };
  });

  const nodes: THREE.Vector3[] = rings.flatMap((ring) => ring.nodes);
  const edges: Edge[] = [];
  const meridians: Edge[] = [];

  // Around each ring.
  for (const ring of rings) {
    for (let i = 0; i < ring.nodes.length; i++) {
      edges.push({ a: ring.nodes[i]!, b: ring.nodes[(i + 1) % ring.nodes.length]! });
    }
  }

  // Up to the next ring: each node joins its nearest neighbour above, so the
  // meridians stay continuous even where the two rings hold different counts.
  for (let r = 0; r < rings.length - 1; r++) {
    const lower = rings[r]!.nodes;
    const upper = rings[r + 1]!.nodes;
    for (const a of lower) {
      let best = upper[0]!;
      let bestD = Infinity;
      for (const b of upper) {
        const d = a.distanceToSquared(b);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      const edge = { a, b: best };
      edges.push(edge);
      meridians.push(edge);
    }
  }

  // Poles close the form; without them the top and bottom look cut off.
  const poles = [new THREE.Vector3(0, radius, 0), new THREE.Vector3(0, -radius, 0)];
  for (const pole of poles) {
    const ring = pole.y > 0 ? rings[rings.length - 1]! : rings[0]!;
    for (const node of ring.nodes) edges.push({ a: pole, b: node });
  }
  nodes.push(...poles);

  const positions = new Float32Array(edges.length * 6);
  edges.forEach((e, i) => {
    positions.set([e.a.x, e.a.y, e.a.z, e.b.x, e.b.y, e.b.z], i * 6);
  });

  return { nodes, edges, meridians, lines: positions };
}

/** How many signal packets run the lattice at once. */
const PULSE_COUNT = 12;

function Lattice({ density }: { density: number }) {
  // Read the resolved theme once; the scene remounts when it changes.
  const palette = useMemo(() => {
    if (typeof window === "undefined") return PALETTE.dark;
    return document.documentElement.classList.contains("dark") ? PALETTE.dark : PALETTE.light;
  }, []);
  const group = useRef<THREE.Group>(null);
  const nodeMesh = useRef<THREE.InstancedMesh>(null);
  const pulseMesh = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lean = useRef({ x: 0, z: 0 });

  const { nodes, meridians, lines } = useMemo(() => buildLattice(density, 3.05), [density]);

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(lines, 3));
    return g;
  }, [lines]);

  // Packets run the meridians — the "through" direction, toward the core.
  const pulses = useMemo(
    () =>
      Array.from({ length: PULSE_COUNT }, (_, i) => ({
        edge: Math.floor((i / PULSE_COUNT) * Math.max(meridians.length, 1)),
        t: i / PULSE_COUNT,
        speed: 0.3 + (i % 4) * 0.06,
      })),
    [meridians.length],
  );

  // Node placement is written once, not every frame.
  useEffect(() => {
    const mesh = nodeMesh.current;
    if (!mesh) return;
    nodes.forEach((pos, i) => {
      dummy.position.copy(pos);
      // A sixth of the nodes read as hubs. Deterministic, so the form is
      // identical on every load.
      dummy.scale.setScalar(i % 6 === 0 ? 1.55 : 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);

    // Damped pointer lean: the structure tips toward the cursor, it doesn't
    // chase it. Kept small — the subject of the hero is the headline.
    const targetX = (state.pointer.y * viewport.height) / 70;
    const targetZ = (state.pointer.x * viewport.width) / 150;
    lean.current.x += (targetX - lean.current.x) * dt * 2;
    lean.current.z += (targetZ - lean.current.z) * dt * 2;

    g.rotation.y += dt * 0.11;
    // The fixed tilt is what keeps the rings readable as rings instead of
    // collapsing into straight lines.
    g.rotation.x = -0.34 + lean.current.x;
    g.rotation.z = lean.current.z;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.1;

    if (coreRef.current) {
      const beat = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.14;
      coreRef.current.scale.setScalar(beat);
    }

    const pm = pulseMesh.current;
    if (pm && meridians.length > 0) {
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i]!;
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge = Math.floor(Math.random() * meridians.length);
        }
        const e = meridians[p.edge] ?? meridians[0]!;
        dummy.position.lerpVectors(e.a, e.b, p.t);
        // Fade in and out along the edge so packets don't pop at the ends.
        dummy.scale.setScalar(0.35 + Math.sin(p.t * Math.PI) * 1.05);
        dummy.updateMatrix();
        pm.setMatrixAt(i, dummy.matrix);
      }
      pm.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* Depth cue: the far side of the lattice dissolves into the page. */}
      <fog attach="fog" args={[palette.fog, 10, 19]} />

      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={palette.line} transparent opacity={0.38} fog />
      </lineSegments>

      {/* One draw call for every node. */}
      <instancedMesh ref={nodeMesh} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[0.034, 8, 8]} />
        <meshBasicMaterial color={palette.node} transparent opacity={1} fog />
      </instancedMesh>

      <instancedMesh ref={pulseMesh} args={[undefined, undefined, PULSE_COUNT]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshBasicMaterial color={palette.node} transparent opacity={0.95} />
      </instancedMesh>

      {/* The core the packets are heading for. */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={palette.node} transparent opacity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.44, 20, 20]} />
        <meshBasicMaterial color={palette.node} transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

/**
 * Wireframe lattice for the hero background. Client-side only.
 * Nodes, edges and packets are three draw calls in total, and the render loop
 * stops entirely while the tab is hidden.
 */
export default function NodeNetwork({ density = 11 }: { density?: number }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 10.5], fov: 55 }}
      style={{ pointerEvents: "none" }}
      frameloop={active ? "always" : "never"}
    >
      <Lattice density={density} />
    </Canvas>
  );
}
