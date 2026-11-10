import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, MessageSquare, Share2, Smartphone } from "lucide-react";
import { RequestProvider, useRequest, type RequestType } from "./context";
import useCreateInvoice from "@/hooks/data/use-create-invoice";
import useCountryDetection from "@/hooks/data/use-country-detection";
import useAnalytics from "@/hooks/use-analytics";
import { useOfframpFeePreview, calculateOnrampFeeBreakdown } from "@/hooks/data/use-offramp-fee";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { SUPPORTED_CURRENCIES } from "@/components/ui/currency-selector";
import rift from "@/lib/rift";
import { cn } from "@/lib/utils";
import { Button, CopyButton, Field, INPUT_CLASS, Page, PageHeader, Row, Rows, SideSheet } from "@/v2/ui";
import { FlowSection, SectionActions, type SectionState } from "@/v2/ui/flow";
import { CURRENCY_SYMBOLS, money } from "@/v2/pages/send/offramp";

const QUICK: Record<string, number[]> = {
  KES: [100, 500, 1000, 2000, 5000, 10000],
  NGN: [500, 1000, 5000, 10000, 50000, 100000],
  UGX: [1000, 5000, 10000, 50000, 100000, 500000],
  TZS: [1000, 5000, 10000, 50000, 100000, 500000],
  CDF: [1000, 5000, 10000, 50000, 100000, 500000],
  MWK: [500, 1000, 5000, 10000, 50000, 100000],
  BRL: [10, 50, 100, 200, 500, 1000],
  USD: [5, 10, 20, 50, 100, 500],
};
const DESCRIPTION_OPTIONS = ["Payment for services", "Product purchase", "Consultation fee", "Event ticket", "Subscription payment", "Other"];
const FALLBACK_RATES: Record<string, number> = { KES: 136, NGN: 1580, UGX: 3700, TZS: 2650, CDF: 2800, MWK: 1730, BRL: 5.2, ETB: 62.5, GHS: 15.8, USD: 1 };

// Phone formats, unchanged from the previous share screen.
function formatPhoneIntl(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("07")) return "254" + cleaned.substring(1);
  if (cleaned.startsWith("7") && cleaned.length === 9) return "254" + cleaned;
  if (cleaned.startsWith("254")) return cleaned;
  if (phone.startsWith("+254")) return cleaned;
  return cleaned;
}
function formatMpesaNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) {
    const local = cleaned.substring(3);
    if (local.startsWith("7")) return "07" + local.substring(1);
    if (local.startsWith("1")) return "01" + local.substring(1);
  }
  if (phone.startsWith("+254")) return formatMpesaNumber(cleaned);
  if (cleaned.startsWith("7") && cleaned.length === 9) return "07" + cleaned.substring(1);
  if (cleaned.startsWith("1") && cleaned.length === 9) return "01" + cleaned.substring(1);
  return cleaned;
}

/* ── 1. Amount ─────────────────────────────────────────────────────── */

function AmountSection() {
  const { updateRequestData, setCurrentStep, requestType, requestData } = useRequest();
  const { data: countryInfo } = useCountryDetection();
  const initialCurrency = (() => {
    const stored = localStorage.getItem("selected_currency");
    if (stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored)) return stored;
    if (countryInfo?.currency && SUPPORTED_CURRENCIES.some((c) => c.code === countryInfo.currency)) return countryInfo.currency;
    return "USD";
  })();
  const [currency, setCurrency] = useState<string>(requestData.currency || initialCurrency);
  const [localAmount, setLocalAmount] = useState(requestData.amount ? String(requestData.amount) : "");

  useEffect(() => {
    if (countryInfo?.currency && !localStorage.getItem("selected_currency") && !requestData.currency) {
      if (SUPPORTED_CURRENCIES.some((c) => c.code === countryInfo.currency)) setCurrency(countryInfo.currency);
    }
  }, [countryInfo]);

  const { data: feePreview } = useOfframpFeePreview(currency, requestType === "topup" && currency !== "USD");
  const feeBreakdown = useMemo(() => {
    const amount = parseFloat(localAmount);
    if (!feePreview || isNaN(amount) || amount <= 0 || requestType !== "topup" || currency === "USD") return null;
    return calculateOnrampFeeBreakdown(amount, feePreview);
  }, [localAmount, feePreview, requestType, currency]);

  const valid = !!localAmount && parseFloat(localAmount) > 0;

  const handleNext = () => {
    if (!valid) return;
    if (requestType === "topup") {
      updateRequestData({ amount: parseFloat(localAmount), currency, description: "Rift wallet top-up", feeBreakdown: feeBreakdown || undefined });
    } else {
      updateRequestData({ amount: parseFloat(localAmount), currency });
    }
    setCurrentStep(requestType === "topup" ? "sharing" : "description");
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
        <Field label="Currency" htmlFor="request-currency">
          <select id="request-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={cn(INPUT_CLASS, "cursor-pointer")}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={requestType === "topup" ? "Amount to add" : "Amount to request"} htmlFor="request-amount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ink-3">{CURRENCY_SYMBOLS[currency] || currency}</span>
            <input
              id="request-amount"
              type="number"
              inputMode="decimal"
              min={0}
              value={localAmount}
              onChange={(e) => setLocalAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder="0"
              className={cn(INPUT_CLASS, "pl-14 text-[17px] font-semibold tabular-numeric")}
              autoFocus
            />
          </div>
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick amounts">
        {(QUICK[currency] || QUICK.USD).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setLocalAmount(String(v))}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] font-medium tabular-numeric cursor-pointer",
              localAmount === String(v) ? "border-accent-primary bg-teal-50 text-accent-primary" : "border-hairline text-ink-2 hover:border-hairline-strong"
            )}
          >
            {v.toLocaleString()}
          </button>
        ))}
      </div>
      {requestType === "topup" && feeBreakdown && (
        <Rows className="mt-4 rounded-md bg-surface-subtle px-4">
          <Row label="Exchange rate">{`1 USD = ${feeBreakdown.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`}</Row>
          <Row label={`Fee (${feeBreakdown.feePercentage}%)`}>{money(currency, feeBreakdown.feeLocal)}</Row>
          <Row label="You pay" strong>
            {money(currency, feeBreakdown.totalLocalToPay)}
          </Row>
          <Row label="You receive">{`${feeBreakdown.usdcToReceive.toFixed(2)} USDC`}</Row>
        </Rows>
      )}
      <SectionActions>
        <Button size="lg" onClick={handleNext} disabled={!valid}>
          {requestType === "topup" ? "Create funding link" : "Continue"}
        </Button>
      </SectionActions>
    </div>
  );
}

/* ── 2. Details (payment requests only) ────────────────────────────── */

function DetailsSection() {
  const { requestData, updateRequestData, setCurrentStep, setCreatedInvoice } = useRequest();
  const { logEvent, updatePersonProperties } = useAnalytics();
  const createInvoiceMutation = useCreateInvoice();
  const [description, setDescription] = useState(requestData.description || "");
  const [sellingRate, setSellingRate] = useState<number | null>(null);
  const [withdrawalRate, setWithdrawalRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const requestCurrency = (requestData.currency || "KES") as SupportedCurrency;

  // Selling rate prices the invoice; rate shows what the user will receive.
  useEffect(() => {
    (async () => {
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) throw new Error("No authentication token found");
        rift.setBearerToken(authToken);
        if (requestCurrency === "USD") {
          setSellingRate(1);
          setWithdrawalRate(1);
          return;
        }
        const response = await rift.offramp.previewExchangeRate({ currency: requestCurrency as any });
        setSellingRate(response.selling_rate);
        setWithdrawalRate(response.rate);
      } catch {
        setSellingRate(FALLBACK_RATES[requestCurrency]);
        setWithdrawalRate(FALLBACK_RATES[requestCurrency]);
        toast.warning("Using approximate exchange rate");
      } finally {
        setLoadingRate(false);
      }
    })();
  }, [requestCurrency]);

  const handleCreateInvoice = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!sellingRate || !withdrawalRate) {
      toast.error("Exchange rate not loaded. Please try again.");
      return;
    }
    try {
      const localAmount = requestData.amount || 0;
      const usdAmount = requestCurrency === "USD" ? localAmount : Math.round((localAmount / sellingRate) * 1e6) / 1e6;
      const receiveAmount = usdAmount * withdrawalRate;
      const response = await createInvoiceMutation.mutateAsync({
        chain: requestData.chain,
        token: requestData.token,
        amount: usdAmount,
        description: description.trim(),
      } as any);
      setCreatedInvoice({ ...response, localAmount, currency: requestCurrency, receiveAmount });
      updateRequestData({ description: description.trim() });
      logEvent("PAYMENT_REQUEST_CREATED", {
        amount_usd: usdAmount,
        amount_local: localAmount,
        currency: requestCurrency,
        exchange_rate: sellingRate,
        chain: requestData.chain,
        token: requestData.token,
        description: description.trim(),
      });
      updatePersonProperties({ has_created_payment_request: true });
      setCurrentStep("sharing");
      toast.success("Payment request created successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create payment request. Please try again.");
    }
  };

  return (
    <div>
      <Field label="Description" htmlFor="request-description" hint={`${description.length}/200 · Shown to the payer on the payment page`}>
        <textarea
          id="request-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Invoice #1042 — logistics"
          rows={3}
          maxLength={200}
          className={cn(INPUT_CLASS, "h-auto resize-none py-2.5")}
          autoFocus
        />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick descriptions">
        {DESCRIPTION_OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setDescription(o)}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] font-medium cursor-pointer",
              description === o ? "border-accent-primary bg-teal-50 text-accent-primary" : "border-hairline text-ink-2 hover:border-hairline-strong"
            )}
          >
            {o}
          </button>
        ))}
      </div>
      <Rows className="mt-4 rounded-md bg-surface-subtle px-4">
        <Row label="Requesting">{money(requestCurrency, requestData.amount || 0)}</Row>
        {requestCurrency !== "USD" && (
          <Row label="Exchange rate">{loadingRate ? "…" : sellingRate ? `1 USD = ${sellingRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${requestCurrency}` : "—"}</Row>
        )}
      </Rows>
      <SectionActions onBack={() => setCurrentStep("amount")}>
        <Button size="lg" onClick={handleCreateInvoice} disabled={!description.trim() || loadingRate || createInvoiceMutation.isPending}>
          {createInvoiceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Create payment link
        </Button>
      </SectionActions>
    </div>
  );
}

/* ── 3. Share / pay ────────────────────────────────────────────────── */

function ShareSection() {
  const navigate = useNavigate();
  const { logEvent, updatePersonProperties } = useAnalytics();
  const { createdInvoice, requestType, requestData, setCreatedInvoice, setCurrentStep } = useRequest();
  const requestCurrency = (requestData.currency || createdInvoice?.currency || "KES") as SupportedCurrency;
  const symbol = CURRENCY_SYMBOLS[requestCurrency] || requestCurrency;
  const createInvoiceMutation = useCreateInvoice();
  const creatingRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [mpesaOpen, setMpesaOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [sending, setSending] = useState(false);

  // Top-ups create their funding link as soon as this section opens.
  useEffect(() => {
    (async () => {
      if (requestType !== "topup" || createdInvoice || creatingRef.current) return;
      creatingRef.current = true;
      setCreating(true);
      try {
        const authToken = localStorage.getItem("token");
        if (!authToken) throw new Error("No authentication token found");
        rift.setBearerToken(authToken);
        const topupCurrency = (requestData.currency || "KES") as SupportedCurrency;
        const rates = topupCurrency === "USD" ? { selling_rate: 1, rate: 1 } : await rift.offramp.previewExchangeRate({ currency: topupCurrency as any });
        const localAmount = requestData.amount || 0;
        const usdAmount = topupCurrency === "USD" ? localAmount : Math.round((localAmount / rates.selling_rate) * 1e6) / 1e6;
        const receiveAmount = usdAmount * rates.rate;
        const response = await createInvoiceMutation.mutateAsync({
          chain: requestData.chain,
          token: requestData.token,
          amount: usdAmount,
          description: requestData.description || "Rift wallet top-up",
        } as any);
        setCreatedInvoice({ ...response, localAmount, currency: topupCurrency, receiveAmount });
        logEvent("PAYMENT_LINK_CREATED", {
          type: "topup",
          amount_usd: usdAmount,
          amount_local: localAmount,
          currency: topupCurrency,
          exchange_rate: rates.selling_rate,
          chain: requestData.chain,
          token: requestData.token,
        });
        updatePersonProperties({ has_created_payment_request: true });
        toast.success("Top-up link created successfully!");
      } catch (error: any) {
        toast.error(error?.message || "Failed to create top-up link. Please try again.");
        setCurrentStep("amount");
      } finally {
        creatingRef.current = false;
        setCreating(false);
      }
    })();
  }, [requestType]);

  if (!createdInvoice || creating) {
    return (
      <div className="flex flex-col items-center gap-3 py-8" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-ink-3" aria-hidden="true" />
        <p className="text-[13.5px] text-ink-3">{requestType === "topup" ? "Creating your funding link…" : "Loading…"}</p>
      </div>
    );
  }

  const localAmount = createdInvoice.localAmount || createdInvoice.amount;
  const message = `Payment request for ${symbol} ${Number(localAmount).toLocaleString()} (${requestCurrency}) - ${createdInvoice.description}`;

  const share = async () => {
    if (navigator.share && (window.isSecureContext || location.protocol === "https:")) {
      try {
        await navigator.share({ title: "Payment Request - Rift", text: message, url: createdInvoice.url });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${message}\n\n${createdInvoice.url}`)}`, "_blank");
      return;
    }
    await navigator.clipboard.writeText(createdInvoice.url).catch(() => undefined);
    toast.info("Copied to clipboard - paste in WhatsApp or any app");
  };

  const sendSms = async () => {
    if (!phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    setSending(true);
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) throw new Error("No authentication token found");
      rift.setBearerToken(authToken);
      const response = await rift.offramp.sendPaymentLink({ paymentLink: createdInvoice.url, message, recipientPhone: formatPhoneIntl(phone.trim()) });
      if (response.results?.smsSent) toast.success("Payment request sent to phone number!");
      else toast.error("Failed to send SMS. Please try again.");
      setPhone("");
      setSmsOpen(false);
    } catch {
      toast.error("Failed to send to phone number");
    } finally {
      setSending(false);
    }
  };

  const sendMpesa = async () => {
    if (!mpesaNumber.trim()) {
      toast.error("Please enter M-Pesa number");
      return;
    }
    setSending(true);
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) throw new Error("No authentication token found");
      rift.setBearerToken(authToken);
      const ex = await rift.offramp.previewExchangeRate({ currency: requestCurrency as any });
      const amountLocal = createdInvoice?.localAmount || requestData.amount || 0;
      const usdAmount = requestCurrency === "USD" ? amountLocal : Math.round((amountLocal / ex.selling_rate) * 1e6) / 1e6;
      await rift.onrampV2.buy({
        shortcode: formatMpesaNumber(mpesaNumber.trim()),
        amount: usdAmount,
        chain: "base" as any,
        asset: "USDC" as any,
        mobile_network: "Safaricom",
        country_code: requestCurrency,
      } as any);
      toast.success("M-Pesa prompt sent! Customer will receive payment request on their phone.");
      setMpesaNumber("");
      setMpesaOpen(false);
    } catch (error: any) {
      if (error.message?.includes("404")) toast.error("M-Pesa prompt API not found. Please contact support.");
      else if (error.message?.includes("401") || error.message?.includes("403")) toast.error("Authentication failed. Please log in again.");
      else if (error.message?.includes("network") || error.message?.includes("fetch")) toast.error("Network error. Please check your connection.");
      else toast.error(`Failed to send M-Pesa prompt: ${error.message || "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="payment-link-card">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="mx-auto flex-shrink-0 rounded-lg border border-hairline bg-[#ffffff] p-3 sm:mx-0">
          <QRCodeSVG value={createdInvoice.url} size={148} level="M" fgColor="#10181a" bgColor="#ffffff" role="img" aria-label="Payment link QR code" />
          <p className="mt-2 text-center text-[11.5px] font-medium text-[#5d6a6d]">Scan to pay</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-3">{requestType === "topup" ? "Funding link ready" : "Payment request"}</p>
          <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-numeric">{money(requestCurrency, Number(localAmount))}</p>
          {createdInvoice.description && <p className="mt-2 text-[13.5px] text-ink-2">{createdInvoice.description}</p>}
          <div className="mt-4 flex items-center gap-1 rounded-md border border-hairline bg-surface-subtle px-3 py-2">
            <a href={createdInvoice.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-accent-primary hover:underline">
              {String(createdInvoice.url).replace(/^https?:\/\//, "")}
            </a>
            <CopyButton value={createdInvoice.url} label="Copy link" />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button onClick={share}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share link
        </Button>
        <Button variant="secondary" onClick={() => setSmsOpen(true)}>
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Send by SMS
        </Button>
        {requestCurrency === "KES" && (
          <Button variant="secondary" onClick={() => setMpesaOpen(true)}>
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            M-Pesa prompt
          </Button>
        )}
      </div>
      <SectionActions>
        <Button variant="secondary" onClick={() => navigate(requestType === "topup" ? "/app" : "/app/payment-links")}>
          Done
        </Button>
      </SectionActions>

      <SideSheet
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        title="Send by SMS"
        description="We text the payment link to this number."
        footer={
          <Button block onClick={sendSms} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Send link
          </Button>
        }
      >
        <Field label="Phone number" htmlFor="sms-phone">
          <input id="sms-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className={INPUT_CLASS} autoFocus />
        </Field>
      </SideSheet>
      <SideSheet
        open={mpesaOpen}
        onClose={() => setMpesaOpen(false)}
        title="M-Pesa prompt"
        description="The payer gets an M-Pesa prompt on their phone to approve the payment."
        footer={
          <Button block onClick={sendMpesa} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Send prompt
          </Button>
        }
      >
        <Field label="M-Pesa number" htmlFor="mpesa-number">
          <input id="mpesa-number" type="tel" value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)} placeholder="0712 345 678" className={INPUT_CLASS} autoFocus />
        </Field>
      </SideSheet>
    </div>
  );
}

/* ── Container ─────────────────────────────────────────────────────── */

function RequestFlow() {
  const { currentStep, setCurrentStep, setRequestType, requestType, requestData, createdInvoice } = useRequest();
  const [params] = useSearchParams();

  useEffect(() => {
    const type = params.get("type") as RequestType;
    if (type === "request" || type === "topup") setRequestType(type);
  }, [params, setRequestType]);

  const order = requestType === "topup" ? ["amount", "sharing"] : ["amount", "description", "sharing"];
  const stateOf = (k: string): SectionState => {
    const i = order.indexOf(k);
    const a = order.indexOf(currentStep);
    return i < a ? "done" : i === a ? "active" : "upcoming";
  };
  const linkReady = !!createdInvoice;
  const cur = requestData.currency || "USD";

  return (
    <Page width="narrow">
      <PageHeader
        title={requestType === "topup" ? "Add funds" : "Request a payment"}
        description={
          requestType === "topup"
            ? "Create a funding link and pay it from mobile money or any stablecoin wallet."
            : "Create a payment link for a specific amount and share it with your customer."
        }
      />
      <div className="space-y-3" data-testid="request-flow">
        <FlowSection
          step={1}
          title="Amount"
          testId="section-amount"
          description={requestType === "topup" ? "How much to add, in your local currency" : "How much the payer pays"}
          state={stateOf("amount")}
          summary={requestData.amount ? money(cur, requestData.amount) : undefined}
          onEdit={linkReady ? undefined : () => setCurrentStep("amount")}
        >
          <AmountSection />
        </FlowSection>
        {requestType !== "topup" && (
          <FlowSection
            step={2}
            title="Details"
            testId="section-details"
            description="What this payment is for"
            state={stateOf("description")}
            summary={requestData.description}
            onEdit={linkReady ? undefined : () => setCurrentStep("description")}
          >
            <DetailsSection />
          </FlowSection>
        )}
        <FlowSection
          step={requestType === "topup" ? 2 : 3}
          title={requestType === "topup" ? "Pay" : "Share"}
          testId="section-share"
          description={requestType === "topup" ? "Pay this link from M-Pesa or any stablecoin wallet" : "Send the link or let the payer scan the QR"}
          state={stateOf("sharing")}
        >
          <ShareSection />
        </FlowSection>
      </div>
    </Page>
  );
}

export default function Request() {
  return (
    <RequestProvider>
      <RequestFlow />
    </RequestProvider>
  );
}
