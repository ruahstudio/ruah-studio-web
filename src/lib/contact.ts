import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/mobile";

/**
 * Contact validation. Every function returns the value exactly as the CRM
 * will use it (a dialable E.164 number without "+", a lowercase address, a
 * bare handle) or an error code. Nothing half-valid is ever stored: a lead you
 * can't reach is worth nothing, and a typo'd email is a lead you can't reach.
 *
 * The same rules are enforced again by check constraints in the database,
 * because the form is public and a script can skip the browser.
 */

// ── Phone ────────────────────────────────────────────────────────────────

export type PhoneResult =
  | { ok: true; e164: string; digits: string; country: string | undefined; pretty: string }
  | { ok: false; error: "empty" | "invalid" | "not_mobile" };

/**
 * Validated as a MOBILE number with the full per-country numbering plan
 * (libphonenumber, mobile metadata). This is a WhatsApp business: a Caracas
 * landline (0212…) looks like a phone number but can't receive the chat, so
 * it's rejected with a message saying so, not accepted and discovered later.
 *
 * Local numbers are read as Venezuelan; anything written with +country is
 * read as that country.
 */
export function validatePhone(raw: string, defaultCountry: CountryCode = "VE"): PhoneResult {
  const v = raw.trim();
  if (!v) return { ok: false, error: "empty" };
  const n = parsePhoneNumberFromString(v, defaultCountry);
  if (!n) return { ok: false, error: "invalid" };
  if (!n.isValid()) {
    // Possible length but not a mobile range → it's most likely a landline.
    return { ok: false, error: n.isPossible() ? "not_mobile" : "invalid" };
  }
  return {
    ok: true,
    e164: n.number,
    digits: n.number.replace(/^\+/, ""),
    country: n.country,
    pretty: n.formatInternational(),
  };
}

/** Back-compat helper: dialable digits or null. */
export function normalizePhone(raw: string): string | null {
  const r = validatePhone(raw);
  return r.ok ? r.digits : null;
}

// ── Email ────────────────────────────────────────────────────────────────

/** Local part and domain with at least one dot and a 2+ letter TLD. */
const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;

/**
 * Throwaway inboxes. A lead that gives one of these is either testing the
 * form or doesn't want to be reached — either way not a lead.
 */
const DISPOSABLE = new Set([
  "mailinator.com",
  "yopmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
]);

/** The domains Venezuelan and LatAm visitors actually use, for typo hints. */
const COMMON = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "hotmail.es",
  "yahoo.es",
  "outlook.es",
  "protonmail.com",
];

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length]![b.length]!;
}

export type EmailResult =
  | { ok: true; email: string; suggestion: string | null }
  | { ok: false; error: "empty" | "invalid" | "disposable"; suggestion: string | null };

/**
 * Also returns a "did you mean" for near-misses of common providers
 * (gmial.com, hotmial.com, gmail.co). The suggestion doesn't block — it
 * offers a one-click fix, because gmail.co is a real domain someone could own.
 */
export function validateEmail(raw: string): EmailResult {
  const v = raw.trim().toLowerCase();
  if (!v) return { ok: false, error: "empty", suggestion: null };
  const at = v.lastIndexOf("@");
  const domain = at > 0 ? v.slice(at + 1) : "";
  let suggestion: string | null = null;
  if (domain && !domain.includes(".") && COMMON.includes(`${domain}.com`)) {
    // "maria@gmail" — the most common mobile slip: the .com never typed.
    suggestion = `${v.slice(0, at)}@${domain}.com`;
  } else if (domain && !COMMON.includes(domain)) {
    const best = COMMON.map((c) => [c, distance(domain, c)] as const).sort(
      (a, b) => a[1] - b[1],
    )[0]!;
    if (best[1] > 0 && best[1] <= 2) suggestion = `${v.slice(0, at)}@${best[0]}`;
  }
  if (!EMAIL.test(v) || v.includes("..")) return { ok: false, error: "invalid", suggestion };
  if (DISPOSABLE.has(domain)) return { ok: false, error: "disposable", suggestion: null };
  return { ok: true, email: v, suggestion };
}

export function normalizeEmail(raw: string): string | null {
  const r = validateEmail(raw);
  return r.ok ? r.email : null;
}

// ── Instagram ────────────────────────────────────────────────────────────

/**
 * Instagram's own rules: 1–30 chars of letters, digits, "." and "_"; can't
 * start or end with a period, no two periods in a row. Accepts "@handle",
 * "handle" or a profile URL, because people paste whichever they have.
 */
const IG = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{1,30}$/;

export type InstagramResult = { ok: true; handle: string | null } | { ok: false };

export function normalizeInstagram(raw: string): InstagramResult {
  let v = raw.trim();
  if (!v) return { ok: true, handle: null }; // optional
  const url = v.match(/instagram\.com\/([^/?#\s]+)/i);
  if (url) v = url[1]!;
  v = v.replace(/^@/, "").toLowerCase();
  // Reserved paths people paste by mistake from a post or reel link.
  if (["p", "reel", "reels", "stories", "explore", "accounts"].includes(v)) return { ok: false };
  return IG.test(v) ? { ok: true, handle: v } : { ok: false };
}

// ── Name ─────────────────────────────────────────────────────────────────

/** At least two letters, in any script; digits-only or symbol spam is rejected. */
export function validateName(raw: string): string | null {
  const v = raw.trim().replace(/\s+/g, " ");
  if (v.length < 2 || v.length > 80) return null;
  return /\p{L}.*\p{L}/u.test(v) && !/\d{3,}/.test(v) ? v : null;
}
