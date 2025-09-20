import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Smartphone, History, ExternalLink } from "lucide-react";
import { IoWalletOutline, IoReceiptOutline, IoCashOutline } from "react-icons/io5";
import ActionButton from "@/v2/pages/home/components/ActionButton";
import { Invoice } from "@/hooks/data/use-invoices";
import { OfframpOrder } from "@/hooks/data/use-withdrawal-orders";
import { OnchainTransaction } from "@/hooks/data/use-onchain-history";
import InvoiceCard from "./invoice-card";
import WithdrawalCard from "./withdrawal-card";
import OnchainTransactionCard from "./onchain-transaction-card";

interface HistoryTabsProps {
  invoices?: Invoice[];
  withdrawalOrders?: OfframpOrder[];
  onchainTransactions?: OnchainTransaction[];
  invoicesLoading?: boolean;
  withdrawalsLoading?: boolean;
  onchainLoading?: boolean;
  onViewAllInvoices?: () => void;
  onViewAllWithdrawals?: () => void;
  onViewAllOnchain?: () => void;
  isAdvancedMode?: boolean; // New prop to control onchain tab visibility
  onWithdrawClick?: () => void;
  onRequestClick?: () => void;
  onPayClick?: () => void;
}

type TabType = "invoices" | "withdrawals" | "onchain";

export default function HistoryTabs({
  invoices = [],
  withdrawalOrders = [],
  onchainTransactions = [],
  invoicesLoading = false,
  withdrawalsLoading = false,
  onchainLoading = false,
  onViewAllInvoices,
  onViewAllWithdrawals,
  onViewAllOnchain,
  isAdvancedMode = false,
  onWithdrawClick,
  onRequestClick,
  onPayClick,
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("invoices");

  // Reset to invoices tab if onchain is selected but not available in simple mode
  useEffect(() => {
    if (activeTab === "onchain" && !isAdvancedMode) {
      setActiveTab("invoices");
    }
  }, [activeTab, isAdvancedMode]);


  const tabs = [
    {
      id: "invoices" as TabType,
      label: "Requests",
      icon: FileText,
    },
    {
      id: "withdrawals" as TabType,
      label: "Withdrawals",
      icon: Smartphone,
    },
    // Only show onchain tab in advanced mode
    ...(isAdvancedMode ? [{
      id: "onchain" as TabType,
      label: "Onchain",
      icon: History,
    }] : []),
  ];

  const renderContent = () => {
    if (activeTab === "invoices") {
      if (invoicesLoading) {
        return (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-subtle rounded-md p-3 animate-pulse">
                <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-surface rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      }

      if (invoices.length === 0) {
        return (
          <div className="text-center py-12 text-text-subtle">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No payment requests yet</p>
            <p className="text-xs">Enable Advanced Mode to create payment requests</p>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {invoices.slice(0, 5).map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
          {invoices.length > 5 && onViewAllInvoices && (
            <button
              onClick={onViewAllInvoices}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent-primary hover:text-accent-secondary font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View All {invoices.length} Requests
            </button>
          )}
        </div>
      );
    }

    // Withdrawals tab
    if (activeTab === "withdrawals") {
      if (withdrawalsLoading) {
          return (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface-subtle rounded-md p-3 animate-pulse">
                  <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-surface rounded w-1/2"></div>
                </div>
              ))}
            </div>
          );
      }

      if (withdrawalOrders.length === 0) {
        return (
          <div className="text-center py-12 text-text-subtle">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No M-Pesa withdrawals yet</p>
            <p className="text-xs">Withdraw your crypto to M-Pesa when ready</p>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {withdrawalOrders.slice(0, 5).map((order) => (
            <WithdrawalCard key={order.id} order={order} />
          ))}
          {withdrawalOrders.length > 5 && onViewAllWithdrawals && (
            <button
              onClick={onViewAllWithdrawals}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent-primary hover:text-accent-secondary font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View All {withdrawalOrders.length} Withdrawals
            </button>
          )}
        </div>
      );
    }

    // Onchain tab
    if (onchainLoading) {
        return (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-subtle rounded-md p-3 animate-pulse">
                <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-surface rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
    }

    if (onchainTransactions.length === 0) {
      return (
        <div className="text-center py-12 text-text-subtle">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium mb-1">No onchain transactions yet</p>
          <p className="text-xs">Your blockchain transactions will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-1.5"> {/* Reduced space for tighter layout */}
        {onchainTransactions.slice(0, 5).map((transaction) => (
          <OnchainTransactionCard key={transaction.id} transaction={transaction} />
        ))}
        {onchainTransactions.length > 5 && onViewAllOnchain && (
          <button
            onClick={onViewAllOnchain}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent-primary hover:text-accent-secondary font-medium transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View All {onchainTransactions.length} Transactions
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Action Buttons - Show only in simple mode */}
      {!isAdvancedMode && (
        <div className="w-full mb-6">
          {/* First row */}
          <div className="w-full flex flex-row items-center justify-center gap-2 mb-3">
            <ActionButton
              icon={<IoWalletOutline className="w-5 h-5" />}
              title="Withdraw"
              onClick={onWithdrawClick}
              className="w-[30%]"
            />

            <ActionButton
              icon={<IoReceiptOutline className="w-5 h-5" />}
              title="Request"
              onClick={onRequestClick}
              className="w-[30%]"
            />

            <ActionButton
              icon={<IoCashOutline className="w-5 h-5" />}
              title="Pay"
              onClick={onPayClick}
              className="w-[30%]"
            />
          </div>
        </div>
      )}

      {/* Tab Headers */}
      <div className="flex border-b border-surface mb-4">{/* Use flex-1 for equal width distribution */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors relative ${
                isActive
                  ? "text-accent-primary"
                  : "text-text-subtle hover:text-text-default"
              }`}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
              {/* Removed count badge for better responsiveness */}
              
              {/* Active tab indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}