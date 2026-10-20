// Comprobaciones de quote-link, aparte para poder probarlas solas.

export const REF = /^RS-\d{6}-\d{4}$/;
/** 90 días: tiempo de sobra para cerrar un proyecto, y no para siempre. */
export const EXPIRES = 90 * 24 * 3600;
export const HOUR = 3600;

export function checkRequest(
  body: unknown,
): { ok: true; ref: string; path: string } | { ok: false } {
  if (typeof body !== "object" || body === null) return { ok: false };
  const b = body as Record<string, unknown>;
  const ref = typeof b.ref === "string" ? b.ref.trim().toUpperCase() : "";
  const path = typeof b.path === "string" ? b.path.trim() : "";
  if (!REF.test(ref)) return { ok: false };
  if (!path.startsWith(`leads/${ref}/`) || !path.endsWith(".pdf")) return { ok: false };
  if (path.includes("..") || path.length > 200) return { ok: false };
  return { ok: true, ref, path };
}

export const clientIp = (h: Headers) =>
  (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("cf-connecting-ip") || "unknown";

export async function hashed(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `quote:${Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}
