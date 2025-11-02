import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Smartphone, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { OfframpOrder } from "@/hooks/data/use-withdrawal-orders";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KES: "KSh",
  NGN: "₦",
  ETB: "Br",
  UGX: "USh",
  GHS: "₵",
  USD: "$",
};

interface WithdrawalCardProps {
  order: OfframpOrder;
}

export default function WithdrawalCard({ order }: WithdrawalCardProps) {
  const currency = (order.currency || "KES") as SupportedCurrency;
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const [isRetrying, setIsRetrying] = useState(false);

  const copyTransactionCode = () => {
    navigator.clipboard.writeText(order.transactionCode);
    toast.success("Transaction code copied!");
  };

  const copyMpesaCode = () => {
    if (order.receipt_number) {
      navigator.clipboard.writeText(order.receipt_number);
      toast.success("Receipt code copied!");
    }
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
      const response = await fetch("https://ramp.riftfi.xyz/api/v1/offramp/retry", {
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
        toast.success("Mobile money transfer retry successful! Funds will be sent shortly.");
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Handle specific error messages
        if (data.message === "Transaction not found" || 
            data.message?.includes("already released") || 
            data.message?.includes("already completed")) {
          toast.info("Transaction was already processed");
        } else {
          toast.error(data.message || "Retry failed. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error retrying withdrawal:", error);
      toast.error("Failed to retry transaction. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  // Show retry button only if there's a transaction_hash but NO receipt_number
  const showRetryButton = order.transaction_hash && !order.receipt_number;

  return (
    <div className="bg-surface-subtle rounded-md p-3 border border-surface">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-3 h-3 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-text-default">Mobile Money</h3>
            <p className="text-xs text-text-subtle">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        {showRetryButton && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="p-1 hover:bg-surface-alt rounded transition-colors disabled:opacity-50 flex-shrink-0"
            title="Retry mobile money transfer"
          >
            <RefreshCw className={`w-4 h-4 text-accent-primary ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Amount */}
        <p className="text-sm font-semibold text-text-default">
          {currencySymbol} {Number(order.amount || 0).toFixed(2)} ({currency})
        </p>
        
        {/* Transaction Code */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-text-subtle truncate flex-1">
            {order.transactionCode}
          </p>
          <button
            onClick={copyTransactionCode}
            className="ml-2 p-1 text-xs bg-surface hover:bg-surface-alt rounded transition-colors"
            title="Copy Transaction Code"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {/* Receipt Number (if available) */}
        {order.receipt_number && (
          <div className="flex justify-between items-center">
            <p className="text-xs text-text-subtle truncate flex-1">
              Receipt: {order.receipt_number}
            </p>
            <button
              onClick={copyMpesaCode}
              className="ml-2 text-xs text-accent-primary hover:text-accent-secondary transition-colors"
              title="Copy Receipt Code"
            >
              Copy
            </button>
          </div>
        )}

        {/* Transaction Hash Link (if available) */}
        {order.transaction_hash && (
          <button
            onClick={handleViewOnBasescan}
            className="flex items-center gap-1 text-xs text-accent-primary hover:text-accent-secondary transition-colors mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            View on Basescan
          </button>
        )}
      </div>
    </div>
  );
}