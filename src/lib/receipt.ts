/**
 * Generate and download a branded Rift receipt as an image (canvas-based).
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh", NGN: "\u20A6", UGX: "USh", TZS: "TSh",
  CDF: "FC", MWK: "MK", BRL: "R$", ETB: "Br", GHS: "\u20B5", USD: "$",
};

function getExplorerUrl(hash: string, chain?: string | null): string {
  switch (chain?.toLowerCase()) {
    case "ethereum": return `https://etherscan.io/tx/${hash}`;
    case "celo": return `https://celoscan.io/tx/${hash}`;
    case "polygon": return `https://polygonscan.com/tx/${hash}`;
    case "arbitrum": return `https://arbiscan.io/tx/${hash}`;
    case "lisk": return `https://blockscout.lisk.com/tx/${hash}`;
    default: return `https://basescan.org/tx/${hash}`;
  }
}

interface ReceiptData {
  type: "withdrawal" | "deposit";
  transactionCode: string;
  amount: number | string;
  currency?: string;
  chain?: string | null;
  token?: string | null;
  receipt_number?: string | null;
  transaction_hash?: string | null;
  public_name?: string | null;
  createdAt: string;
  status?: string;
}

export function downloadReceipt(data: ReceiptData) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const w = 800;
  const h = 1000;
  canvas.width = w;
  canvas.height = h;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Header bar
  ctx.fillStyle = "#0d9488";
  ctx.fillRect(0, 0, w, 120);

  // Logo text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Rift", w / 2, 55);
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.fillText("Transaction Receipt", w / 2, 85);
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillText("riftfi.xyz", w / 2, 108);

  // Type badge
  const isDeposit = data.type === "deposit";
  const badgeY = 155;
  ctx.fillStyle = isDeposit ? "#dcfce7" : "#fef3c7";
  roundRect(ctx, w / 2 - 80, badgeY, 160, 32, 16);
  ctx.fill();
  ctx.fillStyle = isDeposit ? "#16a34a" : "#d97706";
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(isDeposit ? "DEPOSIT" : "WITHDRAWAL", w / 2, badgeY + 21);

  // Amount
  const sym = CURRENCY_SYMBOLS[data.currency || ""] || data.currency || "$";
  const amountStr = `${sym} ${Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  ctx.fillStyle = "#111827";
  ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(amountStr, w / 2, 240);

  if (data.currency) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillText(data.currency, w / 2, 268);
  }

  // Divider
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 295);
  ctx.lineTo(w - 60, 295);
  ctx.stroke();

  // Details
  ctx.textAlign = "left";
  let y = 335;
  const lineHeight = 48;
  const labelX = 80;
  const valueX = w - 80;

  const drawRow = (label: string, value: string) => {
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, labelX, y);
    ctx.fillStyle = "#111827";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    // Truncate long values
    const maxWidth = w - labelX - 120;
    let displayValue = value;
    while (ctx.measureText(displayValue).width > maxWidth && displayValue.length > 10) {
      displayValue = displayValue.slice(0, -4) + "...";
    }
    ctx.fillText(displayValue, valueX, y);
    y += lineHeight;
  };

  // Date
  try {
    const date = new Date(data.createdAt);
    drawRow("Date", date.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }));
  } catch {
    drawRow("Date", data.createdAt);
  }

  // Status
  if (data.status) {
    drawRow("Status", data.status.charAt(0).toUpperCase() + data.status.slice(1));
  }

  // Transaction Code
  drawRow("Transaction Code", data.transactionCode);

  // Public Name
  if (data.public_name) {
    drawRow("Name", data.public_name);
  }

  // M-Pesa Receipt
  if (data.receipt_number) {
    drawRow("M-Pesa Receipt", data.receipt_number);
  }

  // Token & Chain
  if (data.token) {
    drawRow("Token", data.token);
  }
  if (data.chain) {
    drawRow("Chain", data.chain.charAt(0).toUpperCase() + data.chain.slice(1).toLowerCase());
  }

  // Transaction Hash
  if (data.transaction_hash) {
    drawRow("Transaction Hash", data.transaction_hash);
  }

  // Explorer Link
  if (data.transaction_hash) {
    const explorerUrl = getExplorerUrl(data.transaction_hash, data.chain);
    y += 8;
    ctx.fillStyle = "#0d9488";
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("View on blockchain explorer:", w / 2, y);
    y += 20;
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText(explorerUrl, w / 2, y);
  }

  // Footer
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, h - 60, w, 60);
  ctx.fillStyle = "#9ca3af";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Powered by Rift  |  riftfi.xyz  |  admin@riftfi.xyz", w / 2, h - 30);

  // Show receipt as a fullscreen overlay image the user can share/save
  const dataUrl = canvas.toDataURL("image/png");

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;";

  const img = document.createElement("img");
  img.src = dataUrl;
  img.style.cssText = "max-width:100%;max-height:70vh;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);";

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:12px;margin-top:20px;";

  // Share button
  const shareBtn = document.createElement("button");
  shareBtn.textContent = "\u{1F4E4} Save / Share";
  shareBtn.style.cssText = "padding:14px 36px;background:#0d9488;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;";
  shareBtn.onclick = async () => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `rift-receipt-${data.transactionCode}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Rift Receipt" });
      } else {
        // Fallback: copy image to clipboard
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        shareBtn.textContent = "Copied!";
        setTimeout(() => { shareBtn.textContent = "Share"; }, 2000);
      }
    } catch {}
  };

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = "padding:12px 32px;background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;";
  closeBtn.onclick = () => document.body.removeChild(overlay);

  const hint = document.createElement("p");
  hint.textContent = "Tap the button above to save to your gallery or share";
  hint.style.cssText = "color:rgba(255,255,255,0.5);font-size:13px;margin-top:12px;text-align:center;";

  btnRow.appendChild(shareBtn);
  btnRow.appendChild(closeBtn);
  overlay.appendChild(img);
  overlay.appendChild(btnRow);
  overlay.appendChild(hint);

  // Close on backdrop tap
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };

  document.body.appendChild(overlay);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
