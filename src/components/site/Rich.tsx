import { Fragment, type ReactNode } from "react";

/**
 * The little bit of Markdown a chat reply actually uses.
 *
 * The model writes **negritas**, guiones y títulos porque así escribe todo el
 * mundo; sin esto el visitante ve los asteriscos en crudo. No es un motor de
 * Markdown: sin HTML, sin enlaces, sin tablas — sólo lo que cabe en una
 * burbuja de chat, y todo se construye como nodos de React, así que no hay
 * forma de inyectar HTML desde el modelo.
 *
 * Reconoce:
 *   **negrita**   *cursiva*   `código`
 *   - viñeta      • viñeta    * viñeta      1. lista numerada
 *   # título      ## título   ### título
 *   --- separador
 */

type Token = { kind: "b" | "i" | "code" | "text"; value: string };

/** Splits one line into bold / italic / code runs. */
function inline(text: string): Token[] {
  const out: Token[] = [];
  // Order matters: ** before *, so bold isn't eaten by italic.
  const re = /(\*\*|__)(.+?)\1|(\*|_)(?!\s)(.+?)(?<!\s)\3|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    if (m[2] !== undefined) out.push({ kind: "b", value: m[2] });
    else if (m[4] !== undefined) out.push({ kind: "i", value: m[4] });
    else if (m[5] !== undefined) out.push({ kind: "code", value: m[5] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {inline(text).map((t, i) => {
        if (t.kind === "b")
          return (
            <strong key={i} className="font-semibold">
              {t.value}
            </strong>
          );
        if (t.kind === "i")
          return (
            <em key={i} className="italic">
              {t.value}
            </em>
          );
        if (t.kind === "code")
          return (
            <code key={i} className="bg-surface-2 px-1 py-0.5 font-mono text-[0.9em]">
              {t.value}
            </code>
          );
        return <Fragment key={i}>{t.value}</Fragment>;
      })}
    </>
  );
}

const BULLET = /^\s*([-*•])\s+(.*)$/;
const NUMBER = /^\s*(\d{1,2})[.)]\s+(.*)$/;
const HEADING = /^\s*(#{1,6})\s+(.*)$/;
const RULE = /^\s*([-*_]\s*){3,}$/;

/** Renders one assistant message. Plain text stays exactly as written. */
export function Rich({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const { ordered, items } = list;
    blocks.push(
      ordered ? (
        <ol key={blocks.length} className="ms-4 list-decimal space-y-1">
          {items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </ol>
      ) : (
        <ul key={blocks.length} className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-signal">
                •
              </span>
              <span>
                <Inline text={it} />
              </span>
            </li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (RULE.test(line)) {
      flush();
      blocks.push(<hr key={blocks.length} className="border-border" />);
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push(
        <p key={blocks.length} className="font-semibold">
          <Inline text={heading[2] ?? ""} />
        </p>,
      );
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[2] ?? "");
      continue;
    }
    const numbered = NUMBER.exec(line);
    if (numbered) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[2] ?? "");
      continue;
    }
    flush();
    if (!line.trim()) {
      // Blank line between paragraphs; ignore leading ones.
      if (blocks.length) blocks.push(<span key={blocks.length} className="block h-2" />);
      continue;
    }
    blocks.push(
      <p key={blocks.length}>
        <Inline text={line} />
      </p>,
    );
  }
  flush();

  return <div className="space-y-1">{blocks}</div>;
}
