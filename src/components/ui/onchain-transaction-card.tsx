import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { OnchainTransaction } from "@/hooks/data/use-onchain-history";

interface OnchainTransactionCardProps {
  transaction: OnchainTransaction;
}

export default function OnchainTransactionCard({ transaction }: OnchainTransactionCardProps) {
  const copyTransactionHash = () => {
    // Extract just the hash from the full URL
    const hashMatch = transaction.transactionHash.match(/0x[a-fA-F0-9]+$/);
    const hash = hashMatch ? hashMatch[0] : transaction.transactionHash;
    navigator.clipboard.writeText(hash);
    toast.success("Transaction hash copied to clipboard");
  };

  const viewOnBlockExplorer = () => {
    // Use the full URL from the API response
    window.open(transaction.transactionHash, '_blank');
  };

  const isReceive = transaction.type === "receive";
  const Icon = isReceive ? ArrowDownLeft : ArrowUpRight;
  const iconColor = isReceive ? "text-green-600" : "text-blue-600";
  const amountPrefix = isReceive ? "+" : "-";

  // Extract hash for display
  const hashMatch = transaction.transactionHash.match(/0x[a-fA-F0-9]+$/);
  const displayHash = hashMatch ? hashMatch[0] : transaction.transactionHash;

  // Determine destination type for better UX
  const isPhoneNumber = /^\d+$/.test(transaction.recipientAddress);
  const destinationType = isReceive ? "Received" : (isPhoneNumber ? "M-Pesa" : "Address");

  return (
    <div className="bg-surface-subtle rounded-md p-2.5 border border-surface"> {/* Reduced padding */}
      <div className="flex justify-between items-start mb-1.5"> {/* Reduced margin */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0"> {/* Reduced gap */}
          <div className={`w-5 h-5 bg-surface rounded-full flex items-center justify-center flex-shrink-0`}> {/* Smaller icon container */}
            <Icon className={`w-2.5 h-2.5 ${iconColor}`} /> {/* Smaller icon */}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-text-default"> {/* Smaller font */}
              {destinationType} • {transaction.chain}
            </h3>
            <p className="text-xs text-text-subtle"> {/* Smaller font */}
              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper truncation */}
          <p className="text-xs font-semibold text-text-default"> {/* Smaller font */}
            {amountPrefix}{Number(transaction.amount || 0).toFixed(2)} {transaction.token}
          </p>
          <p className="text-xs text-text-subtle truncate"> {/* Smaller font */}
            {displayHash.slice(0, 8)}...{displayHash.slice(-6)}
          </p>
        </div>
        <div className="flex gap-1 ml-1.5 flex-shrink-0"> {/* Reduced margin, prevent shrinking */}
          <button
            onClick={copyTransactionHash}
            className="p-1 text-xs bg-surface hover:bg-surface-alt rounded transition-colors"
            title="Copy Transaction Hash"
          >
            <Copy className="w-2.5 h-2.5" /> {/* Smaller icon */}
          </button>
          <button
            onClick={viewOnBlockExplorer}
            className="p-1 text-xs bg-accent-primary text-white hover:bg-accent-secondary rounded transition-colors"
            title="View on Block Explorer"
          >
            <ExternalLink className="w-2.5 h-2.5" /> {/* Smaller icon */}
          </button>
        </div>
      </div>
    </div>
  );
}