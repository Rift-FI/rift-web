import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { explorerTxUrl, type Payment } from "@/v2/lib/payments";
import { CopyButton, SideSheet, StatusPill, formatMoney, shortHash } from "@/v2/ui";
import { ReceiptCard, type ReceiptLine } from "@/v2/ui/receipt";

export function DirectionIcon({ direction, className }: { direction: Payment["direction"]; className?: string }) {
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      aria-label={direction === "in" ? "Incoming" : "Outgoing"}
      className={cn(
        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
        direction === "in" ? "bg-tint-success text-success" : "bg-surface-subtle text-ink-2",
        className
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

export function paymentAmount(p: Payment) {
  return formatMoney(p.direction === "in" ? p.amount : -p.amount, p.currency, { signed: true });
}

function counterpartyLabel(p: Payment) {
  if (!p.counterparty) return p.method;
  return /^0x[0-9a-f]{20,}$/i.test(p.counterparty) ? shortHash(p.counterparty) : p.counterparty;
}

/** Compact list row (mobile + home). */
export function PaymentListItem({ payment, onOpen }: { payment: Payment; onOpen: (p: Payment) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(payment)}
        data-testid="payment-row"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-subtle cursor-pointer focus-visible:bg-surface-subtle"
      >
        <DirectionIcon direction={payment.direction} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">{payment.title}</p>
          <p className="truncate text-[12.5px] text-ink-3">{counterpartyLabel(payment)}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className={cn("whitespace-nowrap text-[14px] font-semibold tabular-numeric", payment.direction === "in" ? "text-success" : "text-ink")}>
            {paymentAmount(payment)}
          </span>
          {payment.status !== "completed" ? (
            <StatusPill status={payment.status} />
          ) : (
            <span className="text-[12px] text-ink-3 tabular-numeric">{format(new Date(payment.createdAt), "d MMM, HH:mm")}</span>
          )}
        </div>
      </button>
    </li>
  );
}

/** Desktop data table. */
export function PaymentsTable({ payments, onOpen }: { payments: Payment[]; onOpen: (p: Payment) => void }) {
  return (
    <table className="w-full table-fixed text-left text-[14px]">
      <thead>
        <tr className="border-b border-hairline text-[12px] font-medium text-ink-3">
          <th scope="col" className="w-[180px] px-5 py-2.5 text-right font-medium">Amount</th>
          <th scope="col" className="w-[160px] px-3 py-2.5 font-medium">Status</th>
          <th scope="col" className="px-3 py-2.5 font-medium">Description</th>
          <th scope="col" className="w-[200px] px-3 py-2.5 font-medium">Counterparty</th>
          <th scope="col" className="w-[140px] px-5 py-2.5 text-right font-medium">Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-hairline">
        {payments.map((p) => (
          <tr
            key={p.id}
            data-testid="payment-row"
            tabIndex={0}
            onClick={() => onOpen(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(p);
              }
            }}
            className="cursor-pointer transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none"
          >
            <td className={cn("whitespace-nowrap px-5 py-3 text-right font-semibold tabular-numeric", p.direction === "in" ? "text-success" : "text-ink")}>
              {paymentAmount(p)}
            </td>
            <td className="px-3 py-3">
              <StatusPill status={p.status} />
            </td>
            <td className="px-3 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <DirectionIcon direction={p.direction} className="h-6 w-6 [&>svg]:h-3.5 [&>svg]:w-3.5" />
                <span className="truncate font-medium text-ink">{p.title}</span>
                <span className="hidden truncate text-ink-3 xl:inline">&middot; {p.method}</span>
              </div>
            </td>
            <td className="truncate px-3 py-3 text-ink-2">{counterpartyLabel(p)}</td>
            <td className="px-5 py-3 text-right text-ink-3 tabular-numeric">{format(new Date(p.createdAt), "d MMM, HH:mm")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Receipt lines for a payment (shared by the drawer and post-transaction screens). */
export function paymentReceiptLines(p: Payment): ReceiptLine[] {
  const lines: ReceiptLine[] = [{ label: "Amount", value: formatMoney(p.amount, p.currency) }];
  if (p.fiatAmount != null && p.fiatCurrency && p.fiatCurrency !== p.currency) lines.push({ label: "Local amount", value: formatMoney(p.fiatAmount, p.fiatCurrency) });
  if (p.amountUsd != null && p.currency !== "USD" && !/USDC|USDT/.test(p.currency)) lines.push({ label: "USD equivalent", value: formatMoney(p.amountUsd, "USD") });
  if (p.fee != null) lines.push({ label: "Fee", value: formatMoney(p.fee, p.feeCurrency || p.currency) });
  lines.push({ label: "Method", value: p.method });
  if (p.reference) lines.push({ label: "Reference", value: <span className="inline-flex items-center gap-1 font-mono text-[13px]">{p.reference}<CopyButton value={p.reference} label="Copy reference" /></span>, text: p.reference });
  if (p.receiptNumber) lines.push({ label: "Receipt no.", value: <span className="font-mono text-[13px]">{p.receiptNumber}</span>, text: p.receiptNumber });
  if (p.txHash)
    lines.push({
      label: "Transaction",
      value: (
        <a href={explorerTxUrl(p.txHash, p.chain)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[13px] text-accent-primary hover:underline">
          {shortHash(p.txHash, 8, 6)}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      ),
      text: p.txHash,
    });
  return lines;
}

/** Activity detail: the full receipt, rendered inline, with download. */
export function PaymentDrawer({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const p = payment;
  const party = p?.counterparty ? (/^0x[0-9a-f]{20,}$/i.test(p.counterparty) ? shortHash(p.counterparty, 8, 6) : p.counterparty) : undefined;
  return (
    <SideSheet open={!!p} onClose={onClose} testId="payment-drawer" title={p ? p.title : ""}>
      {p && (
        <div className="-mx-5 -my-5">
          <ReceiptCard
            bare
            title={p.title}
            amount={paymentAmount(p)}
            status={p.status}
            date={new Date(p.createdAt)}
            from={p.direction === "in" ? party : "You"}
            to={p.direction === "in" ? "You" : party}
            fromText={p.direction === "in" ? p.counterparty ?? "" : "You"}
            toText={p.direction === "in" ? "You" : p.counterparty ?? ""}
            lines={paymentReceiptLines(p)}
            reference={p.reference ?? p.txHash ?? p.id}
          />
        </div>
      )}
    </SideSheet>
  );
}
