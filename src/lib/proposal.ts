import { jsPDF } from "jspdf";
import { translate, type Lang } from "@/i18n";
import { plainText } from "@/lib/markdown";
import { SIGNATURE_PNG, SIGNATURE_SIZE } from "@/assets/signature-data";

const INK = [18, 20, 26] as const;
const MUTED = [110, 116, 128] as const;
const SIGNAL = [132, 204, 22] as const;
const PAPER = [255, 255, 255] as const;

/**
 * The Ruah mark, drawn rather than placed.
 *
 * The only logo file in the repo is a 64px favicon — upscaled onto an A4
 * cover it looked like exactly what it is. Drawn with the document's own
 * primitives it stays sharp at any size and at any zoom, and it is the same
 * lockup the site header uses: the monogram tile, then the wordmark.
 */
function drawLogo(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  opts: { onDark?: boolean; wordmark?: boolean } = {},
) {
  const { onDark = false, wordmark = true } = opts;

  // Monogram tile.
  if (onDark) {
    doc.setFillColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);
    doc.roundedRect(x, y, size, size, size * 0.26, size * 0.26, "F");
    doc.setTextColor(INK[0], INK[1], INK[2]);
  } else {
    doc.setFillColor(INK[0], INK[1], INK[2]);
    doc.roundedRect(x, y, size, size, size * 0.26, size * 0.26, "F");
    doc.setTextColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.68);
  doc.text("R", x + size / 2, y + size * 0.74, { align: "center" });

  if (!wordmark) return x + size;

  const gap = size * 0.46;
  doc.setFontSize(size * 0.44);
  doc.setTextColor(...((onDark ? PAPER : INK) as unknown as [number, number, number]));
  doc.text("RUAH STUDIO", x + size + gap, y + size * 0.68);
  return x + size + gap + doc.getTextWidth("RUAH STUDIO");
}

/** jsPDF core fonts have no Arabic glyphs, so the PDF falls back to English for `ar`. */
function pdfLang(lang: Lang): Lang {
  return lang === "ar" ? "en" : lang;
}

const LOCALES: Record<Lang, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  ar: "en-US",
};

export type ProposalInput = {
  client?: string;
  studio: string;
  founder: string;
  email: string;
  whatsapp: string;
  items: { label: string; description?: string; price: number }[];
  total: number;
  weeks: number;
  speed: string;
  scale: string;
  lang?: Lang;
  /** Stable reference for the visit. Two downloads must not disagree. */
  ref?: string;
  /** The assistant's summary of the conversation, when the quote came from the chat. */
  summary?: string;
  /** Budget and deadline as the visitor chose them (already translated labels). */
  budgetLabel?: string;
  timelineLabel?: string;
  /** When the estimate exceeds the budget: what fits now, and what follows. */
  phases?: { phase1: string[]; phase1Total: number; phase2: string[] } | undefined;
};

/**
 * System proposal PDF.
 *
 * Rebuilt as a studio document rather than an invoice: a full-bleed cover,
 * numbered sections, generous margins, a single oversized figure for the
 * investment, and a page footer with a proposal ID. Deliberately compact —
 * padding pages out is what makes a document feel automated.
 *
 * This is a commercial proposal, NOT a fiscal invoice. Wording says so.
 */
export function buildProposalPdf(input: ProposalInput): { blob: Blob; filename: string } {
  const lang = pdfLang(input.lang ?? "en");
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const COL = W - M * 2;

  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  const today = new Date();
  const dateStr = today.toLocaleDateString(LOCALES[lang], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // Stable, human-readable reference. Not a fiscal document number.
  // Comes from the visitor session so every document in one visit matches.
  const ref =
    input.ref ||
    `RS-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      Math.floor(Math.random() * 9000) + 1000,
    )}`;

  const ink = () => doc.setTextColor(INK[0], INK[1], INK[2]);
  const muted = () => doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const signal = () => doc.setTextColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);

  // ── COVER ──────────────────────────────────────────────
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(0, 0, W, H, "F");

  // The mark, top-left, where a studio document carries it.
  drawLogo(doc, M, 96, 30, { onDark: true });

  doc.setDrawColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);
  doc.setLineWidth(2);
  doc.line(M, 150, M + 54, 150);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(t("prop.cover1"), M, 240);
  doc.text(t("prop.cover2"), M, 286);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(200, 206, 216);
  doc.text(doc.splitTextToSize(t("prop.coverLede"), COL * 0.62), M, 324);

  // Cover metadata block
  const metaY = H - 190;
  doc.setDrawColor(70, 76, 88);
  doc.setLineWidth(0.5);
  doc.line(M, metaY - 22, W - M, metaY - 22);

  const meta: [string, string][] = [
    [t("prop.preparedFor"), input.client?.trim() || "—"],
    [t("prop.date"), dateStr],
    [t("prop.docRef"), ref],
    [t("prop.preparedBy"), input.founder],
  ];
  meta.forEach(([k, v], i) => {
    const x = M + (i % 2) * (COL / 2);
    const yy = metaY + Math.floor(i / 2) * 44;
    doc.setFontSize(7);
    doc.setTextColor(140, 148, 162);
    doc.text(k.toUpperCase(), x, yy);
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    // Fit the cell: shrink long names a step, then ellipsize — never cut mid-word.
    const max = COL / 2 - 12;
    let text = String(v);
    if (doc.getTextWidth(text) > max) doc.setFontSize(9);
    while (doc.getTextWidth(text) > max && text.length > 4) {
      text = `${text.slice(0, -2).trimEnd()}…`;
    }
    doc.text(text, x, yy + 15);
  });

  // ── CONTENT PAGES ──────────────────────────────────────
  let y = 0;
  let page = 1;

  const footer = () => {
    doc.setDrawColor(226, 229, 234);
    doc.setLineWidth(0.5);
    doc.line(M, H - 54, W - M, H - 54);
    // Mark in the footer too, so a single printed page still carries it.
    drawLogo(doc, M, H - 48, 13, { wordmark: false });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    muted();
    doc.text(`${input.studio}  ·  ${ref}`, M + 20, H - 38);
    doc.text(String(page).padStart(2, "0"), W - M, H - 38, { align: "right" });
  };

  const newPage = () => {
    doc.addPage();
    page += 1;
    y = 86;
  };

  const room = (need: number) => {
    if (y + need > H - 84) newPage();
  };

  const section = (num: string, title: string) => {
    room(70);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    signal();
    doc.text(num, M, y);
    doc.setFontSize(14);
    ink();
    doc.text(title, M + 26, y);
    doc.setDrawColor(226, 229, 234);
    doc.setLineWidth(0.5);
    doc.line(M, y + 12, W - M, y + 12);
    y += 34;
  };

  const para = (text: string, width = COL) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    muted();
    const lines = doc.splitTextToSize(text, width) as string[];
    room(lines.length * 13 + 10);
    doc.text(lines, M, y);
    y += lines.length * 13 + 14;
  };

  newPage();

  // Sections are numbered as they are drawn, so an optional one (the chat
  // summary) doesn't leave a gap or a duplicate in the sequence.
  let sectionNo = 0;
  const next = () => String(++sectionNo).padStart(2, "0");

  // 01 — EXECUTIVE SUMMARY
  section(next(), t("prop.s1"));
  para(
    translate(lang, "prop.summary", {
      modules: input.items.length,
      total: money(input.total),
      weeks: input.weeks,
      speed: input.speed.toLowerCase(),
      scale: input.scale.toLowerCase(),
    }),
    COL * 0.86,
  );

  // What the visitor told the assistant — the reason for everything below.
  if (input.summary?.trim()) {
    section(next(), t("prop.context"));
    para(plainText(input.summary), COL * 0.86);
    // Skip the frame line when the summary already states the budget.
    const stated = Boolean(input.budgetLabel) && input.summary.includes(input.budgetLabel ?? "");
    if ((input.budgetLabel || input.timelineLabel) && !stated) {
      para(
        translate(lang, "prop.frame", {
          budget: input.budgetLabel || "—",
          timeline: input.timelineLabel || "—",
        }),
        COL * 0.86,
      );
    }
  }

  // YOUR SYSTEM
  section(next(), t("prop.s2"));
  doc.setFillColor(248, 249, 251);
  room(120);
  doc.rect(M, y - 4, COL, 96, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  muted();
  doc.text(t("prop.investment").toUpperCase(), M + 20, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  ink();
  doc.text(money(input.total), M + 20, y + 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  muted();
  doc.text(t("prop.timeline").toUpperCase(), M + COL / 2 + 20, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  ink();
  doc.text(`${input.weeks} ${t("prop.wks")}`, M + COL / 2 + 20, y + 58);
  y += 116;

  // 03 — MODULES
  section(next(), t("prop.s3"));
  input.items.forEach((item) => {
    room(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    ink();
    doc.text(item.label, M, y);
    doc.text(money(item.price), W - M, y, { align: "right" });
    if (item.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      muted();
      const d = doc.splitTextToSize(item.description, COL - 90) as string[];
      doc.text(d, M, y + 13);
      y += 13 + d.length * 11;
    }
    y += 12;
    doc.setDrawColor(238, 240, 244);
    doc.setLineWidth(0.5);
    doc.line(M, y - 6, W - M, y - 6);
    y += 8;
  });

  // Module prices are base prices; the total also carries the team-size and
  // pace multipliers. Without this line the items visibly didn't add up to
  // the total ($180 + $140 printed above "$370"), which on a quote reads as
  // an error. Shown only when there is a difference to explain.
  const base = input.items.reduce((sum, it) => sum + it.price, 0);
  const adjust = input.total - base;
  if (adjust !== 0) {
    room(28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    muted();
    doc.text(
      translate(lang, "prop.adjust", {
        scale: input.scale.toLowerCase(),
        speed: input.speed.toLowerCase(),
      }),
      M,
      y,
    );
    doc.text(`${adjust > 0 ? "+" : "−"}${money(Math.abs(adjust))}`, W - M, y, { align: "right" });
    y += 22;
  }

  room(34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  ink();
  doc.text(t("prop.total"), M, y + 4);
  doc.setFontSize(15);
  doc.text(money(input.total), W - M, y + 4, { align: "right" });
  y += 34;

  // Over budget: a first phase that fits, the rest after. A quote that only
  // says "this costs more than you have" loses the client; one that says
  // "start here, within your budget" keeps them.
  if (input.phases && input.phases.phase1.length) {
    section(next(), t("prop.phases"));
    const phase = (title: string, names: string[], total?: number) => {
      room(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      ink();
      doc.text(title, M, y);
      if (total !== undefined) doc.text(money(total), W - M, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      muted();
      const lines = doc.splitTextToSize(names.join(" · "), COL - 90) as string[];
      doc.text(lines, M, y + 14);
      y += 14 + lines.length * 12 + 12;
    };
    phase(t("prop.phase1"), input.phases.phase1, input.phases.phase1Total);
    if (input.phases.phase2.length) phase(t("prop.phase2"), input.phases.phase2);
  }

  // 04 — WHAT'S INCLUDED
  section(next(), t("prop.s4"));
  (["prop.inc1", "prop.inc2", "prop.inc3", "prop.inc4", "prop.inc5", "prop.inc6"] as const).forEach(
    (key) => {
      const line = t(key);
      room(18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      signal();
      doc.text("—", M, y);
      muted();
      doc.text(doc.splitTextToSize(line, COL - 22) as string[], M + 16, y);
      y += 17;
    },
  );
  y += 12;

  // 05 — SUPPORT
  section(next(), t("prop.s5"));
  para(t("prop.support"), COL * 0.86);

  // 06 — NEXT STEP
  section(next(), t("prop.s6"));
  para(
    translate(lang, "prop.next", { founder: input.founder, whatsapp: input.whatsapp }),
    COL * 0.86,
  );

  // ── SIGNATURE ──────────────────────────────────────────
  // A quote nobody put their name to reads as a generated file. This is the
  // same hand on the About page and in the site footer, so the document, the
  // site and the person who answers on WhatsApp are visibly one.
  room(128);
  y += 10;
  doc.setDrawColor(226, 229, 234);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 26;

  const sigW = 150;
  const sigH = (SIGNATURE_SIZE.height / SIGNATURE_SIZE.width) * sigW;
  try {
    doc.addImage(SIGNATURE_PNG, "PNG", M, y, sigW, sigH, undefined, "FAST");
  } catch (err) {
    // A failed stamp must never cost the document.
    console.error("signature could not be drawn", err);
  }
  y += sigH + 6;

  doc.setDrawColor(190, 195, 204);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + 190, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  ink();
  doc.text(input.founder, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  muted();
  doc.text(`${t("prop.signedBy")} · ${input.studio}`, M, y + 12);
  doc.text(`${input.email}  ·  WhatsApp +${input.whatsapp.replace(/\D/g, "")}`, M, y + 23);

  // Date and reference sit opposite the signature, as on any signed document.
  doc.setFontSize(7);
  doc.setTextColor(150, 156, 168);
  doc.text(t("prop.date").toUpperCase(), W - M, y - 14, { align: "right" });
  doc.setFontSize(9.5);
  ink();
  doc.text(dateStr, W - M, y, { align: "right" });
  doc.setFontSize(7.5);
  muted();
  doc.text(`${t("prop.docRef")} ${ref}`, W - M, y + 12, { align: "right" });
  doc.text(t("prop.validity"), W - M, y + 23, { align: "right" });
  y += 44;

  room(46);
  doc.setFontSize(7.5);
  muted();
  doc.text(doc.splitTextToSize(t("prop.legal"), COL) as string[], M, y);

  // Draw the footer exactly once per content page. The previous version
  // stamped the current page inside the flow AND again in this loop, so the
  // last page carried two overlapping numbers.
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    page = p - 1;
    footer();
  }

  return {
    blob: doc.output("blob"),
    filename: `${input.studio.replace(/\s+/g, "-")}-${t("prop.filename")}-${ref}.pdf`,
  };
}

/**
 * The same document, downloaded. Kept apart from building it because the
 * quote now has two destinations: the visitor's downloads folder, and the
 * file that travels to John with the WhatsApp hand-off.
 */
export function generateProposalPdf(input: ProposalInput) {
  const { blob, filename } = buildProposalPdf(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before dropping the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type BriefInput = {
  name: string;
  business?: string;
  need: string;
  goal: string;
  budget: string;
  studio?: string;
  email?: string;
  whatsapp?: string;
  eyebrow?: string;
  lang?: Lang;
};

/** Client-side branded project brief PDF. */
export function generateBriefPdf(input: BriefInput) {
  const lang = pdfLang(input.lang ?? "en");
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const studio = input.studio ?? "Ruah Studio";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;

  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(0, 0, W, 140, "F");
  doc.setFillColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);
  doc.rect(0, 138, W, 3, "F");

  drawLogo(doc, M, 38, 26, { onDark: true });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);
  doc.text((input.eyebrow ?? "AI • SOFTWARE • AUTOMATION • DIGITAL SYSTEMS").toUpperCase(), M, 86);
  doc.setTextColor(215, 220, 228);
  doc.setFontSize(10);
  doc.text(t("pdf.brief"), M, 110);
  doc.text(
    new Date().toLocaleDateString(LOCALES[lang], {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    W - M,
    110,
    { align: "right" },
  );

  let y = 186;
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${t("pdf.preparedFor")}: ${input.name}`, M, y);
  if (input.business) {
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(input.business, M, y);
  }

  const block = (title: string, body: string) => {
    y += 34;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(title.toUpperCase(), M, y);
    doc.setDrawColor(SIGNAL[0], SIGNAL[1], SIGNAL[2]);
    doc.setLineWidth(2);
    doc.line(M, y + 5, M + 26, y + 5);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    const lines = doc.splitTextToSize(body || "—", W - M * 2);
    doc.text(lines, M, y);
    y += (lines.length - 1) * 15;
  };

  block(t("pdf.need"), input.need);
  block(t("pdf.goal"), input.goal);
  block(t("pdf.budget"), input.budget);

  y += 40;
  doc.setFillColor(246, 247, 249);
  doc.roundedRect(M, y - 24, W - M * 2, 150, 10, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(t("pdf.nextSteps").toUpperCase(), M + 20, y);
  y += 22;
  (
    [
      [t("pdf.step1"), t("process.1body")],
      [t("pdf.step2"), t("process.2body")],
      [t("pdf.step3"), t("process.3body")],
      [t("pdf.step4"), t("process.4body")],
    ] as [string, string][]
  ).forEach(([title, desc], i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(`${i + 1}. ${title}`, M + 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    const descLines = doc.splitTextToSize(desc, W - M * 2 - 170);
    doc.text(descLines, M + 150, y);
    y += 26;
  });

  y += 40;
  doc.setDrawColor(225, 228, 233);
  doc.setLineWidth(1);
  doc.line(M, y, W - M, y);
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(studio, M, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(
    `WhatsApp +${(input.whatsapp ?? "584222010041").replace(/\D/g, "")}  ·  ${
      input.email ?? "hola@ruahstudio.com"
    }`,
    M,
    y + 15,
  );
  doc.setFontSize(8);
  doc.text(t("pdf.footer"), M, y + 34);

  doc.save(
    `${studio.toLowerCase().replace(/\s+/g, "-")}-brief-${input.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
  );
}
