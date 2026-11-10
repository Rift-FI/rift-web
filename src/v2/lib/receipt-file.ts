/**
 * Receipt files (PNG / PDF) drawn on a canvas, so they look the same as the
 * on-screen receipt card and need no extra libraries. The PDF is a minimal
 * single-page document wrapping the rendered JPEG.
 */

export interface ReceiptFileModel {
  title: string;
  amount: string;
  status: string;
  date: string;
  from?: string;
  to?: string;
  lines: { label: string; value: string; strong?: boolean }[];
  reference?: string;
}

const W = 800;
const PAD = 56;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line + w;
    if (ctx.measureText(test).width > max && line) {
      out.push(line.trim());
      line = w.trimStart();
    } else line = test;
  }
  if (line.trim()) out.push(line.trim());
  // Break very long tokens (addresses, hashes).
  return out.flatMap((l) => {
    if (ctx.measureText(l).width <= max) return [l];
    const parts: string[] = [];
    let cur = "";
    for (const ch of l) {
      if (ctx.measureText(cur + ch).width > max) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  });
}

export function renderReceiptCanvas(m: ReceiptFileModel): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = (w: number, s: number) => `${w} ${s}px "Public Sans", system-ui, -apple-system, Segoe UI, sans-serif`;

  // Measure height first.
  ctx.font = font(400, 22);
  const rows = m.lines.map((l) => ({ ...l, wrapped: wrap(ctx, l.value, W - PAD * 2 - 260) }));
  const partyBlock = m.from || m.to ? 120 : 0;
  const height = 120 + 220 + partyBlock + rows.reduce((a, r) => a + 26 * r.wrapped.length + 30, 0) + 120;

  const scale = 2;
  canvas.width = W * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, height);

  // Header
  ctx.fillStyle = "#2E8C96";
  ctx.fillRect(0, 0, W, 96);
  ctx.fillStyle = "#ffffff";
  ctx.font = font(700, 32);
  ctx.textAlign = "left";
  ctx.fillText("Rift", PAD, 60);
  ctx.font = font(500, 18);
  ctx.textAlign = "right";
  ctx.fillText("Receipt", W - PAD, 60);

  // Amount block
  let y = 160;
  ctx.textAlign = "center";
  ctx.fillStyle = "#5d6a6d";
  ctx.font = font(500, 20);
  ctx.fillText(m.title, W / 2, y);
  y += 62;
  ctx.fillStyle = "#10181a";
  ctx.font = font(700, 52);
  ctx.fillText(m.amount, W / 2, y);
  y += 46;
  ctx.font = font(600, 18);
  ctx.fillStyle = "#1d7a4c";
  ctx.fillText(`${m.status}  ·  ${m.date}`, W / 2, y);
  y += 40;

  // Dashed divider
  ctx.strokeStyle = "#cfd6d8";
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 40;

  ctx.textAlign = "left";
  if (m.from || m.to) {
    ctx.font = font(500, 16);
    ctx.fillStyle = "#5d6a6d";
    ctx.fillText("From", PAD, y);
    ctx.textAlign = "right";
    ctx.fillText("To", W - PAD, y);
    y += 30;
    ctx.font = font(600, 20);
    ctx.fillStyle = "#10181a";
    ctx.textAlign = "left";
    ctx.fillText((m.from || "—").slice(0, 34), PAD, y);
    ctx.textAlign = "right";
    ctx.fillText((m.to || "—").slice(0, 34), W - PAD, y);
    y += 50;
    ctx.textAlign = "left";
  }

  for (const r of rows) {
    ctx.font = font(r.strong ? 700 : 400, 20);
    ctx.fillStyle = r.strong ? "#10181a" : "#5d6a6d";
    ctx.textAlign = "left";
    ctx.fillText(r.label, PAD, y);
    ctx.fillStyle = "#10181a";
    ctx.textAlign = "right";
    ctx.font = font(r.strong ? 700 : 500, 20);
    r.wrapped.forEach((line, i) => ctx.fillText(line, W - PAD, y + i * 26));
    y += 26 * r.wrapped.length + 4;
    ctx.strokeStyle = "#e3e7e8";
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += 26;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#93a1a4";
  ctx.font = font(400, 15);
  ctx.fillText(`Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC  ·  riftfi.xyz`, W / 2, height - 40);
  return canvas;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const fileName = (m: ReceiptFileModel, ext: string) =>
  `rift-receipt-${(m.reference || m.date).replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "receipt"}.${ext}`;

export function downloadReceiptPng(m: ReceiptFileModel) {
  const canvas = renderReceiptCanvas(m);
  canvas.toBlob((b) => b && save(b, fileName(m, "png")), "image/png");
}

/** Minimal PDF: one page, the receipt as a JPEG image (DCTDecode). */
export function buildReceiptPdf(canvas: HTMLCanvasElement): Blob {
  const jpeg = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1]);
  const imgBytes = new Uint8Array(jpeg.length);
  for (let i = 0; i < jpeg.length; i++) imgBytes[i] = jpeg.charCodeAt(i);
  // Page in points: fit width 595 (A4), keep aspect.
  const pw = 595;
  const ph = Math.round((canvas.height / canvas.width) * pw);
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (p: Uint8Array | string) => {
    const b = typeof p === "string" ? enc.encode(p) : p;
    parts.push(b);
    len += b.length;
  };
  const obj = (n: number, body: string | (() => void)) => {
    offsets[n] = len;
    push(`${n} 0 obj\n`);
    if (typeof body === "string") push(body);
    else body();
    push("\nendobj\n");
  };
  push("%PDF-1.4\n%âãÏÓ\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, () => {
    push(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`);
    push(imgBytes);
    push("\nendstream");
  });
  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const xref = len;
  push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => `${String(offsets[n]).padStart(10, "0")} 00000 n \n`).join("")}`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

export function downloadReceiptPdf(m: ReceiptFileModel) {
  save(buildReceiptPdf(renderReceiptCanvas(m)), fileName(m, "pdf"));
}
