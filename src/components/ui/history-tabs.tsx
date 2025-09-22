import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Smartphone, History, ExternalLink } from "lucide-react";
import { IoWalletOutline, IoReceiptOutline, IoCashOutline } from "react-icons/io5";
import ActionButton from "@/v2/pages/home/components/ActionButton";
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
  isAdvancedMode?: boolean; // New prop to control onchain tab visibility
  onWithdrawClick?: () => void;
  onRequestClick?: () => void;
  onPayClick?: () => void;
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
  isAdvancedMode = false,
  onWithdrawClick,
  onRequestClick,
  onPayClick,
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("deposits");
  const [activeDepositSubTab, setActiveDepositSubTab] = useState<DepositSubTabType>("mpesa");

  // Reset to deposits tab if onchain is selected but not available in simple mode
  useEffect(() => {
    if (activeTab === "onchain" && !isAdvancedMode) {
      setActiveTab("deposits");
    }
  }, [activeTab, isAdvancedMode]);


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
    // Only show onchain tab in advanced mode
    ...(isAdvancedMode ? [{
      id: "onchain" as TabType,
      label: "Onchain",
      icon: History,
    }] : []),
  ];

  const renderDepositSubTabs = () => {
    return (
      <div className="mb-6">
        {/* Sleek Segmented Control */}
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex w-full max-w-xs mx-auto">
          <button
            onClick={() => setActiveDepositSubTab("mpesa")}
            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200 relative ${
              activeDepositSubTab === "mpesa"
                ? "bg-white dark:bg-gray-700 text-accent-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>M-Pesa</span>
          </button>
          <button
            onClick={() => setActiveDepositSubTab("onchain")}
            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200 relative ${
              activeDepositSubTab === "onchain"
                ? "bg-white dark:bg-gray-700 text-accent-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <History className="w-4 h-4 flex-shrink-0" />
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
              <div key={i} className="bg-surface-subtle rounded-md p-3 animate-pulse">
                <div className="h-3 bg-surface rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-surface rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      }

      const ordersArray = Array.isArray(onrampOrders) ? onrampOrders : [];
      
      if (ordersArray.length === 0) {
        return (
          <div className="text-center py-12 text-text-subtle">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No M-Pesa deposits yet</p>
            <p className="text-xs">Your M-Pesa deposits will appear here</p>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          {ordersArray.slice(0, 5).map((order) => (
            <OnrampOrderCard key={order.transactionCode} order={order} />
          ))}
          {ordersArray.length > 5 && onViewAllDeposits && (
            <button
              onClick={onViewAllDeposits}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent-primary hover:text-accent-secondary font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View All {ordersArray.length} M-Pesa Deposits
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
            <div key={i} className="bg-surface-subtle rounded-md p-3 animate-pulse">
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
        <div className="text-center py-12 text-text-subtle">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium mb-1">No USDC deposits yet</p>
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
          <div className="w-full flex flex-row items-center justify-center gap-2">
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