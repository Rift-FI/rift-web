import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Eye, EyeOff, Landmark, Loader2, Plus, RefreshCw, Smartphone, X, Zap } from "lucide-react";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useCountryDetection from "@/hooks/data/use-country-detection";
import { useOfframpFeePreview } from "@/hooks/data/use-offramp-fee";
import useAnalytics from "@/hooks/use-analytics";
import { useWalletConnectRequests, useWalletConnectSessions } from "@/hooks/walletconnect/use-walletconnect";
import { formatMethod } from "@/lib/walletconnect";
import { clearInTransit, getInTransit, type InTransitEntry } from "@/lib/in-transit";
import { clearPendingWithdrawal, getPendingWithdrawals, type PendingWithdrawal } from "@/lib/pending-withdrawal";
import { cn } from "@/lib/utils";
import { usePlatformDetection } from "@/utils/platform";
import { backButton } from "@telegram-apps/sdk-react";
import RedirectLinks from "@/features/redirectlinks";
import { usePayments, type Payment } from "@/v2/lib/payments";
import { Skeleton, formatMoney } from "@/v2/ui";
import { PaymentDrawer, PaymentListItem } from "@/v2/pages/payments/components";

type EventName = "SEND_BUTTON_CLICKED" | "RECEIVE_BUTTON_CLICKED" | "TOPUP_BUTTON_CLICKED" | "WITHDRAW_BUTTON_CLICKED";

const ACTIONS: { id: string; label: string; icon: typeof ArrowUpRight; to: string; event: EventName }[] = [
  { id: "send", label: "Send", icon: ArrowUpRight, to: "/app/send?method=wallet", event: "SEND_BUTTON_CLICKED" },
  { id: "add-funds", label: "Add funds", icon: Plus, to: "/app/request?type=topup", event: "TOPUP_BUTTON_CLICKED" },
  { id: "pay", label: "Pay", icon: Smartphone, to: "/app/send?method=mobile", event: "SEND_BUTTON_CLICKED" },
  { id: "receive", label: "Receive", icon: ArrowDownLeft, to: "/app/receive", event: "RECEIVE_BUTTON_CLICKED" },
  { id: "withdraw", label: "Withdraw", icon: Landmark, to: "/app/withdraw", event: "WITHDRAW_BUTTON_CLICKED" },
];

const CARDS = [
  { id: "cash-out", title: "Cash out", body: "USDC and USDT to M-Pesa and mobile money.", cta: "Cash out", to: "/app/send?method=mobile", tone: "brand" as const },
  { id: "add-funds", title: "Top up with M-Pesa", body: "Add money in shillings, hold it in dollars.", cta: "Add funds", to: "/app/request?type=topup", tone: "plain" as const },
  { id: "links", title: "Get paid by link", body: "Share a link or QR. Customers pay from any wallet.", cta: "Create link", to: "/app/request?type=request", tone: "plain" as const },
];

const RATES: { code: SupportedCurrency; flag: string }[] = [
  { code: "KES", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "NGN", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "UGX", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "TZS", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "MWK", flag: "\u{1F1F2}\u{1F1FC}" },
  { code: "BRL", flag: "\u{1F1E7}\u{1F1F7}" },
];

const DISPLAY_CURRENCIES: SupportedCurrency[] = ["USD", "KES", "NGN", "UGX", "TZS", "CDF", "MWK", "BRL"];

function RateChip({ code, flag }: { code: SupportedCurrency; flag: string }) {
  const { data, isLoading } = useOfframpFeePreview(code);
  const rate = data?.buying_rate || data?.rate;
  return (
    <li className="flex flex-shrink-0 items-center gap-2.5 rounded-full bg-card px-3.5 py-2 ring-1 ring-hairline" data-testid={`rate-${code}`}>
      <span aria-hidden="true" className="text-[18px] leading-none">
        {flag}
      </span>
      <span className="text-[13px] font-semibold text-ink">{code}</span>
      <span className="text-[13px] text-ink-3 tabular-numeric">
        {isLoading && !rate ? "…" : rate ? rate.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
      </span>
    </li>
  );
}

function Carousel({ onGo }: { onGo: (to: string) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const w = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth;
    setIndex(Math.round(el.scrollLeft / (w + 12)));
  };
  return (
    <section aria-label="Shortcuts" className="mt-8">
      <ul ref={ref} onScroll={onScroll} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" data-testid="home-carousel">
        {CARDS.map((c) => (
          <li key={c.id} className="w-[86%] flex-shrink-0 snap-start sm:w-[78%]">
            <button
              type="button"
              onClick={() => onGo(c.to)}
              className={cn(
                "flex h-full w-full flex-col items-start rounded-2xl p-5 text-left transition-transform active:scale-[0.99] cursor-pointer",
                c.tone === "brand" ? "bg-accent-solid text-white" : "bg-card text-ink ring-1 ring-hairline"
              )}
            >
              <span className="text-[17px] font-semibold tracking-[-0.01em]">{c.title}</span>
              <span className={cn("mt-1 text-[14px] leading-snug", c.tone === "brand" ? "text-white/80" : "text-ink-3")}>{c.body}</span>
              <span
                className={cn(
                  "mt-4 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold",
                  c.tone === "brand" ? "bg-[#ffffff] text-[#1c6168]" : "bg-teal-50 text-accent-primary"
                )}
              >
                {c.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
        {CARDS.map((c, i) => (
          <span key={c.id} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-accent-primary" : "w-1.5 bg-hairline-strong")} />
        ))}
      </div>
    </section>
  );
}

function Notice({ icon, title, body, onClick, onDismiss }: { icon: React.ReactNode; title: string; body?: string; onClick?: () => void; onDismiss?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-hairline">
      <span className="text-accent-primary">{icon}</span>
      <button type="button" onClick={onClick} disabled={!onClick} className="min-w-0 flex-1 text-left disabled:cursor-default">
        <span className="block truncate text-[13.5px] font-semibold text-ink">{title}</span>
        {body && <span className="block truncate text-[12.5px] text-ink-3">{body}</span>}
      </button>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 text-ink-3 hover:text-ink cursor-pointer">
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

  /* Balance */
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
  const [hidden, setHidden] = useState(() => localStorage.getItem("rift_hide_balance") === "1");
  const [refreshing, setRefreshing] = useState(false);

  /* Activity + notices */
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const [openPayment, setOpenPayment] = useState<Payment | null>(null);
  const { data: wcSessions } = useWalletConnectSessions();
  const { data: wcPending } = useWalletConnectRequests((wcSessions?.length ?? 0) > 0);
  const firstWc = wcPending?.[0];
  const [inTransit, setInTransit] = useState<InTransitEntry[]>(() => getInTransit());
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>(() => getPendingWithdrawals());
  useEffect(() => {
    const t = setInterval(() => {
      setInTransit(getInTransit());
      setPendingWithdrawals(getPendingWithdrawals());
    }, 5000);
    return () => clearInterval(t);
  }, []);

  /* Incoming collect / request links */
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

  const go = (to: string, event?: EventName) => {
    if (event) logEvent(event);
    navigate(to);
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-12 pt-6 sm:pt-10 lg:pt-14">
      {/* Balance */}
      <section id="balance-section" aria-label="Balance" className="text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-3">Balance</p>
          <button
            type="button"
            onClick={() => {
              setHidden((v) => {
                localStorage.setItem("rift_hide_balance", v ? "0" : "1");
                return !v;
              });
            }}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            aria-pressed={hidden}
            className="rounded-full p-1.5 text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={async () => {
              setRefreshing(true);
              await refetch();
              setRefreshing(false);
            }}
            aria-label="Refresh balance"
            className="rounded-full p-1.5 text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
        </div>
        <div className="mt-2" data-testid="balance-amount">
          {balanceLoading && !balance ? (
            <Skeleton className="mx-auto h-12 w-56" />
          ) : (
            <p className="text-[46px] font-semibold leading-none tracking-[-0.035em] text-ink tabular-numeric sm:text-[52px]">
              {hidden ? "$•••••" : formatMoney(balance?.totalUsd ?? 0, "USD")}
            </p>
          )}
        </div>
        <label className="mt-3 inline-flex items-center gap-1 text-[13.5px] text-ink-3">
          {balance && displayCurrency !== "USD" && !hidden && (
            <span className="tabular-numeric">&asymp; {formatMoney(balance.localAmount, displayCurrency)}</span>
          )}
          <select
            value={displayCurrency}
            onChange={(e) => {
              const c = e.target.value as SupportedCurrency;
              setDisplayCurrency(c);
              localStorage.setItem("selected_currency", c);
              logEvent("CURRENCY_CHANGED", { currency: c });
            }}
            aria-label="Show balance in"
            className="cursor-pointer rounded-md bg-transparent px-1 py-0.5 text-[13px] font-medium text-ink-3 hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          >
            {DISPLAY_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Actions */}
      <nav aria-label="Wallet actions" data-testid="home-actions" className="mt-8 grid grid-cols-5 gap-1">
        {ACTIONS.map((a, i) => (
          <button
            key={a.id}
            id={a.id === "add-funds" ? "topup-button" : `action-${a.id}`}
            type="button"
            data-testid={`home-action-${a.id}`}
            onClick={() => go(a.to, a.event)}
            className="group flex min-w-0 flex-col items-center gap-2 rounded-xl py-1 cursor-pointer"
          >
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
                i === 0 ? "bg-accent-solid text-white group-hover:bg-accent-solid-hover" : "bg-card text-ink ring-1 ring-hairline group-hover:ring-hairline-strong"
              )}
            >
              <a.icon className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="truncate text-[12.5px] font-medium text-ink-2">{a.label}</span>
          </button>
        ))}
      </nav>

      {(firstWc || inTransit.length > 0 || pendingWithdrawals.length > 0) && (
        <div className="mt-6 space-y-2">
          {firstWc && (
            <Notice
              icon={<Zap className="h-4 w-4" />}
              title={`${firstWc.peerName} · ${formatMethod(firstWc.method)}`}
              body="Waiting for your approval"
              onClick={() => navigate("/app/advanced/walletconnect")}
            />
          )}
          {inTransit.map((e) => (
            <Notice
              key={e.id}
              icon={<Loader2 className="h-4 w-4 animate-spin" />}
              title={`Moving ${e.amount} ${e.token}`}
              body={`${e.fromChain} → ${e.toChain}`}
              onDismiss={() => {
                clearInTransit(e.id);
                setInTransit(getInTransit());
              }}
            />
          ))}
          {pendingWithdrawals.map((e) => (
            <Notice
              key={e.id}
              icon={<Loader2 className="h-4 w-4 animate-spin" />}
              title={`Payout on its way · ${e.currencySymbol} ${e.amount.toLocaleString()}`}
              onDismiss={() => {
                clearPendingWithdrawal(e.id);
                setPendingWithdrawals(getPendingWithdrawals());
              }}
            />
          ))}
        </div>
      )}

      <Carousel onGo={(to) => navigate(to)} />

      {/* Rates */}
      <section aria-label="Rates" className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Rates</h2>
          <span className="text-[12.5px] text-ink-3">1 USD</span>
        </div>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" data-testid="rates-strip">
          {RATES.map((r) => (
            <RateChip key={r.code} code={r.code} flag={r.flag} />
          ))}
        </ul>
      </section>

      {/* Activity */}
      <section aria-label="Recent activity" className="mt-8">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Activity</h2>
          {payments.length > 0 && (
            <button type="button" onClick={() => navigate("/app/payments")} className="text-[13.5px] font-medium text-accent-primary hover:underline cursor-pointer">
              See all
            </button>
          )}
        </div>
        {paymentsLoading && payments.length === 0 ? (
          <div className="space-y-3 py-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-ink-3">No payments yet.</p>
        ) : (
          <ul className="-mx-4 divide-y divide-hairline">
            {payments.slice(0, 5).map((p) => (
              <PaymentListItem key={p.id} payment={p} onOpen={setOpenPayment} />
            ))}
          </ul>
        )}
      </section>

      <PaymentDrawer payment={openPayment} onClose={() => setOpenPayment(null)} />
      <RedirectLinks isOpen={redirectOpen} onClose={() => setRedirectOpen(false)} redirectType={redirectType} />
    </div>
  );
}
