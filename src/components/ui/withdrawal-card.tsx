import { formatDistanceToNow } from "date-fns";
import { Copy, ExternalLink, Download } from "lucide-react";
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
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-orange-600 font-semibold text-sm">-</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-default">{CURRENCY_LABELS[currency] || "Withdrawal"}</p>
          <p className="text-sm font-semibold text-text-default">
            -{currencySymbol} {Number(order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </p>
          <div className="flex items-center gap-2">
            {order.receipt_number && (
              <button
                onClick={copyReceiptNumber}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent-primary transition-colors font-mono"
                title="Copy receipt code"
              >
                {order.receipt_number}
                <Copy className="w-3 h-3" />
              </button>
            )}
            {order.transaction_hash && (
              <button
                onClick={handleViewOnExplorer}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
            <button
              onClick={() => downloadReceipt({
                type: "withdrawal",
                transactionCode: order.transactionCode,
                amount: order.amount,
                currency: order.currency,
                chain: order.chain,
                token: order.token,
                receipt_number: order.receipt_number,
                transaction_hash: order.transaction_hash,
                public_name: order.public_name,
                createdAt: order.createdAt,
                status: order.status,
              })}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              title="Download receipt"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
