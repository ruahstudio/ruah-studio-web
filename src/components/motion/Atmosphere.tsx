/** Subtle animated gradient mesh + film grain overlay for the hero. */
export function Atmosphere() {
  return (
    <>
      <div aria-hidden className="gradient-mesh pointer-events-none absolute inset-0 z-0" />
      <div aria-hidden className="grain-overlay pointer-events-none absolute inset-0 z-[1]" />
    </>
  );
}
