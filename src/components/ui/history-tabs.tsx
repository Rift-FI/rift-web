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
            <span>Mobile Money</span>
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
      const ordersWithReceipt = ordersArray.filter((order) => order?.receipt_number);
      
      if (ordersArray.length === 0) {
        return (
          <div className="text-center py-12 text-text-subtle">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No mobile money deposits yet</p>
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
            <p className="text-sm font-medium mb-1">No mobile money withdrawals yet</p>
            <p className="text-xs">Withdraw your crypto to mobile money when ready</p>
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
    <div className="w-full px-1 md:px-0">
      {/* Action Buttons - Show only in simple mode */}
      {!isAdvancedMode && (
        <div className="w-full mb-4">
          <div className="w-full flex flex-row items-stretch justify-evenly gap-2 pl-1 pt-3">
            <ActionButton
              icon={
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                  <IoWalletOutline className="w-6 h-6 text-accent-primary" />
                </div>
              }
              title="Withdraw"
              onClick={onWithdrawClick}
              className="md:px-6"
            />

            <ActionButton
              icon={
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                  <IoReceiptOutline className="w-6 h-6 text-accent-primary" />
                </div>
              }
              title="Request"
              onClick={onRequestClick}
              className="md:px-6"
            />

            <ActionButton
              icon={
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                  <IoCashOutline className="w-6 h-6 text-accent-primary" />
                </div>
              }
              title="Send"
              onClick={onPayClick}
              className="md:px-6"
            />
          </div>
        </div>
      )}

      {/* Tab Headers */}
      <div className="flex gap-2 mb-4 px-1 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-all rounded-full ${
                isActive
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-subtle hover:text-text-default hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
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