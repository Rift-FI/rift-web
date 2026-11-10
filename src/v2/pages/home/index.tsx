import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Smartphone,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCountryDetection from "@/hooks/data/use-country-detection";
import { usePendingApprovals } from "@/hooks/data/use-approvals";
import useAnalytics from "@/hooks/use-analytics";
import useUser from "@/hooks/data/use-user";
import { useWalletConnectRequests, useWalletConnectSessions } from "@/hooks/walletconnect/use-walletconnect";
import { formatMethod } from "@/lib/walletconnect";
import { summaryTitle } from "@/lib/passkeyUtils";
import { clearInTransit, getInTransit, type InTransitEntry } from "@/lib/in-transit";
import { clearPendingWithdrawal, getPendingWithdrawals, type PendingWithdrawal } from "@/lib/pending-withdrawal";
import { usePlatformDetection } from "@/utils/platform";
import { backButton } from "@telegram-apps/sdk-react";
import RedirectLinks from "@/features/redirectlinks";
import { usePayments, type Payment } from "@/v2/lib/payments";
import { Button, Card, CardHeader, EmptyState, Page, PageHeader, Skeleton, SkeletonRows, formatMoney } from "@/v2/ui";
import { PaymentDrawer, PaymentListItem } from "@/v2/pages/payments/components";

const DISPLAY_CURRENCIES: SupportedCurrency[] = ["USD", "KES", "NGN", "UGX", "TZS", "CDF", "MWK", "BRL"];
const CHAIN_NAME: Record<string, string> = {
  BASE: "Base",
  ETHEREUM: "Ethereum",
  POLYGON: "Polygon",
  CELO: "Celo",
  ARBITRUM: "Arbitrum",
  LISK: "Lisk",
};

const HOME_ACTIONS: {
  id: string;
  label: string;
  sub: string;
  icon: typeof ArrowUpRight;
  to: string;
  event: "SEND_BUTTON_CLICKED" | "RECEIVE_BUTTON_CLICKED" | "TOPUP_BUTTON_CLICKED" | "WITHDRAW_BUTTON_CLICKED";
  primary?: boolean;
}[] = [
  { id: "send", label: "Send", sub: "To a wallet address", icon: ArrowUpRight, to: "/app/send?method=wallet", event: "SEND_BUTTON_CLICKED", primary: true },
  { id: "receive", label: "Receive", sub: "Address, QR, links", icon: ArrowDownLeft, to: "/app/receive", event: "RECEIVE_BUTTON_CLICKED" },
  { id: "pay", label: "Pay", sub: "Mobile money or bank", icon: Smartphone, to: "/app/send?method=mobile", event: "SEND_BUTTON_CLICKED" },
  { id: "withdraw", label: "Withdraw", sub: "To your own account", icon: Wallet, to: "/app/withdraw", event: "WITHDRAW_BUTTON_CLICKED" },
  { id: "add-funds", label: "Add funds", sub: "Top up by M-Pesa", icon: Plus, to: "/app/request?type=topup", event: "TOPUP_BUTTON_CLICKED" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Notice({
  tone = "warning",
  icon,
  title,
  body,
  action,
  onDismiss,
}: {
  tone?: "warning" | "info";
  icon: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      className={
        tone === "warning"
          ? "flex items-center gap-3 rounded-lg border border-warning/35 bg-tint-pending px-4 py-3"
          : "flex items-center gap-3 rounded-lg border border-hairline bg-card px-4 py-3"
      }
    >
      <span className={tone === "warning" ? "text-pending" : "text-accent-primary"}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        {body && <p className="text-[12.5px] text-ink-3">{body}</p>}
      </div>
      {action}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { isTelegram } = usePlatformDetection();
  const { data: user } = useUser();

  /* ── WalletConnect + approvals ──────────────────────────────────── */
  const { data: wcSessions } = useWalletConnectSessions();
  const { data: wcPending } = useWalletConnectRequests((wcSessions?.length ?? 0) > 0);
  const firstWc = wcPending?.[0];
  const { data: approvals, isLoading: approvalsLoading } = usePendingApprovals();

  /* ── In-flight transfers ────────────────────────────────────────── */
  const [inTransit, setInTransit] = useState<InTransitEntry[]>(() => getInTransit());
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>(() => getPendingWithdrawals());
  useEffect(() => {
    const t = setInterval(() => {
      setInTransit(getInTransit());
      setPendingWithdrawals(getPendingWithdrawals());
    }, 5000);
    return () => clearInterval(t);
  }, []);

  /* ── Balance ────────────────────────────────────────────────────── */
  const { data: countryInfo, isLoading: countryLoading } = useCountryDetection();
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>(() => {
    const s = localStorage.getItem("selected_currency") as SupportedCurrency | null;
    return s && DISPLAY_CURRENCIES.includes(s) ? s : "USD";
  });
  useEffect(() => {
    if (countryInfo && !countryLoading && !localStorage.getItem("selected_currency")) {
      const c = countryInfo.currency as SupportedCurrency;
      if (DISPLAY_CURRENCIES.includes(c)) {
        setDisplayCurrency(c);
        localStorage.setItem("selected_currency", c);
      }
    }
  }, [countryInfo, countryLoading]);
  const { data: balance, isLoading: balanceLoading, refetch } = useAggregateBalance({ currency: displayCurrency });
  const [hidden, setHidden] = useState(false);

  const currencies = useMemo(() => {
    if (!balance) return [];
    return (["USDC", "USDT"] as const).map((token) => {
      const parts = balance.breakdown.filter((b) => b.token === token && b.amount > 0);
      return { token, total: token === "USDC" ? balance.totalUsdc : balance.totalUsdt, parts };
    });
  }, [balance]);

  /* ── Recent payments ────────────────────────────────────────────── */
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const [openPayment, setOpenPayment] = useState<Payment | null>(null);

  /* ── Incoming collect / request links (unchanged) ───────────────── */
  const [redirectOpen, setRedirectOpen] = useState(false);
  const [redirectType, setRedirectType] = useState<"RECEIVE-FROM-COLLECT-LINK" | "SEND-TO-REQUEST-LINK">("RECEIVE-FROM-COLLECT-LINK");
  const checkRedirectObjects = useCallback(() => {
    if (localStorage.getItem("collectobject") !== null) {
      setRedirectType("RECEIVE-FROM-COLLECT-LINK");
      setRedirectOpen(true);
    } else if (localStorage.getItem("requestobject") !== null) {
      setRedirectType("SEND-TO-REQUEST-LINK");
      setRedirectOpen(true);
    } else {
      setRedirectOpen(false);
    }
  }, []);
  useEffect(() => {
    checkRedirectObjects();
    const t = setInterval(checkRedirectObjects, 2000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "collectobject" || e.key === "requestobject") checkRedirectObjects();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    logEvent("PAGE_VISIT_HOME");
  }, []);

  useEffect(() => {
    if (!isTelegram) return;
    if (backButton.isSupported()) backButton.mount();
    if (backButton.isVisible()) backButton.hide();
    return () => backButton.unmount();
  }, [isTelegram]);

  const name = user?.displayName || user?.display_name;
  const go = (to: string, event?: Parameters<typeof logEvent>[0]) => {
    if (event) logEvent(event);
    navigate(to);
  };

  return (
    <Page>
      <PageHeader
        eyebrow={greeting()}
        title={name ? name : "Home"}
        description="Your balance and the latest activity on your account."
      />

      <div className="space-y-3">
        {firstWc && (
          <Notice
            icon={<Zap className="h-5 w-5" />}
            title={`${firstWc.peerName} — ${formatMethod(firstWc.method)}`}
            body={(wcPending?.length ?? 0) === 1 ? "A connected app is waiting for your approval." : `${wcPending?.length} connected-app requests are waiting.`}
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate("/app/settings/connected-apps")}>
                Review
              </Button>
            }
          />
        )}
        {inTransit.map((e) => (
          <Notice
            key={e.id}
            tone="info"
            icon={<Loader2 className="h-4 w-4 animate-spin" />}
            title={`Moving ${e.amount} ${e.token}`}
            body={`${e.fromChain} → ${e.toChain}`}
            onDismiss={() => {
              clearInTransit(e.id);
              setInTransit(getInTransit());
            }}
          />
        ))}
        {pendingWithdrawals.map((e) => {
          const remaining = Math.max(0, 180 - Math.floor((Date.now() - e.createdAt) / 1000));
          return (
            <Notice
              key={e.id}
              tone="info"
              icon={<Loader2 className="h-4 w-4 animate-spin" />}
              title={`Payout in progress — ${e.currencySymbol} ${e.amount.toLocaleString()}`}
              body={remaining > 0 ? `About ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining` : "Should arrive any moment"}
              onDismiss={() => {
                clearPendingWithdrawal(e.id);
                setPendingWithdrawals(getPendingWithdrawals());
              }}
            />
          );
        })}
      </div>

      {/* Balance */}
      <Card className={firstWc || inTransit.length || pendingWithdrawals.length ? "mt-6" : ""}>
        <div id="balance-section" aria-label="Available balance" className="flex flex-col gap-6 p-5 sm:p-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-[13px] font-medium text-ink-3">Available balance</p>
              <button
                type="button"
                onClick={() => setHidden((v) => !v)}
                aria-label={hidden ? "Show balance" : "Hide balance"}
                aria-pressed={hidden}
                className="rounded-md p-1 text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
              >
                {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => refetch()} aria-label="Refresh balance" className="rounded-md p-1 text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2" data-testid="balance-amount">
              {balanceLoading && !balance ? (
                <Skeleton className="h-11 w-56" />
              ) : (
                <p className="text-[40px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-numeric sm:text-[44px]">
                  {hidden ? "$••••" : formatMoney(balance?.totalUsd ?? 0, "USD")}
                  <span className="ml-2 text-[15px] font-medium tracking-normal text-ink-3">USD</span>
                </p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
              {balance && displayCurrency !== "USD" && !hidden && (
                <span className="tabular-numeric">
                  &asymp; {formatMoney(balance.localAmount, displayCurrency)} &middot; 1 USD = {balance.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}
                </span>
              )}
              <label className="inline-flex items-center gap-1.5">
                <span>Show in</span>
                <select
                  value={displayCurrency}
                  onChange={(e) => {
                    const c = e.target.value as SupportedCurrency;
                    setDisplayCurrency(c);
                    localStorage.setItem("selected_currency", c);
                    logEvent("CURRENCY_CHANGED", { currency: c });
                  }}
                  aria-label="Display currency"
                  className="h-7 cursor-pointer rounded-md border border-hairline bg-card px-1.5 text-[12.5px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                >
                  {DISPLAY_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
        <nav aria-label="Wallet actions" data-testid="home-actions" className="grid grid-cols-5 gap-1 border-t border-hairline px-2 py-3 sm:gap-3 sm:px-6 sm:py-4">
          {HOME_ACTIONS.map((a) => (
            <button
              key={a.id}
              id={a.id === "add-funds" ? "topup-button" : `action-${a.id}`}
              type="button"
              data-testid={`home-action-${a.id}`}
              onClick={() => go(a.to, a.event)}
              title={a.sub}
              className="group flex min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-center transition-colors hover:bg-surface-subtle cursor-pointer sm:flex-row sm:gap-3 sm:border sm:border-hairline sm:px-4 sm:py-3 sm:text-left sm:hover:border-hairline-strong"
            >
              <span
                className={
                  a.primary
                    ? "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent-solid text-white sm:h-10 sm:w-10"
                    : "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-accent-primary sm:h-10 sm:w-10"
                }
              >
                <a.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="block min-w-0 truncate text-[12.5px] font-semibold text-ink sm:text-[14px]">{a.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-hairline">
          <p className="px-5 pt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3 sm:px-6">Balance by currency</p>
          <ul className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0" aria-label="Balance by currency">
            {(currencies.length ? currencies : [{ token: "USDC", total: 0, parts: [] }, { token: "USDT", total: 0, parts: [] }]).map((c) => (
              <li key={c.token} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-accent-primary">
                    {c.token === "USDC" ? "$C" : "$T"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{c.token === "USDC" ? "USD Coin" : "Tether USD"}</p>
                    <p className="truncate text-[12.5px] text-ink-3">
                      {c.parts.length ? c.parts.map((p) => CHAIN_NAME[p.chain] || p.chain).join(", ") : c.token}
                    </p>
                  </div>
                </div>
                <p className="text-[15px] font-semibold text-ink tabular-numeric">
                  {balanceLoading && !balance ? <Skeleton className="h-4 w-16" /> : hidden ? "••••" : `${Number(c.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c.token}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Recent payments */}
        <Card>
          <CardHeader
            title="Recent payments"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/payments")}>
                View all
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            }
          />
          {paymentsLoading && payments.length === 0 ? (
            <SkeletonRows rows={4} />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<ArrowDownLeft className="h-5 w-5" />}
              title="No payments yet"
              description="Share your account details or a payment link to receive your first payment."
              action={<Button onClick={() => navigate("/app/receive")}>Receive a payment</Button>}
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {payments.slice(0, 6).map((p) => (
                <PaymentListItem key={p.id} payment={p} onOpen={setOpenPayment} />
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {/* Approvals */}
          <Card>
            <CardHeader
              title="Needs approval"
              description={approvals?.length ? undefined : "Requests from apps and integrations"}
              action={
                approvals?.length ? (
                  <span className="rounded-full bg-accent-solid px-2 text-[12px] font-semibold leading-5 text-white">{approvals.length}</span>
                ) : undefined
              }
            />
            {approvalsLoading ? (
              <div className="p-5">
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : approvals?.length ? (
              <ul className="divide-y divide-hairline">
                {approvals.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/approve/${a.id}`)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-subtle cursor-pointer"
                    >
                      <Inbox className="h-4 w-4 flex-shrink-0 text-accent-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{summaryTitle(a.summary)}</span>
                        {a.expiresAt && <span className="block text-[12px] text-ink-3">Expires in {formatDistanceToNowStrict(new Date(a.expiresAt))}</span>}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-[13px] text-ink-3">You&rsquo;re all caught up.</p>
            )}
          </Card>

        </div>
      </div>

      <PaymentDrawer payment={openPayment} onClose={() => setOpenPayment(null)} />
      <RedirectLinks isOpen={redirectOpen} onClose={() => setRedirectOpen(false)} redirectType={redirectType} />
    </Page>
  );
}
