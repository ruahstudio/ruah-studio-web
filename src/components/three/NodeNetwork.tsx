import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Edge = { a: THREE.Vector3; b: THREE.Vector3 };

const NODE_COLOR = new THREE.Color("#c8ff58");
const LINE_COLOR = new THREE.Color("#b6ff3a");

function buildNetwork(count: number, radius: number) {
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    // Fibonacci sphere for even distribution, jittered outward slightly.
    const k = i + 0.5;
    const phi = Math.acos(1 - (2 * k) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * k;
    const r = radius * (0.7 + Math.random() * 0.3);
    nodes.push(
      new THREE.Vector3(
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ),
    );
  }

  const edges: Edge[] = [];
  const positions: number[] = [];
  const maxDist = radius * 0.72;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      if (a.distanceTo(b) < maxDist) {
        edges.push({ a, b });
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
  }
  return { nodes, edges, lines: new Float32Array(positions) };
}

/** How many signal packets travel the network at once. */
const PULSE_COUNT = 10;

function Network({ count }: { count: number }) {
  // Read the resolved background once; the scene remounts on theme change.
  const fogColor = useMemo(() => {
    if (typeof window === "undefined") return "#0a0d14";
    return document.documentElement.classList.contains("dark") ? "#0a0d14" : "#fbfbf9";
  }, []);
  const group = useRef<THREE.Group>(null);
  const nodeMesh = useRef<THREE.InstancedMesh>(null);
  const pulseMesh = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointer = useRef({ x: 0, y: 0 });

  const { nodes, edges, lines } = useMemo(() => buildNetwork(count, 3.1), [count]);

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(lines, 3));
    return g;
  }, [lines]);

  // Each pulse rides one edge at its own speed and offset.
  const pulses = useMemo(
    () =>
      Array.from({ length: PULSE_COUNT }, () => ({
        edge: Math.floor(Math.random() * Math.max(edges.length, 1)),
        t: Math.random(),
        speed: 0.14 + Math.random() * 0.22,
      })),
    [edges.length],
  );

  // Static node placement — written once, not every frame.
  useEffect(() => {
    const mesh = nodeMesh.current;
    if (!mesh) return;
    nodes.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.75 + ((i * 37) % 10) / 20);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  // Release GPU memory when the hero unmounts.
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);

    // Damped pointer parallax — the system leans toward the cursor.
    pointer.current.x += ((state.pointer.y * viewport.height) / 40 - pointer.current.x) * dt * 2.2;
    pointer.current.y += ((state.pointer.x * viewport.width) / 40 - pointer.current.y) * dt * 2.2;

    g.rotation.y += dt * 0.085;
    g.rotation.x = pointer.current.x;
    g.rotation.z = pointer.current.y * 0.15;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.12;

    // Advance signal packets along their edges.
    const pm = pulseMesh.current;
    if (pm && edges.length > 0) {
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i]!;
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge = Math.floor(Math.random() * edges.length);
          p.speed = 0.14 + Math.random() * 0.22;
        }
        const e = edges[p.edge] ?? edges[0]!;
        dummy.position.lerpVectors(e.a, e.b, p.t);
        // Fade in and out at the ends so packets don't pop.
        dummy.scale.setScalar(0.6 + Math.sin(p.t * Math.PI) * 0.9);
        dummy.updateMatrix();
        pm.setMatrixAt(i, dummy.matrix);
      }
      pm.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* Depth cue: distant geometry dissolves into the page background. */}
      {/* Fog colour must match the page background or the sphere sits in a
          dark box on the light theme. */}
      <fog attach="fog" args={[fogColor, 6, 15]} />

      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.14} fog />
      </lineSegments>

      {/* One draw call for all nodes instead of one per node. */}
      <instancedMesh ref={nodeMesh} args={[undefined, undefined, nodes.length]}>
        <icosahedronGeometry args={[0.055, 1]} />
        <meshBasicMaterial color={NODE_COLOR} transparent opacity={0.8} wireframe fog />
      </instancedMesh>

      <instancedMesh ref={pulseMesh} args={[undefined, undefined, PULSE_COUNT]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshBasicMaterial color={NODE_COLOR} transparent opacity={0.95} />
      </instancedMesh>
    </group>
  );
}

/**
 * Wireframe node network for the hero background. Client-side only.
 * Nodes and pulses are instanced (3 draw calls total) and the render loop
 * stops entirely while the tab is hidden.
 */
export default function NodeNetwork({ count = 44 }: { count?: number }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 8], fov: 55 }}
      style={{ pointerEvents: "none" }}
      frameloop={active ? "always" : "never"}
    >
      <Network count={count} />
    </Canvas>
  );
}
