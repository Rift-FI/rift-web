import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Copy, RefreshCw, Download } from "lucide-react";
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
      const response = await fetch("https://ramp.riftfi.xyz/api/v1/onramp/retry", {
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
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-green-600 font-semibold text-sm">+</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-default">Mobile Money</p>
          {order.amount && (
            <p className="text-sm font-semibold text-green-600">
              +{currencySymbol} {Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          <div className="flex items-center gap-2">
            {order.receipt_number && (
              <button
                onClick={handleCopyMpesaCode}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent-primary transition-colors font-mono"
                title="Copy receipt code"
              >
                {order.receipt_number}
                <Copy className="w-3 h-3" />
              </button>
            )}
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                title="Retry crypto transfer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent-primary ${isRetrying ? 'animate-spin' : ''}`} />
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
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              title="Download receipt"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}