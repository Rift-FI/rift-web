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
import useAnalytics from "@/hooks/use-analytics";
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
    label: "Add funds",
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
    label: "Pay",
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
    label: "Send on-chain",
    event: "SEND_CRYPTO_CLICKED",
    route: "/app/send/address",
  },
  {
    icon: IoArrowDownCircle,
    label: "Receive on-chain",
    event: "RECEIVE_CRYPTO_CLICKED",
    route: "/app/receive/address",
  },
];

export default function Wallet() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
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
        title="All Withdrawals"
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
            <p className="text-sm">No withdrawals found</p>
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
          className={`group flex cursor-pointer transition-colors duration-150 bg-white ${
            desktop
              ? "flex-row items-center gap-2.5 h-12 px-4 hover:bg-surface-subtle"
              : "flex-col items-center justify-center gap-1.5 py-3.5 px-2 active:bg-surface-subtle"
          }`}
        >
          <div
            className={`flex items-center justify-center text-accent-primary ${
              desktop ? "w-5 h-5" : "w-9 h-9 rounded-md border border-border bg-surface-subtle"
            }`}
          >
            <Icon className={desktop ? "w-[18px] h-[18px]" : "w-[20px] h-[20px]"} aria-hidden="true" />
          </div>
          <span
            className={`font-semibold leading-tight text-text-default ${
              desktop ? "text-[13px] text-left" : "text-[11.5px] text-center"
            }`}
          >
            {action.label}
          </span>
        </button>
      );
    };

    return (
      <div
        role="group"
        aria-label="Payment actions"
        className={
          desktop
            ? "grid grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden"
            : "grid grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden"
        }
      >
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
      <DesktopPageLayout maxWidth="lg" className="h-full" noScroll>
        <div className="h-full flex flex-col overflow-hidden bg-app-background">
          {/* Desktop Header */}
          <div className="flex-shrink-0 w-[calc(100%-4rem)] max-w-4xl mx-auto pt-8 pb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/app")}
                className="p-2 -ml-2 hover:bg-white rounded-md transition-colors cursor-pointer"
                aria-label="Back"
              >
                <IoChevronBack className="w-5 h-5 text-text-default" />
              </button>
              <div>
                <h1
                  className="text-[22px] font-semibold text-text-default tracking-[-0.015em]"
                  style={{ fontFamily: 'var(--app-font-display)' }}
                >
                  Payments
                </h1>
                <p className="text-[13px] text-text-muted">
                  Move funds in and out, and review account activity.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-8 pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {actionGrid(true)}
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-2.5">
                  Transaction history
                </h2>
                <div className="bg-white rounded-lg border border-border overflow-hidden">
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
      <div className="flex-shrink-0 z-40 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => navigate("/app")}
            className="p-2 -ml-2 hover:bg-surface-subtle rounded-md transition-colors cursor-pointer"
            aria-label="Back"
          >
            <IoChevronBack className="w-5 h-5 text-text-default" />
          </button>
          <h1
            className="text-[16px] font-semibold text-text-default tracking-[-0.01em]"
            style={{ fontFamily: 'var(--app-font-display)' }}
          >
            Payments
          </h1>
        </div>
      </div>

      {/* Mobile Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4 pb-4"
      >
        {/* Action Grid */}
        <div className="mb-5">
          {actionGrid(false)}
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-2">
            Transaction history
          </h2>
          {historySection}
        </div>
      </motion.div>

      {viewAllModals}
    </div>
  );
}
