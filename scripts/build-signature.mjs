/**
 * Regenerates src/assets/signature-data.ts from src/assets/signature-pdf.png.
 *
 * The quote PDF stamps John's signature, and jsPDF needs the bytes inline —
 * it cannot fetch a bundled asset while building the document in the browser.
 * So the PNG lives beside the code as a data URI.
 *
 * Replace signature-pdf.png (ink on transparent, cropped tight) and run:
 *   node scripts/build-signature.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const png = resolve(here, "../src/assets/signature-pdf.png");
const out = resolve(here, "../src/assets/signature-data.ts");

const bytes = readFileSync(png);
const b64 = bytes.toString("base64");

// PNG header: width and height are big-endian uint32 at offsets 16 and 20.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);

writeFileSync(
  out,
  `/**
 * John's signature, as a data URI so jsPDF can stamp it without a fetch.
 *
 * Generated from src/assets/signature-pdf.png — the original signature
 * cropped to the ink, with the paper turned transparent so it can sit on the
 * document's own background instead of inside a white box.
 *
 * Regenerate with scripts/build-signature.mjs after replacing the PNG.
 */
export const SIGNATURE_PNG =
  "data:image/png;base64,${b64}";

/** Natural size of the image above, for keeping the aspect ratio. */
export const SIGNATURE_SIZE = { width: ${width}, height: ${height} } as const;
`,
  "utf8",
);

console.log(
  `signature-data.ts written — ${width}x${height}, ${Math.round(bytes.length / 1024)} kB`,
);
