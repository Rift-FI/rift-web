import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BiCopy } from "react-icons/bi";
import { Check, Download, RefreshCw, Share2, Wallet2, QrCode } from "lucide-react";
import useCreateInvoice from "@/hooks/data/use-create-invoice";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 250];
const MONO = '"JetBrains Mono", monospace';
const DISPLAY = '"Clash Display", "Satoshi", sans-serif';

type Mode = "fixed" | "open";

function shortAddress(addr: string): string {
  if (!addr) return "Not connected";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Merchant() {
  const [mode, setMode] = useState<Mode>("fixed");
  const [amountInput, setAmountInput] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const createInvoice = useCreateInvoice();
  const address = localStorage.getItem("address") || "";

  const parsedAmount = parseFloat(amountInput);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const canGenerate = mode === "open" || amountValid;
  const isLoading = createInvoice.isPending;

  const amountLabel = useMemo(() => {
    if (mode === "open") return "Any amount";
    if (!amountValid) return "$0.00";
    return `$${parsedAmount.toFixed(2)}`;
  }, [mode, amountValid, parsedAmount]);

  const handleGenerate = async () => {
    if (!address) return toast.error("No wallet address found");
    if (mode === "fixed" && !amountValid) return;
    try {
      // Both fixed and open go through createInvoice so they share the backend
      // URL shortener (payment.riftfi.xyz/invoice/{code}). amount: 0 = open.
      const result = await createInvoice.mutateAsync({
        description: mode === "open" ? "Merchant Payment (open amount)" : "Merchant Payment",
        chain: "BASE",
        token: "USDC",
        amount: mode === "open" ? 0 : parsedAmount,
      });
      const url: string = result?.url || result?.data?.url || "";
      if (!url) throw new Error("No URL");
      setGeneratedUrl(url);
    } catch {
      toast.error("Could not create the payment. Please try again.");
    }
  };

  const handleCopyLink = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    toast.success("Payment link copied");
  };

  const handleShare = () => {
    if (!generatedUrl) return;
    if (navigator.share) navigator.share({ url: generatedUrl, title: "Pay me via Rift" }).catch(() => {});
    else handleCopyLink();
  };

  const handleDownloadQr = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 640;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml" }));
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      const pad = 48;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = "rift-payment-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    setAmountInput("");
    setMode("fixed");
  };

  // ── Configuration panel (left on desktop / first on mobile) ──
  const configPanel = (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-white border border-black/[0.05] shadow-sm">
        {(["fixed", "open"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "relative py-2.5 text-[13px] font-semibold rounded-xl transition-colors",
              mode === m ? "text-white" : "text-text-default hover:text-accent-primary"
            )}
          >
            {mode === m && (
              <motion.div
                layoutId="merchant-mode-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-accent-primary shadow-[0_4px_14px_-4px_rgba(46,140,150,0.6)]"
              />
            )}
            <span className="relative z-10">{m === "fixed" ? "Set amount" : "Open amount"}</span>
          </button>
        ))}
      </div>

      {/* Amount card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-black/[0.05] shadow-sm p-6">
        <div className="absolute -top-12 -right-10 w-32 h-32 rounded-full bg-accent-primary/[0.07] blur-2xl" />
        <AnimatePresence mode="wait">
          {mode === "fixed" ? (
            <motion.div key="fixed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <p className="relative text-center text-[10px] font-bold uppercase tracking-[0.18em] text-text-subtle/70 mb-3">
                Amount to charge
              </p>
              <div className="relative flex items-center justify-center gap-1">
                <span className="text-3xl font-semibold text-accent-primary/70 mt-1" style={{ fontFamily: MONO }}>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full max-w-[220px] bg-transparent text-center text-[52px] leading-none font-bold tracking-tight text-text-default placeholder:text-text-subtle/25 focus:outline-none"
                  style={{ fontFamily: MONO }}
                />
              </div>
              <p className="relative text-center text-[12px] text-text-subtle/80 mt-2">
                Settled in <span className="text-accent-primary font-semibold">USDC</span> on Base
              </p>
              <div className="relative grid grid-cols-3 gap-2 mt-5">
                {QUICK_AMOUNTS.map((amt) => {
                  const active = parsedAmount === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => setAmountInput(String(amt))}
                      className={cn(
                        "py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95",
                        active
                          ? "bg-accent-primary text-white shadow-md"
                          : "bg-white border border-gray-200 text-text-default hover:border-accent-primary hover:bg-accent-primary/5"
                      )}
                    >
                      ${amt}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="relative py-3 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 border border-accent-primary/20">
                <Wallet2 className="h-6 w-6 text-accent-primary" />
              </div>
              <p className="text-[15px] font-semibold text-text-default mb-1">Customer chooses the amount</p>
              <p className="text-[12.5px] text-text-subtle/80 max-w-[260px] mx-auto leading-relaxed">
                They'll enter how much to send when they scan. Great for tips, donations, or flexible pricing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Receiving wallet */}
      <div className="flex items-center justify-between rounded-2xl px-4 py-3.5 bg-white border border-black/[0.05] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
            <Wallet2 className="h-4 w-4 text-accent-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-subtle/70">Receiving wallet</p>
            <p className="text-[13px] font-semibold text-text-default" style={{ fontFamily: MONO }}>{shortAddress(address)}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
          BASE
        </span>
      </div>

      {/* CTA */}
      <motion.button
        onClick={handleGenerate}
        disabled={!canGenerate || isLoading || !address}
        whileTap={{ scale: 0.98 }}
        className="group relative w-full overflow-hidden rounded-2xl py-4 font-semibold text-[15px] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-accent-primary shadow-[0_8px_26px_-8px_rgba(46,140,150,0.7)] enabled:hover:shadow-[0_10px_32px_-6px_rgba(46,140,150,0.85)]"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-enabled:group-hover:translate-x-full" />
        {isLoading ? (
          <span className="relative flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Generating…
          </span>
        ) : (
          <span className="relative">{generatedUrl ? "Update QR code" : "Generate QR code"}</span>
        )}
      </motion.button>
    </div>
  );

  // ── Preview panel (right on desktop / second on mobile) ──
  const previewPanel = (
    <div className="relative rounded-3xl bg-white border border-black/[0.05] shadow-[0_12px_40px_-16px_rgba(15,42,56,0.18)] p-6 lg:p-8">
      <style>{`@keyframes rift-scan{0%{transform:translateY(0);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translateY(220px);opacity:0}}`}</style>
      <AnimatePresence mode="wait">
        {!generatedUrl ? (
          /* Placeholder */
          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center py-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle/70 mb-5">Live preview</p>
            <div className="relative flex h-[248px] w-[248px] items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-app-background/50">
              {[
                "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
                "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
              ].map((c) => (
                <span key={c} className={`absolute h-6 w-6 border-accent-primary/30 ${c}`} />
              ))}
              <div className="flex flex-col items-center gap-3 text-text-subtle/40">
                <QrCode className="h-12 w-12" strokeWidth={1.5} />
                <span className="text-[12px] font-medium max-w-[160px]">Your payment QR will appear here</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-[12px] text-text-subtle/80">
                {mode === "open" ? "Open amount" : "Charging"}
              </span>
              <span className="text-[15px] font-bold text-accent-primary" style={{ fontFamily: MONO }}>
                {mode === "open" ? "" : amountLabel}
              </span>
            </div>
          </motion.div>
        ) : (
          /* Generated QR */
          <motion.div key="qr" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle/70 mb-2">Scan to pay</p>
            <p className="text-[34px] leading-none font-bold tracking-tight mb-6" style={{ fontFamily: DISPLAY }}>
              {mode === "open" ? (
                <span className="text-text-default">Any amount</span>
              ) : (
                <span className="text-accent-primary">{amountLabel}</span>
              )}
            </p>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[30px] bg-accent-primary/15 blur-xl" />
              <div className="relative rounded-2xl bg-white p-5 border border-black/[0.06] shadow-[0_16px_44px_-16px_rgba(15,42,56,0.4)]">
                {[
                  "top-2.5 left-2.5 border-t-2 border-l-2 rounded-tl-lg",
                  "top-2.5 right-2.5 border-t-2 border-r-2 rounded-tr-lg",
                  "bottom-2.5 left-2.5 border-b-2 border-l-2 rounded-bl-lg",
                  "bottom-2.5 right-2.5 border-b-2 border-r-2 rounded-br-lg",
                ].map((c) => (
                  <span key={c} className={`absolute h-6 w-6 border-accent-primary ${c}`} />
                ))}
                <div className="relative overflow-hidden rounded-lg">
                  <QRCodeSVG ref={qrRef} value={generatedUrl} size={220} level="M" fgColor="#0B1620" bgColor="#ffffff" />
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-accent-primary/0 via-accent-primary/35 to-accent-primary/0" style={{ animation: "rift-scan 2.6s ease-in-out infinite" }} />
                </div>
              </div>
            </div>

            {/* Link pill */}
            <button onClick={handleCopyLink} className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 bg-app-background border border-gray-200 hover:border-accent-primary transition-colors active:scale-[0.99]">
              <span className="truncate text-[12px] text-text-default" style={{ fontFamily: MONO }}>{generatedUrl}</span>
              {copied ? <Check className="h-4 w-4 flex-shrink-0 text-accent-primary" /> : <BiCopy className="h-4 w-4 flex-shrink-0 text-text-subtle/60" />}
            </button>

            {/* Actions */}
            <div className="mt-3 grid w-full grid-cols-3 gap-2.5">
              {[
                { icon: <BiCopy className="h-[18px] w-[18px]" />, label: "Copy", onClick: handleCopyLink },
                { icon: <Share2 className="h-[18px] w-[18px]" />, label: "Share", onClick: handleShare },
                { icon: <Download className="h-[18px] w-[18px]" />, label: "Save QR", onClick: handleDownloadQr },
              ].map((b) => (
                <button key={b.label} onClick={b.onClick} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white border border-gray-200 text-text-default hover:text-accent-primary hover:border-accent-primary hover:bg-accent-primary/5 transition-all active:scale-95">
                  {b.icon}
                  <span className="text-[11.5px] font-semibold">{b.label}</span>
                </button>
              ))}
            </div>

            <button onClick={handleReset} className="mt-5 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-text-subtle/80 hover:text-accent-primary transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              Create a new QR
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-app-background">
      {/* Subtle light atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 w-[460px] h-[460px] rounded-full blur-[120px] opacity-30" style={{ background: "radial-gradient(circle, rgba(46,140,150,0.18) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md lg:max-w-5xl px-5 lg:px-8 pt-7 lg:pt-10 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7 lg:mb-9">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-2 w-2 relative">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-50 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-primary" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-primary">Merchant</span>
          </div>
          <h1 className="text-[30px] lg:text-[38px] leading-[1.05] font-semibold tracking-[-0.02em] text-text-default" style={{ fontFamily: DISPLAY }}>
            Accept a payment
          </h1>
          <p className="text-[13.5px] lg:text-[15px] text-text-subtle/90 mt-1.5">
            Generate a QR your customer scans to pay you instantly.
          </p>
        </motion.div>

        {/* Responsive: 2-col on desktop, swap on mobile */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-10 lg:items-start">
          <div className={cn(generatedUrl ? "hidden lg:block" : "block")}>{configPanel}</div>
          <div className={cn("lg:sticky lg:top-10", generatedUrl ? "block mt-4 lg:mt-0" : "hidden lg:block")}>{previewPanel}</div>
        </div>
      </div>
    </div>
  );
}
