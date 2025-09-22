import React from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Deposit } from "../../hooks/data/use-deposits";

interface OnchainDepositCardProps {
  deposit: Deposit;
}

export const OnchainDepositCard: React.FC<OnchainDepositCardProps> = ({ deposit }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return "less than an hour ago";
      } else if (diffInHours === 1) {
        return "about 1 hour ago";
      } else if (diffInHours < 24) {
        return `about ${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
      }
    } catch {
      return dateString;
    }
  };

  const handleCopyTransactionHash = () => {
    navigator.clipboard.writeText(deposit.transactionHash);
    toast.success("Transaction hash copied!");
  };

  const handleCopyFromAddress = () => {
    navigator.clipboard.writeText(deposit.fromAddress);
    toast.success("From address copied!");
  };

  const handleViewOnBasescan = () => {
    window.open(`https://basescan.org/tx/${deposit.transactionHash}`, "_blank");
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
            <span className="text-accent-primary font-medium text-sm">₿</span>
          </div>
          <div>
            <p className="text-sm font-medium">USDC Deposit</p>
            <p className="text-xs text-text-subtle">{formatDate(deposit.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={handleCopyTransactionHash}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* KES Amount */}
      <p className="text-sm font-medium mb-2">
        KES {deposit.kesAmount.toLocaleString()}
      </p>

      {/* From Address */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-subtle">From: {formatAddress(deposit.fromAddress)}</p>
        <button
          onClick={handleCopyFromAddress}
          className="text-xs text-accent-primary hover:text-accent-secondary transition-colors"
        >
          Copy
        </button>
      </div>

      {/* Transaction Hash Link */}
      <button
        onClick={handleViewOnBasescan}
        className="flex items-center gap-1 text-xs text-accent-primary hover:text-accent-secondary transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        View on Basescan
      </button>
    </motion.div>
  );
};