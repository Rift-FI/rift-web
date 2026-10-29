import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Copy, RefreshCw, Download, ArrowDownLeft } from "lucide-react";
import { OnrampOrder } from "@/hooks/data/use-onramp-orders";
import { toast } from "sonner";
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

interface OnrampOrderCardProps {
  order: OnrampOrder;
}

export default function OnrampOrderCard({ order }: OnrampOrderCardProps) {
  const currency = (order.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const [isRetrying, setIsRetrying] = useState(false);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyMpesaCode = () => {
    if (order.receipt_number) {
      navigator.clipboard.writeText(order.receipt_number);
      toast.success("Receipt code copied!");
    }
  };

  const handleCopyTransactionCode = () => {
    navigator.clipboard.writeText(order.transactionCode);
    toast.success("Transaction code copied!");
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

  const handleRetry = async () => {
    setIsRetrying(true);
    toast.info("Retrying transaction...");
    
    try {
      // ramp.riftfi.xyz is a legacy onramp retry service. Route via
      // VITE_RAMP_API_URL when set (sandbox uses ramp.sandbox.riftfi.com);
      // fall back to prod host for existing prod builds.
      const rampBase =
        (import.meta.env.VITE_RAMP_API_URL as string | undefined) ||
        "https://ramp.riftfi.xyz";
      const response = await fetch(`${rampBase}/api/v1/onramp/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_code: order.transactionCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Crypto transfer retry successful! Transaction is being processed.");
        // Optionally refresh the page or update the order
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data.message || "Retry failed. Please try again later.");
      }
    } catch (error) {
      
      toast.error("Failed to retry transaction. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  // Show retry button only if there's a receipt_number but NO transaction_hash
  const showRetryButton = order.receipt_number && !order.transaction_hash;

  const truncateCode = (code: string) => {
    if (code.length <= 12) return code;
    return `${code.slice(0, 8)}...${code.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-surface-subtle transition-colors"
    >
      <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
        <ArrowDownLeft className="w-4 h-4 text-success" strokeWidth={1.75} aria-label="Incoming" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-default">Mobile Money</p>
          {order.amount && (
            <p className="text-sm font-semibold text-success tabular-nums">
              +{currencySymbol} {Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-text-muted tabular-nums">{formatDate(order.createdAt)}</p>
          <div className="flex items-center gap-2">
            {order.receipt_number && (
              <button
                onClick={handleCopyMpesaCode}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors font-mono"
                title="Copy receipt code"
                aria-label="Copy receipt code"
              >
                {order.receipt_number}
                <Copy className="w-3 h-3" />
              </button>
            )}
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="p-0.5 hover:bg-surface rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                title="Retry crypto transfer"
                aria-label="Retry crypto transfer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent-primary ${isRetrying ? 'animate-spin' : ''}`} />
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
                type: "deposit",
                transactionCode: order.transactionCode,
                amount: Number(order.amount || 0),
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
    </motion.div>
  );
}