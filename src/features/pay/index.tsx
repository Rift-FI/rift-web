import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Fingerprint, Loader2 } from "lucide-react";
import { PayProvider, usePay, type PayMethod, type PayStep } from "./context";
import CountrySelector from "./components/CountrySelector";
import PaymentTypeSelector from "./components/PaymentTypeSelector";
import RecipientInput from "./components/RecipientInput";
import usePayment from "@/hooks/data/use-payment";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { markAccountDeployed } from "@/hooks/wallet/use-account-deployed";
import { addPendingWithdrawal } from "@/lib/pending-withdrawal";
import { downloadReceipt } from "@/lib/receipt";
import { Button, Row } from "@/v2/ui";
import { FlowSection, SectionActions, type SectionState } from "@/v2/ui/flow";
import { ReceiptCard } from "@/v2/ui/receipt";
import { AmountStep, COUNTRY_NAMES, QuoteRows, SourcePicker, money, sourceLabel, useOfframpQuote } from "@/v2/pages/send/offramp";

type SectionKey = "destination" | "recipient" | "source" | "amount" | "review";
const SECTION_OF: Record<PayStep, SectionKey> = {
  country: "destination",
  type: "destination",
  recipient: "recipient",
  source: "source",
  amount: "amount",
  confirmation: "review",
};
const ORDER: SectionKey[] = ["destination", "recipient", "source", "amount", "review"];

const TYPE_LABEL: Record<string, string> = {
  MOBILE: "Send money",
  BANK: "Bank transfer",
  PAYBILL: "Paybill",
  BUY_GOODS: "Buy goods (till)",
};

interface PayReceipt {
  amount: number;
  currency: string;
  recipient: string;
  institution?: string;
  reference?: string;
  orderId?: string;
  status: string;
  at: Date;
  totalDeducted: number;
  fee: number;
  source: string;
}

/**
 * Mobile-money and bank payouts as one sectioned form:
 * Destination → Recipient → Pay from → Amount → Review → passkey → receipt.
 * Same offramp call (makePayment → init → passkey → finalize) as before.
 */
function PayFlow() {
  const navigate = useNavigate();
  const { paymentData, updatePaymentData, currentStep, setCurrentStep, resetPayment, method } = usePay();
  const paymentMutation = usePayment();
  const [receipt, setReceipt] = useState<PayReceipt | null>(null);

  const currency = (paymentData.currency || "KES") as SupportedCurrency;
  const quote = useOfframpQuote({
    currency,
    sourceId: paymentData.selectedSource,
    amount: paymentData.amount,
    feeBreakdownIn: paymentData.feeBreakdown,
  });

  const active = SECTION_OF[currentStep] ?? "destination";
  const stateOf = (k: SectionKey): SectionState => {
    const i = ORDER.indexOf(k);
    const a = ORDER.indexOf(active);
    return i < a ? "done" : i === a ? "active" : "upcoming";
  };

  const recipientDisplay = (() => {
    const r = paymentData.recipient;
    if (!r) return "";
    if (currency === "KES" && r.type === "PAYBILL") return `${r.accountIdentifier} – ${r.accountNumber}${r.accountName ? ` (${r.accountName})` : ""}`;
    return `${r.accountIdentifier}${r.accountName ? ` (${r.accountName})` : ""}`;
  })();

  const localAmount = paymentData.amount || 0;

  const executePayment = async (verification: { otpCode?: string; password?: string } = {}) => {
    const sourceConfig = quote.sourceConfig;
    if (!paymentData.amount || !paymentData.recipient) {
      toast.error("Missing payment information");
      return;
    }
    if (!sourceConfig) {
      toast.error("No payment source selected");
      return;
    }
    const feeData = quote.display;
    const exchangeRate = feeData?.exchangeRate || quote.exchangeRate || null;
    const usdAmountToSend =
      feeData?.usdcAmount ||
      (currency === "USD" ? localAmount : exchangeRate ? Math.round((localAmount / exchangeRate) * 1e6) / 1e6 : localAmount);
    const recipientString = JSON.stringify(paymentData.recipient);

    const lockError = checkAndSetTransactionLock("pay", usdAmountToSend, recipientString, currency);
    if (lockError) {
      toast.error(lockError);
      return;
    }

    try {
      const res = await paymentMutation.mutateAsync({
        token: sourceConfig.token as any,
        amount: usdAmountToSend,
        localAmount,
        currency: currency as any,
        chain: sourceConfig.sdkChain as any,
        recipient: recipientString,
        ...verification,
      } as any);
      markAccountDeployed(sourceConfig.chain);
      addPendingWithdrawal({ amount: localAmount, currency });
      setReceipt({
        amount: localAmount,
        currency,
        recipient: recipientDisplay,
        institution: paymentData.recipient.institution,
        reference: res.order?.transactionCode,
        orderId: res.order?.id,
        status: res.order?.status || "PENDING",
        at: new Date(),
        totalDeducted: quote.displayedTotal,
        fee: quote.serviceFeeLocal + quote.networkFeeInLocal,
        source: sourceLabel(paymentData.selectedSource),
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to process payment. Please try again.");
    }
  };

  if (receipt) {
    return (
      <div className="mx-auto w-full max-w-[520px]">
        <ReceiptCard
          title="Payout submitted"
          amount={money(receipt.currency, receipt.amount)}
          status={/complete|success/i.test(receipt.status) ? "succeeded" : "pending"}
          date={receipt.at}
          from={receipt.source}
          to={
            <>
              {receipt.recipient}
              {receipt.institution && <span className="block text-[12px] font-normal text-ink-3">via {receipt.institution}</span>}
            </>
          }
          lines={[
            { label: "Recipient gets", value: money(receipt.currency, receipt.amount) },
            { label: "Fees", value: money(receipt.currency, receipt.fee) },
            { label: "Total deducted", value: money(receipt.currency, receipt.totalDeducted), strong: true },
            ...(receipt.reference ? [{ label: "Reference", value: <span className="font-mono text-[13px]">{receipt.reference}</span> }] : []),
          ]}
          shareText={`Rift payout: ${money(receipt.currency, receipt.amount)} to ${receipt.recipient}${receipt.reference ? ` (ref ${receipt.reference})` : ""}`}
          onDownload={() =>
            downloadReceipt({
              type: "withdrawal",
              transactionCode: receipt.reference || receipt.orderId || "payout",
              amount: receipt.amount,
              currency: receipt.currency,
              public_name: receipt.recipient,
              createdAt: receipt.at.toISOString(),
              status: receipt.status,
            })
          }
        />
        <p className="mt-3 text-center text-[12.5px] text-ink-3">Most payouts arrive within a few minutes. Track it in Payments.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" block onClick={() => navigate("/app/payments")}>
            View payments
          </Button>
          <Button
            block
            onClick={() => {
              setReceipt(null);
              resetPayment();
            }}
          >
            New payout
          </Button>
        </div>
      </div>
    );
  }

  const destinationSummary = paymentData.currency
    ? `${COUNTRY_NAMES[currency] || currency}${paymentData.type && currency === "KES" ? ` · ${TYPE_LABEL[paymentData.type] || paymentData.type}` : ""}`
    : undefined;

  return (
    <div className="space-y-3" data-testid="payout-flow">
      <FlowSection
        step={1}
        title="Destination"
        testId="section-destination"
        description={
          method === "bank" ? "Where the receiving bank account is held" : method === "mobile" ? "Where the mobile money wallet is registered" : "Where the money is going"
        }
        state={stateOf("destination")}
        summary={destinationSummary}
        onEdit={() => setCurrentStep("country")}
      >
        {currentStep === "type" ? <PaymentTypeSelector /> : <CountrySelector />}
      </FlowSection>

      <FlowSection
        step={2}
        title="Recipient"
        testId="section-recipient"
        description="Who receives the payout"
        state={stateOf("recipient")}
        summary={
          paymentData.recipient && (
            <>
              {recipientDisplay}
              {paymentData.recipient.institution && <span className="text-ink-3">{" · "}{paymentData.recipient.institution}</span>}
            </>
          )
        }
        onEdit={() => setCurrentStep("recipient")}
      >
        <RecipientInput />
      </FlowSection>

      <FlowSection
        step={3}
        title="Pay from"
        testId="section-source"
        description="The balance this payout is funded from"
        state={stateOf("source")}
        summary={sourceLabel(paymentData.selectedSource)}
        onEdit={() => setCurrentStep("source")}
      >
        <SourcePicker
          currency={currency}
          value={paymentData.selectedSource}
          onSelect={(id) => {
            updatePaymentData({ selectedSource: id });
            setCurrentStep("amount");
          }}
          onBack={() => setCurrentStep("recipient")}
        />
      </FlowSection>

      <FlowSection
        step={4}
        title="Amount"
        testId="section-amount"
        description={`How much the recipient gets, in ${currency}`}
        state={stateOf("amount")}
        summary={paymentData.amount ? money(currency, paymentData.amount) : undefined}
        onEdit={() => setCurrentStep("amount")}
      >
        <AmountStep
          currency={currency}
          sourceId={paymentData.selectedSource}
          initialAmount={paymentData.amount}
          onBack={() => setCurrentStep("source")}
          onContinue={(amount, feeBreakdown) => {
            updatePaymentData({ amount, feeBreakdown });
            setCurrentStep("confirmation");
          }}
        />
      </FlowSection>

      <FlowSection step={5} title="Review and confirm" testId="section-review" description="Check the details. Payouts can't be reversed." state={stateOf("review")}>
        <QuoteRows
          quote={quote}
          currency={currency}
          receiveLabel="Recipient gets"
          extra={
            <>
              <Row label="To">
                <span className="block">{recipientDisplay}</span>
                {paymentData.recipient?.institution && <span className="block text-[12.5px] text-ink-3">via {paymentData.recipient.institution}</span>}
              </Row>
              {paymentData.type && currency === "KES" && <Row label="Payment type">{TYPE_LABEL[paymentData.type]}</Row>}
            </>
          }
        />
        {quote.balanceInsufficient && quote.sourceConfig && (
          <p role="alert" className="mt-3 flex gap-2 text-[13px] text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            Insufficient {quote.sourceConfig.token} on {quote.sourceConfig.chainLabel}. Top up your wallet to continue.
          </p>
        )}
        <SectionActions onBack={() => setCurrentStep("amount")}>
          <Button size="lg" onClick={() => executePayment({})} disabled={quote.isLoading || paymentMutation.isPending || quote.balanceInsufficient}>
            {paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-4 w-4" aria-hidden="true" />}
            {quote.balanceInsufficient && quote.sourceConfig
              ? `Insufficient ${quote.sourceConfig.token}`
              : paymentMutation.isPending
                ? "Waiting for passkey…"
                : `Approve ${money(currency, quote.displayedTotal || localAmount)} with passkey`}
          </Button>
        </SectionActions>
      </FlowSection>
    </div>
  );
}

export default function Pay({ method = "all" }: { method?: PayMethod }) {
  return (
    <PayProvider method={method}>
      <PayFlow />
    </PayProvider>
  );
}

