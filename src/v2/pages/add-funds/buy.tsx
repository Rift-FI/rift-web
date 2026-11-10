import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, Loader2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { createOnramp, getOnramp, getOnrampQuote, type OnrampOrderFull } from "@/v2/lib/onramp";
import { IdentitySheet } from "@/v2/pages/kyc/identity-sheet";
import { STATUS_LABEL, isFinal, toAppStatus, type AppStatus } from "@/v2/lib/status";
import type { PayoutCountry } from "@/v2/lib/countries";
import { Button, CopyButton, Field, INPUT_CLASS, Row, Rows, Segmented, StatusPill, formatMoney } from "@/v2/ui";
import { CurrencyPicker } from "@/v2/ui/currency-picker";
import { ReceiptCard } from "@/v2/ui/receipt";

const CHAINS = [
  { id: "BASE", label: "Base" },
  { id: "POLYGON", label: "Polygon" },
  { id: "ETHEREUM", label: "Ethereum" },
];

/* ── Order: deposit instructions + live status ────────────────────── */

function useCountdown(until?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const ms = Math.max(0, new Date(until).getTime() - now);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { ms, text: `${m}:${String(s).padStart(2, "0")}` };
}

const STEPS: AppStatus[] = ["awaiting_payment", "processing", "completed"];

function Progress({ status }: { status: AppStatus }) {
  const idx = STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-2" aria-label="Progress" data-testid="onramp-progress">
      {STEPS.map((s, i) => {
        const done = idx > i || status === "completed";
        const active = idx === i && status !== "completed";
        return (
          <li key={s} className="flex flex-1 flex-col gap-1.5">
            <span className={cn("h-1.5 rounded-full", done ? "bg-success" : active ? "animate-pulse bg-accent-primary" : "bg-hairline")} />
            <span className={cn("text-[11.5px] font-medium", done || active ? "text-ink" : "text-ink-3")}>{STATUS_LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OnrampOrderView({ initial, onNew }: { initial: OnrampOrderFull; onNew: () => void }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["onramp", initial.id],
    queryFn: () => getOnramp(initial.id),
    initialData: initial,
    refetchInterval: (q) => (isFinal(toAppStatus((q.state.data as OnrampOrderFull | undefined)?.status, "awaiting_payment")) ? false : 4000),
  });
  const order = data ?? initial;
  const status = toAppStatus(order.status, "awaiting_payment");
  const acct = order.providerAccount;
  const countdown = useCountdown(acct?.validUntil ?? order.expiresAt);
  const underReview = /compliance/i.test(String(order.providerStatus ?? ""));
  const prompt = !acct && (order.collection?.prompt || order.currency === "KES");
  const amountToPay = acct ? Number(acct.amountToTransfer) : Number(order.fiatAmount);

  useEffect(() => {
    if (status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["aggregate-balance"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    }
  }, [status]);

  if (status === "completed") {
    return (
      <div className="space-y-3">
        <ReceiptCard
          title="Funds added"
          amount={`+${Number(order.cryptoAmount ?? 0).toFixed(2)} ${order.token ?? "USDC"}`}
          status="completed"
          date={new Date(order.updatedAt ?? order.createdAt)}
          from={acct?.institution ?? order.currency}
          to="Your wallet"
          lines={[
            { label: "You paid", value: formatMoney(order.fiatAmount, order.currency) },
            { label: "You received", value: `${Number(order.cryptoAmount ?? 0).toFixed(2)} ${order.token ?? "USDC"}` },
            { label: "Network", value: CHAINS.find((c) => c.id === String(order.chain).toUpperCase())?.label ?? String(order.chain ?? "") },
            ...(order.txHash ? [{ label: "Transaction", value: String(order.txHash) }] : []),
            { label: "Reference", value: String(order.reference ?? order.id) },
          ]}
          reference={String(order.reference ?? order.id)}
        />
        <Button variant="secondary" block onClick={onNew}>
          Add more
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="onramp-order">
      <div className="flex items-center justify-between">
        <StatusPill status={status} label={underReview ? "Under review" : undefined} />
        {status === "awaiting_payment" && countdown && countdown.ms > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 tabular-numeric" data-testid="onramp-countdown">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {countdown.text} left
          </span>
        )}
      </div>
      <Progress status={status} />

      {status === "awaiting_payment" && acct && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-hairline" data-testid="deposit-instructions">
          <div className="bg-surface-subtle px-4 py-3">
            <p className="text-[13px] text-ink-3">Send exactly</p>
            <p className="mt-0.5 flex items-center gap-1 text-[28px] font-semibold tracking-[-0.02em] text-ink tabular-numeric">
              {formatMoney(amountToPay, acct.currency || order.currency)}
              <CopyButton value={String(acct.amountToTransfer)} label="Copy amount" />
            </p>
          </div>
          <dl className="divide-y divide-hairline px-4">
            {[
              ["Bank / provider", acct.institution],
              ["Account number", acct.accountIdentifier],
              ["Account name", acct.accountName],
              ...(acct.memo ? [["Reference / memo", acct.memo]] : []),
            ].map(([k, val]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3">
                <dt className="text-[13px] text-ink-3">{k}</dt>
                <dd className="flex min-w-0 items-center gap-1 text-right text-[14.5px] font-semibold text-ink">
                  <span className="break-all">{val}</span>
                  <CopyButton value={String(val)} label={`Copy ${k.toLowerCase()}`} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-hairline px-4 py-3 text-[12.5px] text-ink-3">Pay the exact amount before the timer runs out. A different amount can't be matched.</p>
        </div>
      )}

      {status === "awaiting_payment" && prompt && (
        <div className="flex items-start gap-3 rounded-2xl bg-surface-subtle px-4 py-4" data-testid="onramp-prompt">
          <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-primary" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-semibold text-ink">Approve the prompt on your phone</p>
            <p className="mt-0.5 text-[13.5px] text-ink-3">
              Enter your M-Pesa PIN to pay {formatMoney(amountToPay, order.currency)}
              {order.collection?.phone ? ` from ${order.collection.phone}` : ""}.
            </p>
          </div>
          <Loader2 className="ml-auto h-4 w-4 flex-shrink-0 animate-spin text-ink-3" aria-hidden="true" />
        </div>
      )}

      {status === "processing" && (
        <div className="flex items-start gap-3 rounded-2xl bg-teal-50 px-4 py-4" role="status">
          <Loader2 className="mt-0.5 h-5 w-5 flex-shrink-0 animate-spin text-accent-primary" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-semibold text-ink">{underReview ? "Payment received, under review" : "Payment received"}</p>
            <p className="mt-0.5 text-[13.5px] text-ink-3">
              {underReview ? "This sometimes takes a little longer. No need to pay again." : `Sending ${Number(order.cryptoAmount ?? 0).toFixed(2)} ${order.token ?? "USDC"} to your wallet.`}
            </p>
          </div>
        </div>
      )}

      {(status === "expired" || status === "cancelled" || status === "failed" || status === "refunding" || status === "refunded") && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-tint-pending px-4 py-4" role="alert">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-pending" aria-hidden="true" />
            <p className="text-[14px] text-ink">
              {status === "expired"
                ? "This order expired before a payment arrived. Nothing was charged."
                : status === "refunding"
                  ? "We're returning your payment."
                  : status === "refunded"
                    ? "Your payment was returned."
                    : "This order didn't go through."}
            </p>
          </div>
          <Button block onClick={onNew}>
            Start again
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Buy form ─────────────────────────────────────────────────────── */

export function BuyPanel({ countries, onDisabled }: { countries: PayoutCountry[]; onDisabled: () => void }) {
  const active = countries.filter((c) => c.onrampActive);
  const [currency, setCurrency] = useState(active[0]?.currency ?? "KES");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<"USDC" | "USDT">("USDC");
  const [chain, setChain] = useState("BASE");
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Paycrest needs a verified identity once; we reuse the SmileID flow.
  const [kycOpen, setKycOpen] = useState(false);
  const [order, setOrder] = useState<OnrampOrderFull | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(amount), 450);
    return () => clearTimeout(t);
  }, [amount]);
  const fiat = Number(debounced);
  const quoteQ = useQuery({
    queryKey: ["onramp-quote", currency, fiat, token, chain],
    queryFn: () => getOnrampQuote({ currency, amount: fiat, token, chain }),
    enabled: fiat > 0,
    retry: false,
  });
  const quote = quoteQ.data;
  const items = useMemo(() => active.map((c) => ({ code: c.currency, name: c.name ?? c.country, iso: c.country.toLowerCase() })), [active]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await createOnramp({ currency, fiatAmount: Number(amount), token, chain });
      if (r.kind === "kyc") setKycOpen(true);
      else if (r.kind === "disabled") onDisabled();
      else setOrder(r.order);
    } catch (e: any) {
      setError(e?.message || "Couldn't start the purchase");
    } finally {
      setBusy(false);
    }
  };

  if (order) return <OnrampOrderView initial={order} onNew={() => { setOrder(null); setAmount(""); }} />;

  return (
    <div className="space-y-4" data-testid="buy-panel">
      <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-3">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-ink-2">Pay with</p>
          <CurrencyPicker value={currency} onChange={setCurrency} items={items} label="Currency" testId="buy-currency" />
        </div>
        <Field label="Amount" htmlFor="buy-amount">
          <input
            id="buy-amount"
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={cn(INPUT_CLASS, "text-[17px] font-semibold tabular-numeric")}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink-2">Receive</p>
          <Segmented
            size="sm"
            label="Receive"
            value={token}
            onChange={setToken}
            options={[
              { value: "USDC", label: "USDC" },
              { value: "USDT", label: "USDT" },
            ]}
          />
        </div>
        <Field label="Network" htmlFor="buy-chain">
          <select id="buy-chain" value={chain} onChange={(e) => setChain(e.target.value)} className={cn(INPUT_CLASS, "!h-10 cursor-pointer")}>
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div data-testid="buy-quote">
      <Rows className="rounded-2xl bg-surface-subtle px-4">
        <Row label="You get" strong>
          {quoteQ.isFetching && !quote ? "…" : quote ? `${quote.cryptoAmount.toFixed(2)} ${quote.token}` : "—"}
        </Row>
        <Row label="Rate">{quote?.rate ? `1 ${quote.token} = ${quote.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}` : "—"}</Row>
        <Row label="Fee">{quote ? formatMoney(quote.fee, currency) : "—"}</Row>
      </Rows>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-tint-danger px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button size="lg" block onClick={() => submit()} disabled={!(Number(amount) > 0) || !quote || busy} data-testid="buy-continue">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Continue
      </Button>
      <IdentitySheet open={kycOpen} onClose={() => setKycOpen(false)} onVerified={() => submit()} />
    </div>
  );
}
