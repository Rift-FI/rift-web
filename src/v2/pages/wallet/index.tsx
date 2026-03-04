import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  IoChevronBack,
  IoAddCircleOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoCashOutline,
  IoArrowUpCircle,
  IoArrowDownCircle,
} from "react-icons/io5";
import useAnalaytics from "@/hooks/use-analytics";
import useOnrampOrders from "@/hooks/data/use-onramp-orders";
import useWithdrawalOrders from "@/hooks/data/use-withdrawal-orders";
import useOnchainHistory from "@/hooks/data/use-onchain-history";
import { useDeposits } from "@/hooks/data/use-deposits";
import HistoryTabs from "@/components/ui/history-tabs";
import ViewAllModal from "@/components/ui/view-all-modal";
import OnrampOrderCard from "@/components/ui/onramp-order-card";
import WithdrawalCard from "@/components/ui/withdrawal-card";
import OnchainTransactionCard from "@/components/ui/onchain-transaction-card";
import { OnchainDepositCard } from "@/components/ui/onchain-deposit-card";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

const ACTIONS = [
  {
    icon: IoAddCircleOutline,
    label: "Top Up",
    event: "TOPUP_BUTTON_CLICKED",
    route: "/app/request?type=topup",
  },
  {
    icon: IoWalletOutline,
    label: "Withdraw",
    event: "WITHDRAW_BUTTON_CLICKED",
    route: "/app/withdraw",
  },
  {
    icon: IoCashOutline,
    label: "Send",
    event: "SEND_BUTTON_CLICKED",
    route: "/app/pay",
  },
  {
    icon: IoReceiptOutline,
    label: "Request",
    event: "REQUEST_BUTTON_CLICKED",
    route: "/app/request?type=request",
  },
  {
    icon: IoArrowUpCircle,
    label: "Send Crypto",
    event: "SEND_CRYPTO_CLICKED",
    route: "/app/send/address",
  },
  {
    icon: IoArrowDownCircle,
    label: "Receive",
    event: "RECEIVE_CRYPTO_CLICKED",
    route: "/app/receive/address",
  },
];

export default function Wallet() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();
  const isDesktop = useDesktopDetection();

  const { data: ONRAMP_ORDERS, isLoading: ONRAMP_LOADING } =
    useOnrampOrders();
  const { data: WITHDRAWAL_ORDERS, isLoading: WITHDRAWALS_LOADING } =
    useWithdrawalOrders();
  const { data: ONCHAIN_TRANSACTIONS, isLoading: ONCHAIN_LOADING } =
    useOnchainHistory();
  const { data: DEPOSITS, isLoading: DEPOSITS_LOADING } = useDeposits();

  const [showAllDeposits, setShowAllDeposits] = useState(false);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [showAllOnchain, setShowAllOnchain] = useState(false);

  useEffect(() => {
    logEvent("PAGE_VISIT_WALLET");
  }, []);

  const viewAllModals = (
    <>
      <ViewAllModal
        isOpen={showAllDeposits}
        onClose={() => setShowAllDeposits(false)}
        title="All Deposits"
        description={`${
          (ONRAMP_ORDERS?.length || 0) + (DEPOSITS?.length || 0)
        } deposits`}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-text-default mb-3">
              Mobile Money Deposits
            </h3>
            {ONRAMP_ORDERS && ONRAMP_ORDERS.length > 0 ? (
              <div className="space-y-3">
                {ONRAMP_ORDERS.map((order) => (
                  <OnrampOrderCard
                    key={order.transactionCode}
                    order={order}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-subtle">
                <p className="text-sm">No mobile money deposits found</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-default mb-3">
              USDC Deposits
            </h3>
            {DEPOSITS && DEPOSITS.length > 0 ? (
              <div className="space-y-3">
                {DEPOSITS.map((deposit) => (
                  <OnchainDepositCard key={deposit.id} deposit={deposit} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-subtle">
                <p className="text-sm">No USDC deposits found</p>
              </div>
            )}
          </div>
        </div>
      </ViewAllModal>

      <ViewAllModal
        isOpen={showAllWithdrawals}
        onClose={() => setShowAllWithdrawals(false)}
        title="All Mobile Money Withdrawals"
        description={`${WITHDRAWAL_ORDERS?.length || 0} withdrawals`}
      >
        {WITHDRAWAL_ORDERS && WITHDRAWAL_ORDERS.length > 0 ? (
          <div className="space-y-3">
            {WITHDRAWAL_ORDERS.map((order) => (
              <WithdrawalCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-subtle">
            <p className="text-sm">No mobile money withdrawals found</p>
          </div>
        )}
      </ViewAllModal>

      <ViewAllModal
        isOpen={showAllOnchain}
        onClose={() => setShowAllOnchain(false)}
        title="All Transfers"
        description={`${ONCHAIN_TRANSACTIONS?.length || 0} transactions`}
      >
        {ONCHAIN_TRANSACTIONS && ONCHAIN_TRANSACTIONS.length > 0 ? (
          <div className="space-y-3">
            {ONCHAIN_TRANSACTIONS.map((transaction) => (
              <OnchainTransactionCard
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-subtle">
            <p className="text-sm">No transfers found</p>
          </div>
        )}
      </ViewAllModal>
    </>
  );

  const actionGrid = (desktop: boolean) => {
    const row1 = ACTIONS.slice(0, 3);
    const row2 = ACTIONS.slice(3);

    const renderButton = (action: (typeof ACTIONS)[number]) => {
      const Icon = action.icon;
      return (
        <button
          key={action.label}
          onClick={() => {
            logEvent(action.event as any);
            navigate(action.route);
          }}
          className={`flex flex-col items-center justify-center gap-2 active:scale-95 transition-all ${
            desktop
              ? "p-4 bg-white rounded-xl border border-gray-100 hover:border-accent-primary/30 hover:bg-accent-primary/5 shadow-sm hover:shadow-md"
              : "py-3"
          }`}
        >
          <div className="rounded-2xl flex items-center justify-center bg-accent-primary/10 w-12 h-12">
            <Icon className="text-accent-primary w-6 h-6" />
          </div>
          <span
            className={`font-medium text-center leading-tight ${
              desktop ? "text-sm text-gray-700" : "text-xs text-text-default"
            }`}
          >
            {action.label}
          </span>
        </button>
      );
    };

    return (
      <div className={desktop ? "grid grid-cols-3 gap-4" : "grid grid-cols-3 gap-1"}>
        {row1.map(renderButton)}
        {row2.map(renderButton)}
      </div>
    );
  };

  const historySection = (
    <HistoryTabs
      onrampOrders={ONRAMP_ORDERS}
      withdrawalOrders={WITHDRAWAL_ORDERS}
      onchainTransactions={ONCHAIN_TRANSACTIONS}
      deposits={DEPOSITS}
      onrampLoading={ONRAMP_LOADING}
      withdrawalsLoading={WITHDRAWALS_LOADING}
      onchainLoading={ONCHAIN_LOADING}
      depositsLoading={DEPOSITS_LOADING}
      onViewAllDeposits={() => setShowAllDeposits(true)}
      onViewAllWithdrawals={() => setShowAllWithdrawals(true)}
      onViewAllOnchain={() => setShowAllOnchain(true)}
    />
  );

  if (isDesktop) {
    return (
      <DesktopPageLayout maxWidth="lg" className="h-full">
        <div className="h-full flex flex-col overflow-hidden bg-app-background">
          {/* Desktop Header */}
          <div className="flex-shrink-0 bg-white rounded-2xl p-6 mx-8 mt-8 mb-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/app")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <IoChevronBack className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {actionGrid(true)}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Transaction History
                </h2>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  {historySection}
                </div>
              </div>
            </div>
          </div>

          {viewAllModals}
        </div>
      </DesktopPageLayout>
    );
  }

  return (
    <div className="h-full flex flex-col bg-app-background">
      {/* Mobile Header */}
      <div className="flex-shrink-0 z-40 bg-surface backdrop-blur-sm border-b border-surface-alt">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate("/app")}
            className="p-1.5 hover:bg-surface-subtle rounded-xl transition-colors"
          >
            <IoChevronBack className="w-5 h-5 text-text-default" />
          </button>
          <h1 className="text-lg font-semibold text-text-default">Wallet</h1>
        </div>
      </div>

      {/* Mobile Content */}
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4 pb-4"
      >
        {/* Action Grid */}
        <div className="mb-5">
          {actionGrid(false)}
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-sm font-medium text-text-subtle mb-2 px-1">
            Transactions
          </h2>
          {historySection}
        </div>
      </motion.div>

      {viewAllModals}
    </div>
  );
}
