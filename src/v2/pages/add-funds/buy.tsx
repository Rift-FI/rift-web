import { useEffect, useMemo, useState } from "react";
import { isDeviceBlock } from "@/lib/device";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, Loader2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONRAMP_ASSETS, createOnramp, getOnramp, getOnrampQuote, onrampProviderFor, type OnrampOrderFull } from "@/v2/lib/onramp";
import { ChainLogo, Monogram, Picker } from "@/v2/ui/picker";
import { IdentitySheet } from "@/v2/pages/kyc/identity-sheet";
import { STATUS_LABEL, isFinal, toAppStatus, type AppStatus } from "@/v2/lib/status";
import type { PayoutCountry } from "@/v2/lib/countries";
import { Button, CopyButton, Field, INPUT_CLASS, Row, Rows, StatusPill, formatMoney } from "@/v2/ui";
import { CurrencyPicker, isoFor } from "@/v2/ui/currency-picker";
import { ReceiptCard } from "@/v2/ui/receipt";

const CHAINS = [
  { id: "BASE", label: "Base" },
  { id: "POLYGON", label: "Polygon" },
  { id: "ETHEREUM", label: "Ethereum" },
  { id: "CELO", label: "Celo" },
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
              Enter your {order.currency === "KES" ? "M-Pesa" : order.collection?.network ?? "mobile money"} PIN to pay {formatMoney(amountToPay, order.currency)}
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

const assetKey = (a: { token: string; chain: string }) => `${a.token}:${a.chain}`;
const chainLabel = (id: string) => CHAINS.find((c) => c.id === id)?.label ?? id.charAt(0) + id.slice(1).toLowerCase();

export function BuyPanel({ countries, onDisabled }: { countries: PayoutCountry[]; onDisabled: () => void }) {
  const active = countries.filter((c) => c.onrampActive);
  const [currency, setCurrency] = useState(active[0]?.currency ?? "KES");
  const country = active.find((c) => c.currency === currency);
  const provider = onrampProviderFor(currency, country?.onrampProvider);
  const assets = ONRAMP_ASSETS[provider];
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState(assetKey(assets[0]));
  const [token, chain] = asset.split(":");
  // Pretium collects from a mobile-money wallet: phone + network.
  const networks = country?.rails.mobile ?? [];
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ min: number; max: number } | null>(null);
  // Paycrest needs a verified identity once; we reuse the SmileID flow.
  const [kycOpen, setKycOpen] = useState(false);
  const [order, setOrder] = useState<OnrampOrderFull | null>(null);

  useEffect(() => {
    if (!assets.some((a) => assetKey(a) === asset)) setAsset(assetKey(assets[0]));
    setNetwork((n) => (networks.includes(n) ? n : networks[0] ?? ""));
    setRange(null);
    setError(null);
  }, [currency]);
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
  const quoteRange: { min: number; max: number } | null = (quoteQ.error as any)?.range ?? null;
  const limits = range ?? quoteRange;
  const amt = Number(amount);
  const outOfRange = !!limits && amt > 0 && ((limits.min > 0 && amt < limits.min) || (limits.max > 0 && amt > limits.max));
  const items = useMemo(() => active.map((c) => ({ code: c.currency, name: c.name ?? c.country, iso: isoFor(c.country, c.currency) })), [active]);
  const phoneDigits = phone.replace(/\D/g, "");
  const needsPhone = provider === "pretium";
  const phoneOk = !needsPhone || (phoneDigits.length >= 9 && !!network);
  const fullPhone = () => {
    const code = (country?.phoneCode ?? "").replace(/\D/g, "");
    if (code && phoneDigits.startsWith(code)) return `+${phoneDigits}`;
    return `+${code}${phoneDigits.replace(/^0+/, "")}`;
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await createOnramp({ currency, fiatAmount: amt, token, chain, ...(needsPhone ? { phone: fullPhone(), network } : {}) });
      if (r.kind === "kyc") setKycOpen(true);
      else if (r.kind === "disabled") onDisabled();
      else if (r.kind === "range") setRange({ min: r.min, max: r.max });
      else setOrder(r.order);
    } catch (e: any) {
      if (!isDeviceBlock(e)) setError(e?.message || "Couldn't start the purchase");
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
          <CurrencyPicker value={currency} onChange={setCurrency} items={items} label="Currency" testId="buy-currency" compact />
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
            aria-invalid={outOfRange || undefined}
            aria-describedby={outOfRange ? "buy-range" : undefined}
            className={cn(INPUT_CLASS, "text-[17px] font-semibold tabular-numeric", outOfRange && "!border-danger")}
          />
        </Field>
      </div>
      {outOfRange && limits && (
        <p id="buy-range" role="alert" className="-mt-2 text-[13px] text-danger" data-testid="buy-range">
          Enter between {formatMoney(limits.min, currency)} and {formatMoney(limits.max, currency)}.
        </p>
      )}
      {needsPhone && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-ink-2">Network</p>
            <Picker
              value={network}
              onChange={setNetwork}
              label="Mobile network"
              placeholder="Choose"
              testId="buy-network"
              options={networks.map((n) => ({ value: n, label: n, icon: <Monogram text={n} className="h-7 w-7 text-[11px]" /> }))}
            />
          </div>
          <Field label="Phone number" htmlFor="buy-phone">
            <div className="flex h-11 items-center rounded-md border border-hairline-strong bg-card focus-within:ring-2 focus-within:ring-accent-primary/25">
              {country?.phoneCode && <span className="pl-3 pr-1 text-[15px] text-ink-3 tabular-numeric">{country.phoneCode}</span>}
              <input
                id="buy-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="712 345 678"
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
              />
            </div>
          </Field>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-ink-2">Receive</p>
        <Picker
          value={asset}
          onChange={setAsset}
          label="Receive"
          testId="buy-asset"
          options={assets.map((a) => ({
            value: assetKey(a),
            label: `${a.token} on ${chainLabel(a.chain)}`,
            description: a.token === "USDC" ? "USD Coin" : "Tether USD",
            icon: <ChainLogo chain={a.chain} className="h-7 w-7" />,
          }))}
        />
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
      {quoteQ.isError && !quoteRange && <p className="-mt-2 text-[13px] text-ink-3">No quote for this amount right now. Try a different amount.</p>}
      {error && (
        <p role="alert" className="rounded-xl bg-tint-danger px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button size="lg" block onClick={() => submit()} disabled={!(amt > 0) || !quote || busy || outOfRange || !phoneOk} data-testid="buy-continue">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Continue
      </Button>
      {provider === "paycrest" && <IdentitySheet open={kycOpen} onClose={() => setKycOpen(false)} onVerified={() => submit()} />}
    </div>
  );
}
