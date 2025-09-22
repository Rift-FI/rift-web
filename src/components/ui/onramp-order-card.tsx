import { motion } from "motion/react";
import { ExternalLink, Copy } from "lucide-react";
import { OnrampOrder } from "@/hooks/data/use-onramp-orders";
import { toast } from "sonner";

interface OnrampOrderCardProps {
  order: OnrampOrder;
}

export default function OnrampOrderCard({ order }: OnrampOrderCardProps) {
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
      toast.success("M-Pesa code copied!");
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
            <p className="text-sm font-medium">M-Pesa</p>
            <p className="text-xs text-text-subtle">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={handleCopyTransactionCode}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Amount - we don't have this in the API response, so we'll skip it */}
      
      {/* Transaction Code */}
      <p className="text-sm font-medium mb-1">
        {order.transactionCode}
      </p>

      {/* M-Pesa Code */}
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