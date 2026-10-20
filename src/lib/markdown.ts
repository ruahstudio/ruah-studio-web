/**
 * The assistant writes Markdown. The chat renders it (components/site/Rich),
 * but WhatsApp, the PDF and the CRM need it flattened first — otherwise John
 * receives "**Negocio**: panadería" with the asterisks showing.
 */

const BOLD = /(\*\*|__)(.+?)\1/g;
const ITALIC = /(?<![*\w])(\*|_)(?!\s)(.+?)(?<!\s)\1(?![*\w])/g;
const CODE = /`([^`]+)`/g;
const HEADING = /^\s*#{1,6}\s+/gm;
const BULLET = /^\s*[-*]\s+/gm;
const RULE = /^\s*([-*_]\s*){3,}$/gm;

/** Markdown out, readable text in. Used by the PDF and the CRM. */
export function plainText(s: string): string {
  return s
    .replace(RULE, "")
    .replace(HEADING, "")
    .replace(BOLD, "$2")
    .replace(ITALIC, "$2")
    .replace(CODE, "$1")
    .replace(BULLET, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** WhatsApp's own formatting: *bold* with one asterisk, _italic_, • bullets. */
export function waText(s: string): string {
  return s
    .replace(RULE, "")
    .replace(HEADING, "")
    .replace(BOLD, "*$2*")
    .replace(CODE, "$1")
    .replace(BULLET, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
