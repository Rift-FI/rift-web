import { formatDistanceToNow } from "date-fns";
import { Copy, ExternalLink, Download, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { OfframpOrder } from "@/hooks/data/use-withdrawal-orders";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { downloadReceipt } from "@/lib/receipt";

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh",
  NGN: "\u20A6",
  UGX: "USh",
  TZS: "TSh",
  CDF: "FC",
  MWK: "MK",
  BRL: "R$",
  ETB: "Br",
  GHS: "\u20B5",
  USD: "$",
};

const CURRENCY_LABELS: Record<string, string> = {
  KES: "Mobile Money",
  NGN: "Bank Transfer",
  UGX: "Mobile Money",
  TZS: "Mobile Money",
  CDF: "Mobile Money",
  MWK: "Mobile Money",
  BRL: "PIX",
  ETB: "Mobile Money",
  GHS: "Mobile Money",
  USD: "Withdrawal",
};

interface WithdrawalCardProps {
  order: OfframpOrder;
}

export default function WithdrawalCard({ order }: WithdrawalCardProps) {
  const currency = (order.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const copyReceiptNumber = () => {
    if (order.receipt_number) {
      navigator.clipboard.writeText(order.receipt_number);
      toast.success("Receipt code copied!");
    }
  };

  const getExplorerUrl = (hash: string, chain?: string | null) => {
    switch (chain?.toLowerCase()) {
      case "ethereum": return `https://etherscan.io/tx/${hash}`;
      case "celo": return `https://celoscan.io/tx/${hash}`;
      case "polygon": return `https://polygonscan.com/tx/${hash}`;
      case "arbitrum": return `https://arbiscan.io/tx/${hash}`;
      case "lisk": return `https://blockscout.lisk.com/tx/${hash}`;
      default: return `https://basescan.org/tx/${hash}`;
    }
  };

  const handleViewOnExplorer = () => {
    if (order.transaction_hash) {
      window.open(getExplorerUrl(order.transaction_hash, order.chain), "_blank");
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-surface-subtle transition-colors">
      <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
        <ArrowUpRight className="w-4 h-4 text-text-default" strokeWidth={1.75} aria-label="Outgoing" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-default">{CURRENCY_LABELS[currency] || "Withdrawal"}</p>
          <p className="text-sm font-semibold text-text-default tabular-nums">
            -{currencySymbol} {Number(order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-text-muted tabular-nums">
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </p>
          <div className="flex items-center gap-2">
            {order.receipt_number && (
              <button
                onClick={copyReceiptNumber}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors font-mono"
                title="Copy receipt code"
                aria-label="Copy receipt code"
              >
                {order.receipt_number}
                <Copy className="w-3 h-3" />
              </button>
            )}
            {order.transaction_hash && (
              <button
                onClick={handleViewOnExplorer}
                className="p-0.5 hover:bg-surface rounded-sm transition-colors cursor-pointer"
                title="View on explorer"
                aria-label="View on explorer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              </button>
            )}
            <button
              onClick={() => downloadReceipt({
                type: "withdrawal",
                transactionCode: order.transactionCode,
                amount: order.amount,
                // Backend returns usdcDeducted — the exact USD equivalent.
                amountUsd: order.usdcDeducted ?? null,
                currency: order.currency,
                chain: order.chain,
                token: order.token,
                receipt_number: order.receipt_number,
                transaction_hash: order.transaction_hash,
                public_name: order.public_name,
                createdAt: order.createdAt,
                status: order.status,
              })}
              className="p-1.5 hover:bg-surface rounded-sm transition-colors active:bg-surface cursor-pointer"
              title="Download receipt"
              aria-label="Download receipt"
            >
              <Download className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
