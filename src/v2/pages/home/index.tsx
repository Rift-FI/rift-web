import { Fragment, useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { IoArrowUpCircle, IoArrowDownCircle, IoWalletOutline, IoReceiptOutline, IoCashOutline, IoEyeOutline, IoEyeOffOutline, IoAddCircleOutline, IoTrophyOutline } from "react-icons/io5";
import { useDisclosure } from "@/hooks/use-disclosure";
import useBaseUSDCBalance, { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCountryDetection from "@/hooks/data/use-country-detection";
import useLoyaltyStats from "@/hooks/data/use-loyalty-stats";
import usePointValue from "@/hooks/data/use-point-value";
import useAnalaytics from "@/hooks/use-analytics";
import useOnrampOrders from "@/hooks/data/use-onramp-orders";
import useWithdrawalOrders from "@/hooks/data/use-withdrawal-orders";
import useOnchainHistory from "@/hooks/data/use-onchain-history";
import { useDeposits } from "@/hooks/data/use-deposits";
import CurrencySelector, { Currency, SUPPORTED_CURRENCIES } from "@/components/ui/currency-selector";
import AdvancedModeToggle, { useAdvancedMode } from "@/components/ui/advanced-mode-toggle";
import HistoryTabs from "@/components/ui/history-tabs";
import ViewAllModal from "@/components/ui/view-all-modal";
import OnrampOrderCard from "@/components/ui/onramp-order-card";
import WithdrawalCard from "@/components/ui/withdrawal-card";
import OnchainTransactionCard from "@/components/ui/onchain-transaction-card";
import { OnchainDepositCard } from "@/components/ui/onchain-deposit-card";
import { Skeleton } from "@/components/ui/skeleton";
import RedirectLinks from "@/features/redirectlinks";
import { ReceiveDrawer } from "@/features/receive/ReceiveDrawer";
import { SendDrawer } from "@/features/send/SendDrawer";
import ActionButton from "./components/ActionButton";
import { usePlatformDetection } from "@/utils/platform";
import { backButton } from "@telegram-apps/sdk-react";
import { formatNumberWithCommas } from "@/lib/utils";


export default function Home() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();
  const { isTelegram } = usePlatformDetection();
  const receive_disclosure = useDisclosure();
  const send_disclosure = useDisclosure();

  // Detect user's country and currency based on IP
  const { data: countryInfo, isLoading: countryLoading } = useCountryDetection();

  // Currency state - initialize with stored or detected currency
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    // Try to load from localStorage first
    const stored = localStorage.getItem("selected_currency");
    if (stored) {
      const currency = SUPPORTED_CURRENCIES.find(c => c.code === stored);
      if (currency) return currency;
    }
    return SUPPORTED_CURRENCIES.find(c => c.code === "USD") || SUPPORTED_CURRENCIES[0];
  });

  // Update selected currency when country is detected (only on first load)
  useEffect(() => {
    if (countryInfo && !countryLoading) {
      const stored = localStorage.getItem("selected_currency");
      // Only auto-set if user hasn't manually selected one
      if (!stored) {
        const detectedCurrency = SUPPORTED_CURRENCIES.find(
          c => c.code === countryInfo.currency
        );
        if (detectedCurrency) {
          setSelectedCurrency(detectedCurrency);
          localStorage.setItem("selected_currency", detectedCurrency.code);
        }
      }
    }
  }, [countryInfo, countryLoading]);

  // Save to localStorage when currency changes
  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selected_currency", currency.code);
  };

  // Fetch balance with selected currency
  const { data: BASE_USDC_BALANCE, isLoading: BASE_USDC_LOADING } = useBaseUSDCBalance({
    currency: selectedCurrency.code as SupportedCurrency,
  });

  // Fetch loyalty stats and point value
  const { data: loyaltyStats, isLoading: loyaltyLoading } = useLoyaltyStats();
  const { data: pointValue } = usePointValue();
  
  // Debug logging
  useEffect(() => {
    console.log("🏠 [Home] Loyalty stats:", loyaltyStats);
    console.log("🏠 [Home] Loyalty loading:", loyaltyLoading);
    console.log("🏠 [Home] Should show badge:", !!(loyaltyStats && !loyaltyLoading));
  }, [loyaltyStats, loyaltyLoading]);

  // Advanced mode state
  const { isAdvanced, setIsAdvanced } = useAdvancedMode();

  // Balance visibility state
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Simple mode data
  const { data: ONRAMP_ORDERS, isLoading: ONRAMP_LOADING } = useOnrampOrders();
  const { data: WITHDRAWAL_ORDERS, isLoading: WITHDRAWALS_LOADING } = useWithdrawalOrders();
  const { data: DEPOSITS, isLoading: DEPOSITS_LOADING } = useDeposits();
  
  // Only fetch onchain data in advanced mode
  const { data: ONCHAIN_TRANSACTIONS, isLoading: ONCHAIN_LOADING } = useOnchainHistory();

  // Modal states for viewing all items
  const [showAllDeposits, setShowAllDeposits] = useState(false);
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
              onCurrencyChange={handleCurrencyChange}
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
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl mb-2">
              {BASE_USDC_LOADING || countryLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : !BASE_USDC_BALANCE ? (
                <Skeleton className="h-10 w-32 inline-block" />
              ) : isBalanceVisible ? (
                `${formatNumberWithCommas(BASE_USDC_BALANCE.localAmount)} ${selectedCurrency.code}`
              ) : (
                `**** ${selectedCurrency.code}`
              )}
            </h1>
            <button
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
              title={isBalanceVisible ? "Hide balance" : "Show balance"}
            >
              {isBalanceVisible ? (
                <IoEyeOutline className="w-5 h-5 text-text-subtle" />
              ) : (
                <IoEyeOffOutline className="w-5 h-5 text-text-subtle" />
              )}
            </button>
          </div>

          {/* Rift Points - Next to Balance */}
          {loyaltyStats && !loyaltyLoading && loyaltyStats.totalPoints !== undefined && (
            <button
              onClick={() => navigate("/app/profile/loyalty")}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <IoTrophyOutline className="w-4 h-4" />
              <span>{formatNumberWithCommas(loyaltyStats.totalPoints)} Rift Points</span>
            </button>
          )}
          
          {/* Top Up Button - Integrated with balance */}
          <div className="mt-4">
            <button
              onClick={() => {
                logEvent("TOPUP_BUTTON_CLICKED");
                navigate("/app/request?type=topup");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <IoAddCircleOutline className="w-4 h-4" />
              Top Up
            </button>
          </div>
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
                className={selectedCurrency.code === "KES" ? "w-[30%]" : "w-[45%]"}
                onClick={() => {
                  logEvent("REQUEST_BUTTON_CLICKED");
                  navigate("/app/request?type=request");
                }}
              />

              <ActionButton
                icon={<IoCashOutline className="w-5 h-5" />}
                title="Send"
                className="w-[30%]"
                onClick={() => {
                  logEvent("SEND_BUTTON_CLICKED");
                  navigate("/app/pay");
                }}
              />
            </div>
          </div>
        )}

        {/* History Tabs - Show in both modes */}
        <div className="w-full">
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
            isAdvancedMode={isAdvanced}
            onWithdrawClick={() => {
              logEvent("WITHDRAW_BUTTON_CLICKED");
              navigate("/app/withdraw");
            }}
            onRequestClick={() => {
              logEvent("REQUEST_BUTTON_CLICKED");
              navigate("/app/request?type=request");
            }}
            onPayClick={() => {
              logEvent("SEND_BUTTON_CLICKED");
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
        isOpen={showAllDeposits}
        onClose={() => setShowAllDeposits(false)}
        title="All Deposits"
        description={`${(ONRAMP_ORDERS?.length || 0) + (DEPOSITS?.length || 0)} deposits`}
      >
        <div className="space-y-6">
          {/* Mobile Money Deposits Section */}
          <div>
            <h3 className="text-sm font-medium text-text-default mb-3">Mobile Money Deposits</h3>
            {ONRAMP_ORDERS && ONRAMP_ORDERS.length > 0 ? (
              <div className="space-y-3">
                {ONRAMP_ORDERS.map((order) => (
                  <OnrampOrderCard key={order.transactionCode} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-subtle">
                <p className="text-sm">No mobile money deposits found</p>
              </div>
            )}
          </div>

          {/* USDC Deposits Section */}
          <div>
            <h3 className="text-sm font-medium text-text-default mb-3">USDC Deposits</h3>
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
