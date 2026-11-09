import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Download, ExternalLink } from "lucide-react";
import { downloadReceipt } from "@/lib/receipt";
import { cn } from "@/lib/utils";
import { explorerTxUrl, type Payment } from "@/v2/lib/payments";
import { Button, CopyButton, Row, Rows, SideSheet, StatusPill, formatMoney, shortHash } from "@/v2/ui";

export function DirectionIcon({ direction, className }: { direction: Payment["direction"]; className?: string }) {
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      aria-label={direction === "in" ? "Incoming" : "Outgoing"}
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
        direction === "in" ? "border-success/25 bg-tint-success text-success" : "border-hairline bg-surface-subtle text-ink-2",
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

/** Compact list row (mobile + home "recent payments"). */
export function PaymentListItem({ payment, onOpen }: { payment: Payment; onOpen: (p: Payment) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(payment)}
        data-testid="payment-row"
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-subtle cursor-pointer focus-visible:bg-surface-subtle"
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
          {payment.status !== "succeeded" ? (
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
          <th scope="col" className="w-[120px] px-3 py-2.5 font-medium">Status</th>
          <th scope="col" className="px-3 py-2.5 font-medium">Description</th>
          <th scope="col" className="w-[200px] px-3 py-2.5 font-medium">Counterparty</th>
          <th scope="col" className="w-[150px] px-5 py-2.5 text-right font-medium">Date</th>
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

function receiptFor(p: Payment) {
  return downloadReceipt({
    type: p.direction === "in" ? "deposit" : "withdrawal",
    transactionCode: p.reference || p.txHash || p.id,
    amount: p.amount,
    amountUsd: p.amountUsd ?? null,
    currency: p.currency,
    chain: p.chain,
    token: p.token,
    receipt_number: p.receiptNumber,
    transaction_hash: p.txHash,
    public_name: p.counterparty,
    createdAt: p.createdAt,
    status: p.rawStatus,
  });
}

/** Right-side detail drawer: amount, status, fees, counterparty, hash, receipt. */
export function PaymentDrawer({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const p = payment;
  return (
    <SideSheet
      open={!!p}
      onClose={onClose}
      testId="payment-drawer"
      title={p ? p.title : ""}
      description={p ? format(new Date(p.createdAt), "d MMMM yyyy, HH:mm") : undefined}
      footer={
        p && (
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => receiptFor(p)}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download receipt
            </Button>
            {p.txHash && (
              <Button variant="ghost" onClick={() => window.open(explorerTxUrl(p.txHash!, p.chain), "_blank", "noopener")} aria-label="View on block explorer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )
      }
    >
      {p && (
        <div className="space-y-6">
          <div>
            <p className={cn("text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-numeric", p.direction === "in" ? "text-success" : "text-ink")}>
              {paymentAmount(p)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <StatusPill status={p.status} label={p.rawStatus && p.status === "pending" ? `Pending · ${p.rawStatus.toLowerCase()}` : undefined} />
              <span className="text-[13px] text-ink-3">{p.method}</span>
            </div>
          </div>

          <section aria-label="Summary">
            <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Summary</h3>
            <Rows>
              <Row label="Amount">{formatMoney(p.amount, p.currency)}</Row>
              {p.amountUsd != null && p.currency !== "USD" && !/USDC|USDT/.test(p.currency) && <Row label="USD equivalent">{formatMoney(p.amountUsd, "USD")}</Row>}
              {p.fee != null && <Row label="Fee">{formatMoney(p.fee, p.currency)}</Row>}
              {p.fee != null && (
                <Row label="Total" strong>
                  {formatMoney(p.amount + (p.fee || 0), p.currency)}
                </Row>
              )}
            </Rows>
          </section>

          <section aria-label="Details">
            <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Details</h3>
            <Rows>
              <Row label={p.direction === "in" ? "From" : "To"}>
                <span className="inline-flex items-center gap-1">
                  {p.counterparty && /^0x[0-9a-f]{20,}$/i.test(p.counterparty) ? (
                    <span className="font-mono text-[13px]">{shortHash(p.counterparty, 10, 6)}</span>
                  ) : (
                    <span>{p.counterparty || "—"}</span>
                  )}
                  {p.counterparty && <CopyButton value={p.counterparty} label="Copy counterparty" />}
                </span>
              </Row>
              {p.reference && (
                <Row label="Reference">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-mono text-[13px]">{p.reference}</span>
                    <CopyButton value={p.reference} label="Copy reference" />
                  </span>
                </Row>
              )}
              {p.receiptNumber && <Row label="Receipt no.">{<span className="font-mono text-[13px]">{p.receiptNumber}</span>}</Row>}
              {p.token && <Row label="Asset">{`${p.token.toUpperCase()}${p.chain ? ` on ${p.chain.charAt(0).toUpperCase()}${p.chain.slice(1).toLowerCase()}` : ""}`}</Row>}
              <Row label="Transaction hash">
                {p.txHash ? (
                  <span className="inline-flex items-center gap-1">
                    <a href={explorerTxUrl(p.txHash, p.chain)} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] text-accent-primary hover:underline">
                      {shortHash(p.txHash, 8, 6)}
                    </a>
                    <CopyButton value={p.txHash} label="Copy transaction hash" />
                  </span>
                ) : (
                  <span className="text-ink-3">Not yet on-chain</span>
                )}
              </Row>
            </Rows>
          </section>
        </div>
      )}
    </SideSheet>
  );
}
