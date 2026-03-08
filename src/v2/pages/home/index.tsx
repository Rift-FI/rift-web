import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

import { forceClearCacheAndRefresh } from "@/utils/auto-update";
import { IoChevronForward, IoCloseOutline } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import { Shield, PiggyBank, Repeat, PieChart, Coins } from "lucide-react";
import {
  IoWalletOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoAddCircleOutline,
  IoSwapHorizontalOutline,
  IoSparkles,
} from "react-icons/io5";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCountryDetection from "@/hooks/data/use-country-detection";
import useAnalaytics from "@/hooks/use-analytics";
import CurrencySelector, {
  Currency,
  SUPPORTED_CURRENCIES,
} from "@/components/ui/currency-selector";
import { Skeleton } from "@/components/ui/skeleton";
import RedirectLinks from "@/features/redirectlinks";
import { usePlatformDetection } from "@/utils/platform";
import { backButton } from "@telegram-apps/sdk-react";
import { formatNumberWithCommas } from "@/lib/utils";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import RiftLoader from "@/components/ui/rift-loader";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";

const COMING_SOON_FEATURES = [
  {
    title: "Save",
    description: "Set savings goals",
    icon: PiggyBank,
  },
  {
    title: "Subscriptions",
    description: "Recurring payments",
    icon: Repeat,
  },
  {
    title: "Track Spending",
    description: "Budget buckets",
    icon: PieChart,
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();
  const { isTelegram } = usePlatformDetection();
  const isDesktop = useDesktopDetection();

  // Recovery warning
  const { userQuery } = useWalletAuth();
  const hasPassword = !!userQuery?.data?.externalId;
  const userIdentifier = userQuery?.data?.phoneNumber || userQuery?.data?.email;
  const userIdentifierType: "phone" | "email" | undefined = userQuery?.data?.phoneNumber
    ? "phone"
    : userQuery?.data?.email
    ? "email"
    : undefined;

  const {
    recoveryMethodsQuery,
    recoveryOptionsByIdentifierQuery,
    myRecoveryMethodsQuery,
  } = useWalletRecovery({
    externalId: userQuery?.data?.externalId,
    identifier: !hasPassword ? userIdentifier : undefined,
    identifierType: !hasPassword ? userIdentifierType : undefined,
  });

  const recoveryEmail = myRecoveryMethodsQuery.data?.recovery?.email
    || (hasPassword
      ? recoveryMethodsQuery.data?.recoveryOptions?.email
      : recoveryOptionsByIdentifierQuery.data?.recoveryOptions?.email);
  const recoveryPhone = myRecoveryMethodsQuery.data?.recovery?.phoneNumber
    || (hasPassword
      ? recoveryMethodsQuery.data?.recoveryOptions?.phone
      : recoveryOptionsByIdentifierQuery.data?.recoveryOptions?.phone);

  const hasNoRecovery = !recoveryEmail && !recoveryPhone;
  const recoveryDataLoaded =
    myRecoveryMethodsQuery.isFetched ||
    recoveryMethodsQuery.isFetched ||
    recoveryOptionsByIdentifierQuery.isFetched;

  const [recoveryDismissed, setRecoveryDismissed] = useState(() => {
    const dismissed = localStorage.getItem("recovery_warning_dismissed");
    if (!dismissed) return false;
    return Date.now() - parseInt(dismissed, 10) < 24 * 60 * 60 * 1000;
  });

  const dismissRecoveryWarning = () => {
    localStorage.setItem("recovery_warning_dismissed", Date.now().toString());
    setRecoveryDismissed(true);
  };

  const showRecoveryWarning = recoveryDataLoaded && hasNoRecovery && !recoveryDismissed;

  // Detect user's country and currency based on IP
  const { data: countryInfo, isLoading: countryLoading } =
    useCountryDetection();

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    const stored = localStorage.getItem("selected_currency");
    if (stored) {
      const currency = SUPPORTED_CURRENCIES.find((c) => c.code === stored);
      if (currency) return currency;
    }
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === "USD") ||
      SUPPORTED_CURRENCIES[0]
    );
  });

  useEffect(() => {
    if (countryInfo && !countryLoading) {
      const stored = localStorage.getItem("selected_currency");
      if (!stored) {
        const detectedCurrency = SUPPORTED_CURRENCIES.find(
          (c) => c.code === countryInfo.currency
        );
        if (detectedCurrency) {
          setSelectedCurrency(detectedCurrency);
          localStorage.setItem("selected_currency", detectedCurrency.code);
        }
      }
    }
  }, [countryInfo, countryLoading]);

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selected_currency", currency.code);
    logEvent("CURRENCY_CHANGED", {
      currency: currency.code,
      currency_name: currency.name,
    });
  };

  // Fetch aggregate balance across all chains and tokens
  const { data: BALANCE, isLoading: BALANCE_LOADING } =
    useAggregateBalance({
      currency: selectedCurrency.code as SupportedCurrency,
    });

  // Balance visibility state
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Redirect links
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

  // Recovery warning
  const recoveryWarning = (mobile: boolean) => (
    <AnimatePresence>
      {showRecoveryWarning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`overflow-hidden ${mobile ? "mb-4" : ""}`}
        >
          <div
            className={`flex items-center gap-3 ${
              mobile ? "p-3" : "p-4"
            } bg-amber-50 border border-amber-200 rounded-2xl`}
          >
            <div
              className={`${
                mobile ? "w-8 h-8 rounded-lg" : "w-9 h-9 rounded-xl"
              } bg-amber-500/10 flex items-center justify-center flex-shrink-0`}
            >
              <Shield className={`${mobile ? "w-4 h-4" : "w-4.5 h-4.5"} text-amber-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${mobile ? "text-xs" : "text-sm"} font-medium text-amber-900`}>
                {mobile ? "No recovery method" : "No recovery method set up"}
              </p>
              <p className={`${mobile ? "text-2xs" : "text-xs"} text-amber-700 ${mobile ? "" : "mt-0.5"}`}>
                {mobile
                  ? "You could lose access to your account"
                  : "You risk losing access to your account. Add a recovery email or phone number."}
              </p>
            </div>
            <button
              onClick={() => navigate("/app/profile")}
              className={`${
                mobile
                  ? "px-2.5 py-1 text-2xs rounded-lg"
                  : "px-3 py-1.5 text-xs rounded-xl"
              } bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex-shrink-0`}
            >
              Set Up
            </button>
            <button
              onClick={dismissRecoveryWarning}
              className={`${
                mobile ? "p-0.5" : "p-1"
              } text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0`}
            >
              <IoCloseOutline className={`${mobile ? "w-4 h-4" : "w-5 h-5"}`} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isDesktop) {
    return (
      <div className="h-full flex flex-col">
        {/* Desktop Header */}
        <div className="flex-shrink-0 z-40 bg-white border-b border-gray-200">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back</p>
              </div>
              <div className="flex items-center gap-3">
                <CurrencySelector
                  selectedCurrency={selectedCurrency.code}
                  onCurrencyChange={handleCurrencyChange}
                />
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ x: 4, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-8"
        >
          <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* Desktop Balance Card */}
            <div
              id="balance-section"
              className="bg-gradient-to-br from-accent-primary to-teal-700 rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-medium text-white/70">Total Balance</p>
                    <button
                      onClick={() => {
                        setIsBalanceVisible(!isBalanceVisible);
                        logEvent("BALANCE_VISIBILITY_TOGGLED", { visible: !isBalanceVisible });
                      }}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isBalanceVisible ? (
                        <IoEyeOutline className="w-4 h-4 text-white/60" />
                      ) : (
                        <IoEyeOffOutline className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                    <button
                      onClick={() => forceClearCacheAndRefresh()}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                  <h1 className="text-5xl font-bold text-white">
                    {BALANCE_LOADING || countryLoading ? (
                      <RiftLoader message="Loading balance..." />
                    ) : !BALANCE ? (
                      <Skeleton className="h-12 w-40 inline-block" />
                    ) : isBalanceVisible ? (
                      `${formatNumberWithCommas(BALANCE.localAmount)} ${selectedCurrency.code}`
                    ) : (
                      `**** ${selectedCurrency.code}`
                    )}
                  </h1>
                  {BALANCE && isBalanceVisible && selectedCurrency.code !== "USD" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-white/70">${BALANCE.totalUsd.toFixed(2)} USD</span>
                      <IoSwapHorizontalOutline className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs text-white/50">1 USD = {BALANCE.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.code}</span>
                    </div>
                  )}
                </div>
                <button
                  id="topup-button"
                  onClick={() => {
                    logEvent("TOPUP_BUTTON_CLICKED");
                    navigate("/app/request?type=topup");
                  }}
                  className="px-8 py-4 bg-white text-accent-primary rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors shadow-md"
                >
                  Top Up
                </button>
              </div>
            </div>

            {recoveryWarning(false)}

            {/* Desktop Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                id="wallet-card"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => {
                  logEvent("WALLET_CARD_CLICKED");
                  navigate("/app/wallet");
                }}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-accent-primary/[0.04] border border-accent-primary/10 cursor-pointer hover:bg-accent-primary/[0.07] hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
                  <IoWalletOutline className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Wallet</h3>
                  <p className="text-sm text-gray-500">Send, receive & manage money</p>
                </div>
                <IoChevronForward className="w-5 h-5 text-accent-primary/30 group-hover:text-accent-primary/60 group-hover:translate-x-0.5 transition-all" />
              </motion.div>

              <motion.div
                id="assets-card"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12 }}
                onClick={() => {
                  navigate("/app/assets");
                }}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-accent-primary/[0.04] border border-accent-primary/10 cursor-pointer hover:bg-accent-primary/[0.07] hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Crypto Assets</h3>
                  <p className="text-sm text-gray-500">View all your tokens</p>
                </div>
                <IoChevronForward className="w-5 h-5 text-accent-primary/30 group-hover:text-accent-primary/60 group-hover:translate-x-0.5 transition-all" />
              </motion.div>

              <motion.div
                id="earn-card"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.14 }}
                onClick={() => {
                  logEvent("EARN_CARD_CLICKED");
                  navigate("/app/invest");
                }}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-accent-primary/[0.04] border border-accent-primary/10 cursor-pointer hover:bg-accent-primary/[0.07] hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
                  <IoSparkles className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Earn</h3>
                  <p className="text-sm text-gray-500">Invest and grow your money</p>
                </div>
                <IoChevronForward className="w-5 h-5 text-accent-primary/30 group-hover:text-accent-primary/60 group-hover:translate-x-0.5 transition-all" />
              </motion.div>
            </div>

            {/* Desktop Coming Soon */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Coming Soon</p>
              <div className="grid grid-cols-3 gap-4">
                {COMING_SOON_FEATURES.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-accent-primary/[0.02] border border-accent-primary/[0.06]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent-primary/[0.06] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-accent-primary/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-500">{item.title}</h3>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <RedirectLinks
            isOpen={isRedirectDrawerOpen}
            onClose={handleCloseRedirectDrawer}
            redirectType={redirectType}
          />
        </motion.div>
      </div>
    );
  }

  // ─── Mobile Layout ───
  return (
    <div className="h-full flex flex-col bg-app-background">
      {/* Mobile Header */}
      <div className="flex-shrink-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="flex justify-between items-center px-5 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/rift.png" alt="Rift" className="w-8 h-8" />
            <span className="text-base font-bold text-text-default">
              Rift
            </span>
          </div>
          <CurrencySelector
            selectedCurrency={selectedCurrency.code}
            onCurrencyChange={handleCurrencyChange}
          />
        </div>
      </div>

      {/* Mobile Content */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pt-2 pb-6"
      >
        {/* Balance Section */}
        <div id="balance-section" className="mb-6 mt-6 text-center">
          <p className="text-xs text-text-subtle/50 mb-2">{getGreeting()}</p>

          {/* Balance amount */}
          {BALANCE_LOADING || countryLoading ? (
            <RiftLoader message="Loading balance..." />
          ) : !BALANCE ? (
            <Skeleton className="h-10 w-36 mx-auto" />
          ) : isBalanceVisible ? (
            <h1 className="text-[2.25rem] font-bold text-text-default leading-none tracking-tight">
              {formatNumberWithCommas(BALANCE.localAmount)}
              <span className="text-base font-medium text-text-subtle/60 ml-1">{selectedCurrency.code}</span>
            </h1>
          ) : (
            <h1 className="text-[2.25rem] font-bold text-text-default leading-none">
              ****
              <span className="text-base font-medium text-text-subtle/60 ml-1">{selectedCurrency.code}</span>
            </h1>
          )}

          {/* Eye + Refresh icons */}
          <div className="flex items-center justify-center gap-1 mt-2">
            <button
              onClick={() => {
                setIsBalanceVisible(!isBalanceVisible);
                logEvent("BALANCE_VISIBILITY_TOGGLED", { visible: !isBalanceVisible });
              }}
              className="p-1.5 rounded-lg transition-colors"
            >
              {isBalanceVisible ? (
                <IoEyeOutline className="w-4 h-4 text-text-subtle/40" />
              ) : (
                <IoEyeOffOutline className="w-4 h-4 text-text-subtle/40" />
              )}
            </button>
            <button
              onClick={() => forceClearCacheAndRefresh()}
              className="p-1.5 rounded-lg transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5 text-text-subtle/30" />
            </button>
          </div>

          {BALANCE && isBalanceVisible && selectedCurrency.code !== "USD" && (
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <span className="text-xs text-text-subtle/50">${BALANCE.totalUsd.toFixed(2)} USD</span>
              <span className="text-xs text-text-subtle/20">|</span>
              <span className="text-xs text-text-subtle/40">1 USD = {BALANCE.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.code}</span>
            </div>
          )}

          {/* Top Up Button */}
          <button
            id="topup-button"
            onClick={() => {
              logEvent("TOPUP_BUTTON_CLICKED");
              navigate("/app/request?type=topup");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 mt-2 bg-accent-primary text-white rounded-full text-sm font-semibold active:scale-95 transition-all shadow-[0_4px_16px_-4px_rgba(46,140,150,0.5)]"
          >
            <IoAddCircleOutline className="w-4.5 h-4.5" />
            Add Money
          </button>
        </div>

        {recoveryWarning(true)}

        {/* Feature Cards — unified teal theme */}
        <div className="space-y-2.5 mb-6">
          <motion.div
            id="wallet-card"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            onClick={() => {
              logEvent("WALLET_CARD_CLICKED");
              navigate("/app/wallet");
            }}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-accent-primary/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <IoWalletOutline className="w-5.5 h-5.5 text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-text-default">Wallet</h3>
              <p className="text-xs text-text-subtle">Send, receive & manage money</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-accent-primary/60 flex-shrink-0" />
          </motion.div>

          <motion.div
            id="assets-card"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.11, duration: 0.3 }}
            onClick={() => {
              navigate("/app/assets");
            }}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-accent-primary/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5.5 h-5.5 text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-text-default">Crypto Assets</h3>
              <p className="text-xs text-text-subtle">View all your tokens</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-accent-primary/60 flex-shrink-0" />
          </motion.div>

          <motion.div
            id="earn-card"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.3 }}
            onClick={() => {
              logEvent("EARN_CARD_CLICKED");
              navigate("/app/invest");
            }}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-accent-primary/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <IoSparkles className="w-5.5 h-5.5 text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-text-default">Earn</h3>
              <p className="text-xs text-text-subtle">Invest and grow your money</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-accent-primary/60 flex-shrink-0" />
          </motion.div>
        </div>

        {/* Coming Soon — compact, same teal tint */}
        <div>
          <p className="text-[11px] font-semibold text-text-subtle/70 uppercase tracking-widest mb-2.5">Coming Soon</p>
          <div className="flex gap-2.5">
            {COMING_SOON_FEATURES.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
                  className="flex-1 flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl bg-accent-primary/[0.06] border border-accent-primary/10"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent-primary/15 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-accent-primary/70" />
                  </div>
                  <span className="text-[11px] font-medium text-text-subtle/70 text-center leading-tight">
                    {item.title}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <RedirectLinks
          isOpen={isRedirectDrawerOpen}
          onClose={handleCloseRedirectDrawer}
          redirectType={redirectType}
        />
      </motion.div>
    </div>
  );
}
