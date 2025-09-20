import { formatDistanceToNow } from "date-fns";
import { Smartphone, Copy } from "lucide-react";
import { toast } from "sonner";
import { OfframpOrder } from "@/hooks/data/use-withdrawal-orders";

interface WithdrawalCardProps {
  order: OfframpOrder;
}

export default function WithdrawalCard({ order }: WithdrawalCardProps) {
  const copyTransactionCode = () => {
    navigator.clipboard.writeText(order.transactionCode);
    toast.success("Transaction code copied to clipboard");
  };

  return (
    <div className="bg-surface-subtle rounded-md p-3 border border-surface">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-3 h-3 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-text-default">M-Pesa</h3>
            <p className="text-xs text-text-subtle">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
               <div className="flex-1">
                 <p className="text-sm font-semibold text-text-default">
                   KSh {Number(order.amount || 0).toFixed(2)}
                 </p>
          <p className="text-xs text-text-subtle truncate">
            {order.transactionCode}
          </p>
        </div>
        <div className="ml-2">
          <button
            onClick={copyTransactionCode}
            className="p-1 text-xs bg-surface hover:bg-surface-alt rounded transition-colors"
            title="Copy Transaction Code"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}