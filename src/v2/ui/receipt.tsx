import { ReactNode } from "react";
import { format } from "date-fns";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Row, Rows, StatusPill, type Status } from "./index";

export interface ReceiptLine {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
}

/**
 * Invoice-card style receipt shown after a payment: headline amount,
 * status, date, from / to, reference and a line-item breakdown, with
 * share + download actions.
 */
export function ReceiptCard({
  title,
  amount,
  status = "succeeded",
  date = new Date(),
  from,
  to,
  lines,
  shareText,
  onDownload,
  footer,
}: {
  title: string;
  amount: string;
  status?: Status;
  date?: Date;
  from?: ReactNode;
  to?: ReactNode;
  lines: ReceiptLine[];
  shareText?: string;
  onDownload?: () => void;
  footer?: ReactNode;
}) {
  const share = async () => {
    if (!shareText) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rift receipt", text: shareText });
        return;
      }
    } catch {
      /* cancelled — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Receipt details copied");
    } catch {
      toast.error("Couldn't share the receipt");
    }
  };

  return (
    <Card as="article" aria-label="Receipt" data-testid="receipt" className="overflow-hidden">
      <div className="border-b border-dashed border-hairline-strong px-6 pb-6 pt-7 text-center">
        <CheckCircle2 className={status === "succeeded" ? "mx-auto h-9 w-9 text-success" : "mx-auto h-9 w-9 text-pending"} aria-hidden="true" />
        <p className="mt-3 text-[13px] font-medium text-ink-3">{title}</p>
        <p className="mt-1 text-[36px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-numeric">{amount}</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-3">
          <StatusPill status={status} />
          <span>{format(date, "d MMM yyyy, HH:mm")}</span>
        </div>
      </div>
      {(from || to) && (
        <div className="grid grid-cols-2 gap-4 border-b border-hairline px-6 py-4 text-[13px]">
          <div className="min-w-0">
            <p className="text-ink-3">From</p>
            <div className="mt-0.5 break-words font-medium text-ink">{from}</div>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-ink-3">To</p>
            <div className="mt-0.5 break-words font-medium text-ink">{to}</div>
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
      <div className="flex flex-col gap-2 border-t border-hairline bg-surface-subtle/60 px-6 py-4 sm:flex-row">
        {shareText && (
          <Button variant="secondary" block onClick={share}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share
          </Button>
        )}
        {onDownload && (
          <Button variant="secondary" block onClick={onDownload}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </Button>
        )}
        {footer}
      </div>
    </Card>
  );
}
