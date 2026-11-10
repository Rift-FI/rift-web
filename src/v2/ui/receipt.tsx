import { ReactNode } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock3, Download, FileText, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABEL, STATUS_TONE, type AppStatus } from "@/v2/lib/status";
import { downloadReceiptPdf, downloadReceiptPng, type ReceiptFileModel } from "@/v2/lib/receipt-file";
import { Button, Row, Rows, StatusPill } from "./index";

export interface ReceiptLine {
  label: string;
  value: ReactNode;
  /** Plain-text value for the downloaded file when `value` isn't a string. */
  text?: string;
  strong?: boolean;
}

const asText = (v: ReactNode, text?: string) => text ?? (typeof v === "string" || typeof v === "number" ? String(v) : "");

/**
 * Receipt shown after every completed transaction and in Activity detail:
 * headline amount, status, date, from / to, line items, plus Share and
 * Download (PNG or PDF).
 */
export function ReceiptCard({
  title,
  amount,
  status = "completed",
  date = new Date(),
  from,
  to,
  fromText,
  toText,
  lines,
  reference,
  shareText,
  footer,
  bare,
}: {
  title: string;
  amount: string;
  status?: AppStatus;
  date?: Date;
  from?: ReactNode;
  to?: ReactNode;
  fromText?: string;
  toText?: string;
  lines: ReceiptLine[];
  reference?: string;
  shareText?: string;
  footer?: ReactNode;
  /** Without the outer card (e.g. inside a drawer). */
  bare?: boolean;
}) {
  const tone = STATUS_TONE[status];
  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? XCircle : Clock3;
  const model: ReceiptFileModel = {
    title,
    amount,
    status: STATUS_LABEL[status],
    date: format(date, "d MMM yyyy, HH:mm"),
    from: fromText ?? asText(from),
    to: toText ?? asText(to),
    lines: lines.map((l) => ({ label: l.label, value: asText(l.value, l.text) || "—", strong: l.strong })),
    reference,
  };

  const share = async () => {
    if (!shareText) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rift receipt", text: shareText });
        return;
      }
    } catch {
      /* cancelled — fall back to copy */
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Receipt copied");
    } catch {
      toast.error("Couldn't share the receipt");
    }
  };

  const body = (
    <>
      <div className="border-b border-dashed border-hairline-strong px-6 pb-6 pt-7 text-center">
        <Icon
          className={tone === "success" ? "mx-auto h-9 w-9 text-success" : tone === "danger" ? "mx-auto h-9 w-9 text-danger" : "mx-auto h-9 w-9 text-accent-primary"}
          aria-hidden="true"
        />
        <p className="mt-3 text-[13px] font-medium text-ink-3">{title}</p>
        <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-numeric" data-testid="receipt-amount">
          {amount}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-3">
          <StatusPill status={status} />
          <span>{format(date, "d MMM yyyy, HH:mm")}</span>
        </div>
      </div>
      {(from || to) && (
        <div className="grid grid-cols-2 gap-4 border-b border-hairline px-6 py-4 text-[13px]">
          <div className="min-w-0">
            <p className="text-ink-3">From</p>
            <div className="mt-0.5 break-words font-medium text-ink">{from ?? "—"}</div>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-ink-3">To</p>
            <div className="mt-0.5 break-words font-medium text-ink">{to ?? "—"}</div>
          </div>
        </div>
      )}
      <div className="px-6 py-2">
        <Rows>
          {lines.map((l, i) => (
            <Row key={i} label={l.label} strong={l.strong}>
              {l.value}
            </Row>
          ))}
        </Rows>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-hairline px-6 py-4">
        <Button variant="secondary" className="flex-1" onClick={() => downloadReceiptPng(model)} data-testid="receipt-download-png">
          <Download className="h-4 w-4" aria-hidden="true" />
          PNG
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => downloadReceiptPdf(model)} data-testid="receipt-download-pdf">
          <FileText className="h-4 w-4" aria-hidden="true" />
          PDF
        </Button>
        {shareText && (
          <Button variant="secondary" className="flex-1" onClick={share}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share
          </Button>
        )}
        {footer}
      </div>
    </>
  );

  if (bare) {
    return (
      <article aria-label="Receipt" data-testid="receipt">
        {body}
      </article>
    );
  }
  return (
    <article aria-label="Receipt" data-testid="receipt" className="overflow-hidden rounded-2xl bg-card ring-1 ring-hairline">
      {body}
    </article>
  );
}
