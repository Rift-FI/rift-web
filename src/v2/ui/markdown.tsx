/**
 * Tiny, safe Markdown renderer for server-provided documents (LP Terms).
 * Builds React elements only (no innerHTML), so markup in the source shows
 * as text. Supports: # / ## / ### headings, paragraphs, - / * / 1. lists,
 * > quotes, --- rules, **bold**, *italic*, `code` and [links](https://…).
 */
import { Fragment, ReactNode } from "react";
import { cn } from "@/lib/utils";

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Order matters: code first (no nested formatting), then links, bold, italic.
  const re = /(`[^`]+`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*|_([^_]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1]) out.push(<code key={k} className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[0.9em]">{m[1].slice(1, -1)}</code>);
    else if (m[2]) {
      const href = m[4];
      out.push(
        SAFE_HREF.test(href) ? (
          <a key={k} href={href} target={href.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="font-medium text-accent-primary underline underline-offset-2">
            {m[3]}
          </a>
        ) : (
          <Fragment key={k}>{m[3]}</Fragment>
        )
      );
    } else if (m[5]) out.push(<strong key={k} className="font-semibold text-ink">{inline(m[6], k)}</strong>);
    else out.push(<em key={k}>{m[8] ?? m[9]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "hr" };

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ t: "p", text: para.join(" ") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      flush();
      blocks.push({ t: "h", level: h[1].length, text: h[2].replace(/\s+#+$/, "") });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flush();
      blocks.push({ t: "hr" });
      continue;
    }
    const ul = /^[-*+]\s+(.*)$/.exec(trimmed);
    const ol = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (ul || ol) {
      flush();
      const kind = ul ? "ul" : "ol";
      const prev = blocks[blocks.length - 1];
      const text = (ul ?? ol)![1];
      if (prev && prev.t === kind) prev.items.push(text);
      else blocks.push({ t: kind, items: [text] });
      continue;
    }
    // Continuation of a list item (indented line).
    const prev = blocks[blocks.length - 1];
    if (!para.length && prev && (prev.t === "ul" || prev.t === "ol") && /^\s{2,}/.test(line)) {
      prev.items[prev.items.length - 1] += ` ${trimmed}`;
      continue;
    }
    if (trimmed.startsWith(">")) {
      flush();
      const text = trimmed.replace(/^>\s?/, "");
      if (prev && prev.t === "quote") prev.text += ` ${text}`;
      else blocks.push({ t: "quote", text });
      continue;
    }
    para.push(trimmed);
  }
  flush();
  return blocks;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parse(source || "");
  return (
    <div className={cn("space-y-3 text-[14.5px] leading-relaxed text-ink-2", className)}>
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.t) {
          case "h": {
            const cls =
              b.level === 1
                ? "text-[20px] font-semibold tracking-[-0.01em] text-ink"
                : b.level === 2
                  ? "pt-3 text-[16px] font-semibold text-ink"
                  : "pt-1 text-[14.5px] font-semibold text-ink";
            const Tag = (b.level === 1 ? "h2" : b.level === 2 ? "h3" : "h4") as "h2" | "h3" | "h4";
            return (
              <Tag key={k} className={cls}>
                {inline(b.text, k)}
              </Tag>
            );
          }
          case "ul":
          case "ol": {
            const Tag = b.t;
            return (
              <Tag key={k} className={cn("space-y-1.5 pl-5", b.t === "ul" ? "list-disc" : "list-decimal")}>
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1 marker:text-ink-3">
                    {inline(it, `${k}-${j}`)}
                  </li>
                ))}
              </Tag>
            );
          }
          case "quote":
            return (
              <blockquote key={k} className="border-l-2 border-hairline-strong pl-3 text-ink-2">
                {inline(b.text, k)}
              </blockquote>
            );
          case "hr":
            return <hr key={k} className="border-hairline" />;
          default:
            return <p key={k}>{inline(b.text, k)}</p>;
        }
      })}
    </div>
  );
}
