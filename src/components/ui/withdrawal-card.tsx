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
      
      toast.error("Failed to retry transaction. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  // Show retry button only if there's a transaction_hash but NO receipt_number
  const showRetryButton = order.transaction_hash && !order.receipt_number;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-orange-600 font-semibold text-sm">-</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-default">Mobile Money</p>
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
                onClick={copyMpesaCode}
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
                title="Retry mobile money transfer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent-primary ${isRetrying ? 'animate-spin' : ''}`} />
              </button>
            )}
            {order.transaction_hash && (
              <button
                onClick={handleViewOnBasescan}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                title="View on Basescan"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}