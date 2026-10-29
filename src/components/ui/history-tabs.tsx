import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Smartphone, History, ExternalLink } from "lucide-react";
import { OnrampOrder } from "@/hooks/data/use-onramp-orders";
import { OfframpOrder } from "@/hooks/data/use-withdrawal-orders";
import { OnchainTransaction } from "@/hooks/data/use-onchain-history";
import { Deposit } from "@/hooks/data/use-deposits";
import OnrampOrderCard from "./onramp-order-card";
import WithdrawalCard from "./withdrawal-card";
import OnchainTransactionCard from "./onchain-transaction-card";
import { OnchainDepositCard } from "./onchain-deposit-card";

interface HistoryTabsProps {
  onrampOrders?: OnrampOrder[];
  withdrawalOrders?: OfframpOrder[];
  onchainTransactions?: OnchainTransaction[];
  deposits?: Deposit[];
  onrampLoading?: boolean;
  withdrawalsLoading?: boolean;
  onchainLoading?: boolean;
  depositsLoading?: boolean;
  onViewAllDeposits?: () => void;
  onViewAllWithdrawals?: () => void;
  onViewAllOnchain?: () => void;
}

type TabType = "deposits" | "withdrawals" | "onchain";
type DepositSubTabType = "mpesa" | "onchain";

export default function HistoryTabs({
  onrampOrders = [],
  withdrawalOrders = [],
  onchainTransactions = [],
  deposits = [],
  onrampLoading = false,
  withdrawalsLoading = false,
  onchainLoading = false,
  depositsLoading = false,
  onViewAllDeposits,
  onViewAllWithdrawals,
  onViewAllOnchain,
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("deposits");
  const [activeDepositSubTab, setActiveDepositSubTab] = useState<DepositSubTabType>("mpesa");

  const tabs = [
    {
      id: "deposits" as TabType,
      label: "Deposits",
      icon: FileText,
    },
    {
      id: "withdrawals" as TabType,
      label: "Withdrawals",
      icon: Smartphone,
    },
    {
      id: "onchain" as TabType,
      label: "Transfers",
      icon: History,
    },
  ];

  const renderDepositSubTabs = () => {
    return (
      <div className="mb-4">
        {/* Segmented Control */}
        <div role="tablist" aria-label="Deposit type" className="bg-surface-subtle border border-border p-0.5 rounded-md inline-flex w-full max-w-xs mx-auto">
          <button
            onClick={() => setActiveDepositSubTab("mpesa")}
            role="tab"
            aria-selected={activeDepositSubTab === "mpesa"}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-sm transition-colors duration-150 relative cursor-pointer ${
              activeDepositSubTab === "mpesa"
                ? "bg-white text-text-default shadow-xs border border-border"
                : "text-text-muted hover:text-text-default border border-transparent"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Mobile Money</span>
          </button>
          <button
            onClick={() => setActiveDepositSubTab("onchain")}
            role="tab"
            aria-selected={activeDepositSubTab === "onchain"}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-sm transition-colors duration-150 relative cursor-pointer ${
              activeDepositSubTab === "onchain"
                ? "bg-white text-text-default shadow-xs border border-border"
                : "text-text-muted hover:text-text-default border border-transparent"
            }`}
          >
            <History className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>USDC</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDepositContent = () => {
    if (activeDepositSubTab === "mpesa") {
      if (onrampLoading) {
        return (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-border rounded-md p-3 animate-pulse">
                <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-surface rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      }

      const ordersArray = Array.isArray(onrampOrders) ? onrampOrders : [];
      const ordersWithReceipt = ordersArray.filter((order) => order?.receipt_number);
      
      if (ordersArray.length === 0) {
        return (
          <div className="text-center py-10 text-text-muted">
            <Smartphone className="w-8 h-8 mx-auto mb-3 text-text-muted/60" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm font-semibold text-text-default mb-1">No mobile money deposits yet</p>
            <p className="text-xs">Your mobile money deposits will appear here</p>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          {ordersWithReceipt.slice(0, 5).map((order) => (
            order?.receipt_number && (
              <OnrampOrderCard key={order.transactionCode} order={order} />
            )
          ))}
          {ordersArray.length > 5 && onViewAllDeposits && (
            <button
              onClick={onViewAllDeposits}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent-primary hover:text-accent-secondary font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View All {ordersArray.length} Mobile Money Deposits
            </button>
          )}
        </div>
      );
    }

    // Onchain deposits subtab
    if (depositsLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-border rounded-md p-3 animate-pulse">
              <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-surface rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    const depositsArray = Array.isArray(deposits) ? deposits : [];
    
    if (depositsArray.length === 0) {
      return (
        <div className="text-center py-10 text-text-muted">
          <History className="w-8 h-8 mx-auto mb-3 text-text-muted/60" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm font-semibold text-text-default mb-1">No USDC deposits yet</p>
          <p className="text-xs">Your on-chain USDC deposits will appear here</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {depositsArray.slice(0, 5).map((deposit) => (
          <OnchainDepositCard key={deposit.id} deposit={deposit} />
        ))}
        {depositsArray.length > 5 && onViewAllDeposits && (
          <button
            onClick={onViewAllDeposits}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent-primary hover:text-accent-secondary font-medium transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View All {depositsArray.length} USDC Deposits
          </button>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === "deposits") {
      return (
        <div>
          {renderDepositSubTabs()}
          {renderDepositContent()}
        </div>
      );
    }

    // Withdrawals tab
    if (activeTab === "withdrawals") {
      if (withdrawalsLoading) {
          return (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-border rounded-md p-3 animate-pulse">
                  <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-surface rounded w-1/2"></div>
                </div>
              ))}
            </div>
          );
      }

      if (withdrawalOrders.length === 0) {
        return (
          <div className="text-center py-10 text-text-muted">
            <Smartphone className="w-8 h-8 mx-auto mb-3 text-text-muted/60" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm font-semibold text-text-default mb-1">No withdrawals yet</p>
            <p className="text-xs">Your withdrawals will appear here</p>
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
              <div key={i} className="bg-white border border-border rounded-md p-3 animate-pulse">
                <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-surface rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
    }

    if (onchainTransactions.length === 0) {
      return (
        <div className="text-center py-10 text-text-muted">
          <History className="w-8 h-8 mx-auto mb-3 text-text-muted/60" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm font-semibold text-text-default mb-1">No onchain transactions yet</p>
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
      {/* Tab Headers */}
      <div role="tablist" aria-label="Transaction type" className="flex gap-5 mb-4 px-4 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              className={`relative flex items-center justify-center gap-1.5 h-11 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer -mb-px border-b-2 ${
                isActive
                  ? "border-accent-primary text-text-default"
                  : "border-transparent text-text-muted hover:text-text-default"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-accent-primary" : ""}`} aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="px-2 pb-2 md:px-3 md:pb-3"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}