import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Copy, RefreshCw } from "lucide-react";
import { OnrampOrder } from "@/hooks/data/use-onramp-orders";
import { toast } from "sonner";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
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

  const handleViewOnBasescan = () => {
    if (order.transaction_hash) {
      window.open(`https://basescan.org/tx/${order.transaction_hash}`, "_blank");
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
      console.error("Error retrying transaction:", error);
      toast.error("Failed to retry transaction. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  // Show retry button only if there's a receipt_number but NO transaction_hash
  const showRetryButton = order.receipt_number && !order.transaction_hash;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
            <span className="text-accent-primary font-medium text-sm">M</span>
          </div>
          <div>
            <p className="text-sm font-medium">Mobile Money</p>
            <p className="text-xs text-text-subtle">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showRetryButton && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Retry crypto transfer"
            >
              <RefreshCw className={`w-4 h-4 text-accent-primary ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={handleCopyTransactionCode}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Amount */}
      {order.amount && (
        <p className="text-sm font-medium mb-1">
          {currencySymbol} {Number(order.amount).toFixed(2)} ({currency})
        </p>
      )}

      {/* Transaction Code */}
      <p className="text-sm font-medium mb-1">
        {order.transactionCode}
      </p>

      {/* Receipt Code */}
      {order.receipt_number && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-subtle">{order.receipt_number}</p>
          <button
            onClick={handleCopyMpesaCode}
            className="text-xs text-accent-primary hover:text-accent-secondary transition-colors"
          >
            Copy
          </button>
        </div>
      )}

      {/* Transaction Hash */}
      {order.transaction_hash && (
        <button
          onClick={handleViewOnBasescan}
          className="flex items-center gap-1 text-xs text-accent-primary hover:text-accent-secondary transition-colors mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          View on Basescan
        </button>
      )}
    </motion.div>
  );
}