import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

import { forceClearCacheAndRefresh } from "@/utils/auto-update";
import { IoChevronForward, IoCloseOutline } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import { Shield, PiggyBank, Repeat, PieChart, Coins, Globe, Zap, Loader2 } from "lucide-react";
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
import useAnalytics from "@/hooks/use-analytics";
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
import {
  useWalletConnectSessions,
  useWalletConnectRequests,
} from "@/hooks/walletconnect/use-walletconnect";
import { formatMethod } from "@/lib/walletconnect";
import { getInTransit, clearInTransit, type InTransitEntry } from "@/lib/in-transit";
import { getPendingWithdrawals, clearPendingWithdrawal, type PendingWithdrawal } from "@/lib/pending-withdrawal";

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
  const { logEvent } = useAnalytics();
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

  // WalletConnect pending requests — only poll when there are active sessions
  const { data: wcSessions } = useWalletConnectSessions();
  const hasActiveSessions = (wcSessions?.length ?? 0) > 0;
  const { data: wcPendingRequests } = useWalletConnectRequests(hasActiveSessions);
  const wcPendingCount = wcPendingRequests?.length ?? 0;
  const firstPending = wcPendingRequests?.[0];

  // In-transit tokens (after cross-chain convert)
  const [inTransit, setInTransit] = useState<InTransitEntry[]>(() => getInTransit());
  // Pending withdrawals
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>(() => getPendingWithdrawals());
  useEffect(() => {
    const interval = setInterval(() => {
      setInTransit(getInTransit());
      setPendingWithdrawals(getPendingWithdrawals());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTopUp = () => {
    logEvent("TOPUP_BUTTON_CLICKED");
    navigate("/app/request?type=topup");
  };

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
            } bg-[#fbf6ea] border border-[#ecd9a8] rounded-lg`}
          >
            <div
              className={`${
                mobile ? "w-8 h-8 rounded-md" : "w-9 h-9 rounded-md"
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
                  ? "px-2.5 py-1 text-2xs rounded-md"
                  : "px-3 py-1.5 text-xs rounded-md"
              } bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex-shrink-0`}
            >
              Set Up
            </button>
            <button
              onClick={dismissRecoveryWarning}
              aria-label="Dismiss recovery warning"
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
        <div className="flex-shrink-0 z-40 bg-white border-b border-border">
          <div className="w-full h-14 px-8 flex justify-between items-center">
            <div className="flex items-baseline gap-3 min-w-0">
              <h1
                className="text-[17px] font-semibold text-text-default tracking-[-0.01em]"
                style={{ fontFamily: 'var(--app-font-display)' }}
              >
                Overview
              </h1>
              <p className="text-[13px] text-text-muted truncate">
                {getGreeting()}. Account position and payment activity.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CurrencySelector
                selectedCurrency={selectedCurrency.code}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-6 lg:p-8"
        >
          <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Desktop Balance Panel */}
            <section
              id="balance-section"
              aria-label="Available balance"
              className="bg-white border border-border rounded-lg"
            >
              <div className="flex items-start justify-between gap-6 p-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-3">
                    <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-text-muted">
                      Available balance
                    </p>
                    <button
                      onClick={() => {
                        setIsBalanceVisible(!isBalanceVisible);
                        logEvent("BALANCE_VISIBILITY_TOGGLED", { visible: !isBalanceVisible });
                      }}
                      className="p-1 rounded-sm text-text-muted hover:text-text-default hover:bg-surface-subtle transition-colors cursor-pointer"
                      aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
                      aria-pressed={!isBalanceVisible}
                    >
                      {isBalanceVisible ? (
                        <IoEyeOutline className="w-4 h-4" />
                      ) : (
                        <IoEyeOffOutline className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => forceClearCacheAndRefresh()}
                      className="p-1 rounded-sm text-text-muted hover:text-text-default hover:bg-surface-subtle transition-colors cursor-pointer"
                      aria-label="Refresh balance"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h2
                    className="text-[40px] font-semibold text-text-default leading-none tracking-[-0.02em] tabular-numeric"
                    style={{ fontFamily: 'var(--app-font-display)' }}
                  >
                    {BALANCE_LOADING || countryLoading ? (
                      <RiftLoader message="Loading balance..." />
                    ) : !BALANCE ? (
                      <Skeleton className="h-10 w-48 inline-block" />
                    ) : isBalanceVisible ? (
                      <>
                        {formatNumberWithCommas(BALANCE.localAmount)}
                        <span className="text-[16px] font-medium text-text-muted ml-2 tracking-normal">
                          {selectedCurrency.code}
                        </span>
                      </>
                    ) : (
                      <>
                        &bull;&bull;&bull;&bull;
                        <span className="text-[16px] font-medium text-text-muted ml-2 tracking-normal">
                          {selectedCurrency.code}
                        </span>
                      </>
                    )}
                  </h2>
                </div>
                <button
                  id="topup-button"
                  onClick={handleTopUp}
                  className="flex-shrink-0 inline-flex items-center gap-2 h-10 px-4 bg-accent-primary text-white rounded-md text-[14px] font-semibold hover:bg-accent-secondary transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <IoAddCircleOutline className="w-[18px] h-[18px]" aria-hidden="true" />
                  Add funds
                </button>
              </div>
              {BALANCE && isBalanceVisible && selectedCurrency.code !== "USD" && (
                <dl className="flex items-center gap-8 border-t border-border px-6 py-3 text-[13px]">
                  <div className="flex items-baseline gap-2">
                    <dt className="text-text-muted">USD equivalent</dt>
                    <dd className="font-medium text-text-default tabular-numeric">
                      {BALANCE.totalUsd.toFixed(2)} USD
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="text-text-muted">Reference rate</dt>
                    <dd className="font-medium text-text-default tabular-numeric">
                      1 USD = {BALANCE.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.code}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            {recoveryWarning(false)}

            {/* WalletConnect pending requests banner */}
            <AnimatePresence>
              {wcPendingCount > 0 && firstPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <button
                    onClick={() => navigate("/app/walletconnect")}
                    className="w-full flex items-center gap-4 p-4 bg-[#fbf6ea] border border-[#ecd9a8] rounded-lg hover:bg-[#f8f0dc] transition-colors text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900">
                        {firstPending.peerName} — {formatMethod(firstPending.method)}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {wcPendingCount === 1
                          ? "Waiting for your approval"
                          : `${wcPendingCount} requests waiting for approval`}
                      </p>
                    </div>
                    <IoChevronForward className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-transit tokens */}
            {inTransit.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2.5 bg-white border border-border rounded-lg"
              >
                <Loader2 className="w-4 h-4 text-accent-primary animate-spin flex-shrink-0" />
                <p className="text-sm text-text-subtle flex-1">
                  Processing {entry.amount} {entry.token} <span className="text-text-subtle/50">({entry.fromChain} → {entry.toChain})</span>
                </p>
                <button
                  onClick={() => { clearInTransit(entry.id); setInTransit(getInTransit()); }}
                  aria-label="Dismiss"
                  className="p-0.5 text-text-muted hover:text-text-default transition-colors flex-shrink-0"
                >
                  <IoCloseOutline className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Pending withdrawals */}
            {pendingWithdrawals.map((entry) => {
              const elapsed = Math.floor((Date.now() - entry.createdAt) / 1000);
              const remaining = Math.max(0, 180 - elapsed);
              const mins = Math.floor(remaining / 60);
              const secs = remaining % 60;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white border border-border rounded-lg"
                >
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-default">
                      Withdrawal pending — {entry.currencySymbol} {entry.amount.toLocaleString()}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {remaining > 0 ? `Processing... ${mins}:${secs.toString().padStart(2, "0")} remaining` : "Should arrive any moment"}
                    </p>
                  </div>
                  <button
                    onClick={() => { clearPendingWithdrawal(entry.id); setPendingWithdrawals(getPendingWithdrawals()); }}
                  aria-label="Dismiss"
                    className="p-0.5 text-text-muted hover:text-text-default transition-colors flex-shrink-0"
                  >
                    <IoCloseOutline className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Desktop Feature Cards */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2.5">
                Workspace
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <motion.div
                  id="wallet-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => {
                    logEvent("WALLET_CARD_CLICKED");
                    navigate("/app/wallet");
                  }}
                  className="group flex items-center gap-3.5 p-4 rounded-lg bg-white border border-border cursor-pointer hover:border-text-default/20 hover:bg-surface-subtle/60 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle text-accent-primary flex items-center justify-center flex-shrink-0">
                    <IoWalletOutline className="w-[18px] h-[18px]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-text-default">Payments</h3>
                    <p className="text-[12.5px] text-text-muted">Send, collect and pay out</p>
                  </div>
                  <IoChevronForward className="w-4 h-4 text-text-muted/60 group-hover:text-text-default transition-colors" />
                </motion.div>

                <motion.div
                  id="assets-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => navigate("/app/assets")}
                  className="group flex items-center gap-3.5 p-4 rounded-lg bg-white border border-border cursor-pointer hover:border-text-default/20 hover:bg-surface-subtle/60 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle text-accent-primary flex items-center justify-center flex-shrink-0">
                    <Coins className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-text-default">Holdings</h3>
                    <p className="text-[12.5px] text-text-muted">Balances by asset and network</p>
                  </div>
                  <IoChevronForward className="w-4 h-4 text-text-muted/60 group-hover:text-text-default transition-colors" />
                </motion.div>

                <motion.div
                  id="earn-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => {
                    logEvent("EARN_CARD_CLICKED");
                    navigate("/app/invest");
                  }}
                  className="group flex items-center gap-3.5 p-4 rounded-lg bg-white border border-border cursor-pointer hover:border-text-default/20 hover:bg-surface-subtle/60 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle text-accent-primary flex items-center justify-center flex-shrink-0">
                    <IoSparkles className="w-[18px] h-[18px]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-text-default">Yield</h3>
                    <p className="text-[12.5px] text-text-muted">Stable on-chain yield</p>
                  </div>
                  <IoChevronForward className="w-4 h-4 text-text-muted/60 group-hover:text-text-default transition-colors" />
                </motion.div>
              </div>
            </div>

            {/* DeFi Section */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2.5">Integrations</p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate("/app/walletconnect")}
                className="group flex items-center gap-3.5 p-4 rounded-lg bg-white border border-border cursor-pointer hover:border-text-default/20 hover:bg-surface-subtle/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle text-accent-primary flex items-center justify-center flex-shrink-0">
                  <Globe className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-text-default">DeFi connections</h3>
                  <p className="text-[12.5px] text-text-muted">
                    Connect to Uniswap, Polymarket, Aave &amp; other apps
                  </p>
                </div>
                <IoChevronForward className="w-4 h-4 text-text-muted/60 group-hover:text-text-default transition-colors" />
              </motion.div>
            </div>

            {/* Desktop Coming Soon */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2.5">
                Coming soon
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {COMING_SOON_FEATURES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-transparent border border-dashed border-border"
                    >
                      <div className="w-9 h-9 rounded-md border border-border flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-semibold text-text-default">
                          {item.title}
                        </h3>
                        <p className="text-[12px] text-text-muted">{item.description}</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted border border-border px-1.5 py-0.5 rounded-sm">
                        Soon
                      </span>
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
      <div className="flex-shrink-0 z-40 bg-white border-b border-border">
        <div className="flex justify-between items-center px-4 h-14">
          <div className="flex items-center gap-2">
            <img src="/rift.png" alt="Rift" className="w-6 h-6" />
            <span
              className="text-[16px] font-semibold text-text-default tracking-[-0.01em]"
              style={{ fontFamily: 'var(--app-font-display)' }}
            >
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4 pb-6"
      >
        {/* Balance Section */}
        <section
          id="balance-section"
          aria-label="Available balance"
          className="mb-5 bg-white border border-border rounded-lg"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                Available balance
              </p>
              {/* Eye + Refresh icons */}
              <div className="flex items-center gap-0.5 -mr-1">
                <button
                  onClick={() => {
                    setIsBalanceVisible(!isBalanceVisible);
                    logEvent("BALANCE_VISIBILITY_TOGGLED", { visible: !isBalanceVisible });
                  }}
                  className="p-2 rounded-md text-text-muted transition-colors"
                  aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
                  aria-pressed={!isBalanceVisible}
                >
                  {isBalanceVisible ? (
                    <IoEyeOutline className="w-4 h-4" />
                  ) : (
                    <IoEyeOffOutline className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => forceClearCacheAndRefresh()}
                  className="p-2 rounded-md text-text-muted transition-colors"
                  aria-label="Refresh balance"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Balance amount */}
            {BALANCE_LOADING || countryLoading ? (
              <RiftLoader message="Loading balance..." />
            ) : !BALANCE ? (
              <Skeleton className="h-9 w-40 mt-0" />
            ) : isBalanceVisible ? (
              <h1
                className="text-[32px] font-semibold text-text-default leading-none tracking-[-0.02em] tabular-numeric"
                style={{ fontFamily: 'var(--app-font-display)' }}
              >
                {formatNumberWithCommas(BALANCE.localAmount)}
                <span className="text-[14px] font-medium text-text-muted ml-1.5 tracking-normal">
                  {selectedCurrency.code}
                </span>
              </h1>
            ) : (
              <h1
                className="text-[32px] font-semibold text-text-default leading-none tracking-[-0.02em]"
                style={{ fontFamily: 'var(--app-font-display)' }}
              >
                &bull;&bull;&bull;&bull;
                <span className="text-[14px] font-medium text-text-muted ml-1.5">
                  {selectedCurrency.code}
                </span>
              </h1>
            )}

            {BALANCE && isBalanceVisible && selectedCurrency.code !== "USD" && (
              <p className="mt-2 text-[12px] text-text-muted tabular-numeric">
                {BALANCE.totalUsd.toFixed(2)} USD
                <span className="mx-1.5 text-text-muted/50">&middot;</span>
                1 USD = {BALANCE.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.code}
              </p>
            )}
          </div>

          {/* Top Up Button */}
          <div className="border-t border-border p-3">
            <button
              id="topup-button"
              onClick={handleTopUp}
              className="w-full inline-flex items-center justify-center gap-2 h-11 bg-accent-primary text-white rounded-md text-[14px] font-semibold active:bg-accent-secondary transition-colors"
            >
              <IoAddCircleOutline className="w-[18px] h-[18px]" aria-hidden="true" />
              Add funds
            </button>
          </div>
        </section>

        {recoveryWarning(true)}

        {/* WalletConnect pending requests banner */}
        <AnimatePresence>
          {wcPendingCount > 0 && firstPending && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <button
                onClick={() => navigate("/app/walletconnect")}
                className="w-full flex items-center gap-3 p-3 bg-[#fbf6ea] border border-[#ecd9a8] rounded-lg active:bg-[#f8f0dc] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-900">
                    {firstPending.peerName} — {formatMethod(firstPending.method)}
                  </p>
                  <p className="text-2xs text-amber-700 mt-0.5">
                    {wcPendingCount === 1
                      ? "Tap to approve or reject"
                      : `${wcPendingCount} requests waiting`}
                  </p>
                </div>
                <IoChevronForward className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* In-transit tokens */}
        {inTransit.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2.5 px-3.5 py-2 mb-3 bg-white border border-border rounded-lg"
          >
            <Loader2 className="w-3.5 h-3.5 text-accent-primary animate-spin flex-shrink-0" />
            <p className="text-xs text-text-subtle flex-1">
              Processing {entry.amount} {entry.token} <span className="text-text-subtle/50">({entry.fromChain} → {entry.toChain})</span>
            </p>
            <button
              onClick={() => { clearInTransit(entry.id); setInTransit(getInTransit()); }}
                  aria-label="Dismiss"
              className="p-0.5 text-text-muted hover:text-text-default transition-colors flex-shrink-0"
            >
              <IoCloseOutline className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Pending withdrawals */}
        {pendingWithdrawals.map((entry) => {
          const elapsed = Math.floor((Date.now() - entry.createdAt) / 1000);
          const remaining = Math.max(0, 180 - elapsed);
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-2.5 px-3.5 py-2 mb-3 bg-white border border-border rounded-lg"
            >
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-default">
                  Withdrawal pending — {entry.currencySymbol} {entry.amount.toLocaleString()}
                </p>
                <p className="text-2xs text-text-subtle">
                  {remaining > 0 ? `Processing... ${mins}:${secs.toString().padStart(2, "0")}` : "Should arrive any moment"}
                </p>
              </div>
              <button
                onClick={() => { clearPendingWithdrawal(entry.id); setPendingWithdrawals(getPendingWithdrawals()); }}
                  aria-label="Dismiss"
                className="p-0.5 text-text-muted hover:text-text-default transition-colors flex-shrink-0"
              >
                <IoCloseOutline className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Feature Cards — unified teal theme */}
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">Workspace</p>
        <div className="mb-6 rounded-lg border border-border overflow-hidden divide-y divide-border">
          <motion.div
            id="wallet-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              logEvent("WALLET_CARD_CLICKED");
              navigate("/app/wallet");
            }}
            className="flex items-center gap-3 px-4 py-3.5 bg-white active:bg-surface-subtle transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
              <IoWalletOutline className="w-[18px] h-[18px] text-accent-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-text-default">Payments</h3>
              <p className="text-[12px] text-text-muted">Send, collect and pay out</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-text-muted/60 flex-shrink-0" aria-hidden="true" />
          </motion.div>

          <motion.div
            id="assets-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              navigate("/app/assets");
            }}
            className="flex items-center gap-3 px-4 py-3.5 bg-white active:bg-surface-subtle transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
              <Coins className="w-[18px] h-[18px] text-accent-primary" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-text-default">Holdings</h3>
              <p className="text-[12px] text-text-muted">Balances by asset and network</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-text-muted/60 flex-shrink-0" aria-hidden="true" />
          </motion.div>

          <motion.div
            id="earn-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              logEvent("EARN_CARD_CLICKED");
              navigate("/app/invest");
            }}
            className="flex items-center gap-3 px-4 py-3.5 bg-white active:bg-surface-subtle transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
              <IoSparkles className="w-[18px] h-[18px] text-accent-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-text-default">Yield</h3>
              <p className="text-[12px] text-text-muted">Stable on-chain yield</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-text-muted/60 flex-shrink-0" aria-hidden="true" />
          </motion.div>

        </div>

        {/* DeFi Section */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">Integrations</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => navigate("/app/walletconnect")}
            className="flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-lg active:bg-surface-subtle transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
              <Globe className="w-[18px] h-[18px] text-accent-primary" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-text-default">DeFi connections</h3>
              <p className="text-[12px] text-text-muted">Connect to external apps like Polymarket, Uniswap & more</p>
            </div>
            <IoChevronForward className="w-4 h-4 text-text-muted/60 flex-shrink-0" aria-hidden="true" />
          </motion.div>
        </div>

        {/* Coming Soon — compact, same teal tint */}
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">Coming soon</p>
          <div className="flex gap-2.5">
            {COMING_SOON_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-lg border border-dashed border-border"
                >
                  <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center">
                    <Icon className="w-4 h-4 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-medium text-text-muted text-center leading-tight">
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
