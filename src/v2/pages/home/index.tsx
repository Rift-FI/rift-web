import { Fragment, useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { IoArrowUpCircle, IoArrowDownCircle, IoWalletOutline, IoReceiptOutline, IoCashOutline } from "react-icons/io5";
import { useDisclosure } from "@/hooks/use-disclosure";
import useBaseUSDCBalance from "@/hooks/data/use-base-usdc-balance";
import useAnalaytics from "@/hooks/use-analytics";
import useInvoices from "@/hooks/data/use-invoices";
import useWithdrawalOrders from "@/hooks/data/use-withdrawal-orders";
import useOnchainHistory from "@/hooks/data/use-onchain-history";
import CurrencySelector, { Currency, SUPPORTED_CURRENCIES } from "@/components/ui/currency-selector";
import AdvancedModeToggle, { useAdvancedMode } from "@/components/ui/advanced-mode-toggle";
import HistoryTabs from "@/components/ui/history-tabs";
import ViewAllModal from "@/components/ui/view-all-modal";
import InvoiceCard from "@/components/ui/invoice-card";
import WithdrawalCard from "@/components/ui/withdrawal-card";
import OnchainTransactionCard from "@/components/ui/onchain-transaction-card";
import RedirectLinks from "@/features/redirectlinks";
import { ReceiveDrawer } from "@/features/receive/ReceiveDrawer";
import { SendDrawer } from "@/features/send/SendDrawer";
import ActionButton from "./components/ActionButton";
import { usePlatformDetection } from "@/utils/platform";
import { backButton } from "@telegram-apps/sdk-react";


export default function Home() {
  const navigate = useNavigate();
  const { data: BASE_USDC_BALANCE, isLoading: BASE_USDC_LOADING } = useBaseUSDCBalance();
  const { logEvent } = useAnalaytics();
  const { isTelegram } = usePlatformDetection();
  const receive_disclosure = useDisclosure();
  const send_disclosure = useDisclosure();

  // Currency state - default to KES
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    SUPPORTED_CURRENCIES.find(c => c.code === "KES") || SUPPORTED_CURRENCIES[0]
  );

  // Advanced mode state
  const { isAdvanced, setIsAdvanced } = useAdvancedMode();

  // Simple mode data
  const { data: INVOICES, isLoading: INVOICES_LOADING } = useInvoices({ 
    sortBy: "createdAt", 
    sortOrder: "desc" 
  });
  const { data: WITHDRAWAL_ORDERS, isLoading: WITHDRAWALS_LOADING } = useWithdrawalOrders();
  
  // Only fetch onchain data in advanced mode
  const { data: ONCHAIN_TRANSACTIONS, isLoading: ONCHAIN_LOADING } = useOnchainHistory();

  // Modal states for viewing all items
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [showAllOnchain, setShowAllOnchain] = useState(false);

  const [isRedirectDrawerOpen, setIsRedirectDrawerOpen] = useState(false);
  const [redirectType, setRedirectType] = useState<
    "RECEIVE-FROM-COLLECT-LINK" | "SEND-TO-REQUEST-LINK"
  >("RECEIVE-FROM-COLLECT-LINK");


  const handleCloseRedirectDrawer = useCallback(() => {
    setIsRedirectDrawerOpen(false);
  }, []);

  const checkRedirectObjects = useCallback(() => {
    const collectobjectb64 = localStorage.getItem("collectobject");
    const requestobjectb64 = localStorage.getItem("requestobject");

    if (collectobjectb64 !== null) {
      setRedirectType("RECEIVE-FROM-COLLECT-LINK");
      setIsRedirectDrawerOpen(true);
    } else if (requestobjectb64 !== null) {
      setRedirectType("SEND-TO-REQUEST-LINK");
      setIsRedirectDrawerOpen(true);
    } else {
      setIsRedirectDrawerOpen(false);
    }
  }, []);


  useEffect(() => {
    checkRedirectObjects();

    const interval = setInterval(checkRedirectObjects, 2000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "collectobject" || e.key === "requestobject") {
        checkRedirectObjects();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    logEvent("PAGE_VISIT_HOME");
  }, []);

  useEffect(() => {
    if (isTelegram) {
      if (backButton.isSupported()) {
        backButton.mount();
      }

      if (backButton.isVisible()) {
        backButton.hide();
      }

      return () => {
        backButton.unmount();
      };
    }
  }, [isTelegram]);

  return (
    <Fragment>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-surface backdrop-blur-sm border-b border-surface-alt">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <img src="/rift.png" alt="Rift" className="w-10 h-10" />
            <span className="text-lg font-semibold text-text-default">Rift</span>
          </div>
          <div className="flex items-center gap-3">
            <AdvancedModeToggle
              isAdvanced={isAdvanced}
              onToggle={setIsAdvanced}
            />
            <CurrencySelector
              selectedCurrency={selectedCurrency.code}
              onCurrencyChange={setSelectedCurrency}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ x: 4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full h-full overflow-y-auto mb-18 p-4"
      >
        {/* Balance Section with margin */}
        <div className="text-center mt-6 mb-8">
          <h1 className="text-4xl mb-2">
            {BASE_USDC_LOADING ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${selectedCurrency.symbol} ${(BASE_USDC_BALANCE?.kesAmount ?? 0).toFixed(2)}`
            )}
          </h1>
        </div>

        {/* Action Buttons - Show only in advanced mode */}
        {isAdvanced && (
          <div className="w-full mb-8">
            {/* First row */}
            <div className="w-full flex flex-row items-center justify-center gap-2 mb-3">
              <SendDrawer
                {...send_disclosure}
                renderTrigger={() => (
                  <ActionButton
                    icon={<IoArrowUpCircle className="w-5 h-5" />}
                    title="Send"
                    className="w-[30%]"
                  />
                )}
              />

              <ReceiveDrawer
                {...receive_disclosure}
                renderTrigger={() => (
                  <ActionButton
                    icon={<IoArrowDownCircle className="w-5 h-5" />}
                    title="Address"
                    className="w-[30%]"
                  />
                )}
              />

              <ActionButton
                icon={<IoWalletOutline className="w-5 h-5" />}
                title="Withdraw"
                className="w-[30%]"
                onClick={() => {
                  logEvent("WITHDRAW_BUTTON_CLICKED");
                  navigate("/app/withdraw");
                }}
              />
            </div>
            
            {/* Second row */}
            <div className="w-full flex flex-row items-center justify-center gap-2">
              <ActionButton
                icon={<IoReceiptOutline className="w-5 h-5" />}
                title="Request"
                className="w-[30%]"
                onClick={() => {
                  logEvent("REQUEST_BUTTON_CLICKED");
                  navigate("/app/request");
                }}
              />

              <ActionButton
                icon={<IoCashOutline className="w-5 h-5" />}
                title="Pay"
                className="w-[30%]"
              />
              
              {/* Empty space to balance the layout */}
              <div className="w-[30%]"></div>
            </div>
          </div>
        )}

        {/* History Tabs - Show in both modes */}
        <div className="w-full">
          <HistoryTabs
            invoices={INVOICES}
            withdrawalOrders={WITHDRAWAL_ORDERS}
            onchainTransactions={ONCHAIN_TRANSACTIONS}
            invoicesLoading={INVOICES_LOADING}
            withdrawalsLoading={WITHDRAWALS_LOADING}
            onchainLoading={ONCHAIN_LOADING}
            onViewAllInvoices={() => setShowAllInvoices(true)}
            onViewAllWithdrawals={() => setShowAllWithdrawals(true)}
            onViewAllOnchain={() => setShowAllOnchain(true)}
            isAdvancedMode={isAdvanced}
            onWithdrawClick={() => {
              logEvent("WITHDRAW_BUTTON_CLICKED");
              navigate("/app/withdraw");
            }}
            onRequestClick={() => {
              logEvent("REQUEST_BUTTON_CLICKED");
              navigate("/app/request");
            }}
            onPayClick={() => {
              logEvent("PAY_BUTTON_CLICKED");
              navigate("/app/pay");
            }}
          />
        </div>

        <RedirectLinks
          isOpen={isRedirectDrawerOpen}
          onClose={handleCloseRedirectDrawer}
          redirectType={redirectType}
        />
      </motion.div>


      {/* View All Modals */}
      <ViewAllModal
        isOpen={showAllInvoices}
        onClose={() => setShowAllInvoices(false)}
        title="All Payment Requests"
        description={`${INVOICES?.length || 0} payment requests`}
      >
        {INVOICES && INVOICES.length > 0 ? (
          <div className="space-y-3">
            {INVOICES.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-subtle">
            <p className="text-sm">No payment requests found</p>
          </div>
        )}
      </ViewAllModal>

      <ViewAllModal
        isOpen={showAllWithdrawals}
        onClose={() => setShowAllWithdrawals(false)}
        title="All M-Pesa Withdrawals"
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
            <p className="text-sm">No M-Pesa withdrawals found</p>
          </div>
        )}
      </ViewAllModal>

      <ViewAllModal
        isOpen={showAllOnchain}
        onClose={() => setShowAllOnchain(false)}
        title="All Onchain Transactions"
        description={`${ONCHAIN_TRANSACTIONS?.length || 0} transactions`}
      >
        {ONCHAIN_TRANSACTIONS && ONCHAIN_TRANSACTIONS.length > 0 ? (
          <div className="space-y-3">
            {ONCHAIN_TRANSACTIONS.map((transaction) => (
              <OnchainTransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-subtle">
            <p className="text-sm">No onchain transactions found</p>
          </div>
        )}
      </ViewAllModal>
    </Fragment>
  );
}
