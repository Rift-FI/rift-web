import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Fingerprint, Loader2, Plus } from "lucide-react";
import { WithdrawProvider, useWithdraw, type WithdrawStep } from "./context";
import useUser from "@/hooks/data/use-user";
import useUpdateUser from "@/hooks/data/use-update-user";
import useCreateWithdrawalOrder from "@/hooks/data/use-create-withdrawal-order";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import useAnalytics from "@/hooks/use-analytics";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { markAccountDeployed } from "@/hooks/wallet/use-account-deployed";
import { addPendingWithdrawal } from "@/lib/pending-withdrawal";
import { toAppStatus } from "@/v2/lib/status";
import PaymentAccountSetup from "@/components/ui/payment-account-setup";
import { Button, EmptyState, Page, PageHeader, Row, Skeleton } from "@/v2/ui";
import { FlowSection, SectionActions, type SectionState } from "@/v2/ui/flow";
import { ReceiptCard } from "@/v2/ui/receipt";
import { AmountStep, OfframpSourceStep, QuoteRows, money, sourceLabel, useOfframpQuote } from "@/v2/pages/send/offramp";

type SectionKey = "account" | "source" | "amount" | "review";
const SECTION_OF: Record<WithdrawStep, SectionKey> = { source: "source", amount: "amount", confirmation: "review", success: "review" };
const ORDER: SectionKey[] = ["account", "amount", "source", "review"];

function describeAccount(raw?: string) {
  if (!raw) return null;
  try {
    const a = JSON.parse(raw);
    return {
      currency: (a.currency || "KES") as SupportedCurrency,
      label: `${a.institution}${a.type ? ` (${a.type})` : ""}: ${a.accountIdentifier}${a.accountNumber ? ` – ${a.accountNumber}` : ""}${a.accountName ? ` – ${a.accountName}` : ""}`,
    };
  } catch {
    return { currency: "KES" as SupportedCurrency, label: "Account configured" };
  }
}

interface WithdrawReceipt {
  amount: number;
  currency: string;
  account: string;
  reference?: string;
  status: string;
  at: Date;
  totalDeducted: number;
  fee: number;
  source: string;
}

/**
 * Withdraw to the saved payout account as one sectioned form:
 * Payout account → Pay from → Amount → Review → passkey → receipt.
 * Same createWithdrawalOrder call (offramp init → passkey → finalize).
 */
function WithdrawFlow() {
  const navigate = useNavigate();
  const { withdrawData, updateWithdrawData, currentStep, setCurrentStep, resetWithdraw } = useWithdraw();
  const { data: user, isLoading: userLoading } = useUser();
  const updateUser = useUpdateUser();
  const createOrderMutation = useCreateWithdrawalOrder();
  const { logEvent, updatePersonProperties } = useAnalytics();
  const [setupOpen, setSetupOpen] = useState(false);
  const [receipt, setReceipt] = useState<WithdrawReceipt | null>(null);

  const paymentAccount: string | undefined = user?.paymentAccount || user?.payment_account;
  const account = describeAccount(paymentAccount);
  const currency = (withdrawData.currency as SupportedCurrency) || account?.currency || "KES";

  const quote = useOfframpQuote({
    currency,
    sourceId: withdrawData.selectedSource,
    amount: withdrawData.amount,
    feeBreakdownIn: withdrawData.feeBreakdown,
  });

  const active: SectionKey = !account ? "account" : SECTION_OF[currentStep] ?? "source";
  const stateOf = (k: SectionKey): SectionState => {
    const i = ORDER.indexOf(k);
    const a = ORDER.indexOf(active);
    return i < a ? "done" : i === a ? "active" : "upcoming";
  };

  const executeWithdrawal = async (verification: { otpCode?: string; password?: string } = {}) => {
    const sourceConfig = quote.sourceConfig;
    const exchangeRate = quote.exchangeRate;
    if (!exchangeRate || !withdrawData.amount || !sourceConfig) {
      toast.error("Missing withdrawal information");
      return;
    }
    const localAmount = withdrawData.amount;
    const feeData = quote.display;
    if (!paymentAccount) {
      toast.error("No withdrawal account configured");
      return;
    }
    const usdAmountToSend = feeData?.usdcAmount || Math.round((localAmount / exchangeRate) * 1e6) / 1e6;
    const lockError = checkAndSetTransactionLock("withdraw", usdAmountToSend, paymentAccount, currency);
    if (lockError) {
      toast.error(lockError);
      return;
    }
    try {
      const response = await createOrderMutation.mutateAsync({
        token: sourceConfig.token as any,
        amount: usdAmountToSend,
        localAmount,
        currency: currency as any,
        chain: sourceConfig.sdkChain as any,
        recipient: paymentAccount,
        ...verification,
      } as any);
      logEvent("WITHDRAW_COMPLETED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency,
        exchange_rate: exchangeRate,
        fee_local: feeData?.feeLocal || 0,
        fee_percentage: feeData?.feePercentage || 0,
        source: withdrawData.selectedSource,
        chain: sourceConfig.sdkChain,
        token: sourceConfig.token,
      });
      updatePersonProperties({ has_withdrawn: true });
      markAccountDeployed(sourceConfig.chain);
      addPendingWithdrawal({ amount: localAmount, currency, transactionCode: response.order?.transactionCode });
      setReceipt({
        amount: localAmount,
        currency,
        account: account?.label || "",
        reference: response.order?.transactionCode,
        status: response.order?.status || "PENDING",
        at: new Date(),
        totalDeducted: quote.displayedTotal,
        fee: quote.serviceFeeLocal + quote.networkFeeInLocal,
        source: sourceLabel(withdrawData.selectedSource),
      });
      setCurrentStep("success");
    } catch (error: any) {
      logEvent("WITHDRAW_FAILED", {
        amount_usd: usdAmountToSend,
        amount_local: localAmount,
        currency,
        error: error.message || "Unknown error",
        source: withdrawData.selectedSource,
      });
      toast.error(error.message || "Failed to create withdrawal order. Please try again.");
    }
  };

  if (receipt) {
    return (
      <div className="mx-auto w-full max-w-[520px]">
        <ReceiptCard
          title="Withdrawal submitted"
          amount={money(receipt.currency, receipt.amount)}
          status={toAppStatus(receipt.status)}
          date={receipt.at}
          from={receipt.source}
          reference={receipt.reference}
          to={receipt.account}
          lines={[
            { label: "You receive", value: money(receipt.currency, receipt.amount) },
            { label: "Fees", value: money(receipt.currency, receipt.fee) },
            { label: "Total deducted", value: money(receipt.currency, receipt.totalDeducted), strong: true },
            ...(receipt.reference ? [{ label: "Reference", value: <span className="font-mono text-[13px]">{receipt.reference}</span>, text: receipt.reference }] : []),
          ]}
          shareText={`Rift withdrawal: ${money(receipt.currency, receipt.amount)} to ${receipt.account}${receipt.reference ? ` (ref ${receipt.reference})` : ""}`}
        />
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" block onClick={() => navigate("/app/payments")}>
            View payments
          </Button>
          <Button
            block
            onClick={() => {
              setReceipt(null);
              resetWithdraw();
            }}
          >
            New withdrawal
          </Button>
        </div>
      </div>
    );
  }

  if (userLoading && !user) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-3" data-testid="withdraw-flow">
      <FlowSection
        step={1}
        title="Payout account"
        testId="section-account"
        description="Withdrawals go to the account saved in Settings"
        state={stateOf("account")}
        summary={account?.label}
        onEdit={() => setSetupOpen(true)}
      >
        <EmptyState
          title="Add a withdrawal account"
          description="Save the mobile money or bank account you want withdrawals sent to."
          action={
            <Button onClick={() => setSetupOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add withdrawal account
            </Button>
          }
        />
      </FlowSection>

      <FlowSection
        step={2}
        title="Amount"
        testId="section-amount"
        state={stateOf("amount")}
        summary={withdrawData.amount ? money(currency, withdrawData.amount) : undefined}
        onEdit={() => setCurrentStep("amount")}
      >
        <AmountStep
          currency={currency}
          initialAmount={withdrawData.amount}
          label="You receive"
          onContinue={(amount, feeBreakdown, { exchangeRate }) => {
            logEvent("WITHDRAW_INITIATED", {
              amount_local: amount,
              amount_usd: feeBreakdown?.usdcAmount || amount / exchangeRate,
              currency,
              exchange_rate: exchangeRate,
              fee_local: feeBreakdown?.feeLocal || 0,
              fee_percentage: feeBreakdown?.feePercentage || 0,
            });
            updateWithdrawData({ amount, currency, feeBreakdown });
            setCurrentStep("source");
          }}
        />
      </FlowSection>

      <FlowSection
        step={3}
        title="Pay from"
        testId="section-source"
        state={stateOf("source")}
        summary={sourceLabel(withdrawData.selectedSource)}
        onEdit={() => setCurrentStep("source")}
      >
        <OfframpSourceStep
          currency={currency}
          amount={withdrawData.amount || 0}
          feeBreakdown={withdrawData.feeBreakdown}
          value={withdrawData.selectedSource}
          onSelect={(id) => updateWithdrawData({ selectedSource: id, currency })}
          onBack={() => setCurrentStep("amount")}
          onContinue={() => setCurrentStep("confirmation")}
        />
      </FlowSection>

      <FlowSection step={4} title="Review and confirm" testId="section-review" description="Check the details. Withdrawals can't be reversed." state={stateOf("review")}>
        <QuoteRows quote={quote} currency={currency} receiveLabel="You receive" extra={<Row label="To">{account?.label}</Row>} />
        {quote.balanceInsufficient && quote.sourceConfig && (
          <p role="alert" className="mt-3 flex gap-2 text-[13px] text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            Insufficient {quote.sourceConfig.token} on {quote.sourceConfig.chainLabel}. Top up your wallet to continue.
          </p>
        )}
        <SectionActions onBack={() => setCurrentStep("source")}>
          <Button size="lg" onClick={() => executeWithdrawal({})} disabled={quote.isLoading || createOrderMutation.isPending || quote.balanceInsufficient}>
            {createOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-4 w-4" aria-hidden="true" />}
            {quote.balanceInsufficient && quote.sourceConfig
              ? `Insufficient ${quote.sourceConfig.token}`
              : createOrderMutation.isPending
                ? "Waiting for passkey…"
                : `Approve ${money(currency, quote.displayedTotal || withdrawData.amount || 0)} with passkey`}
          </Button>
        </SectionActions>
      </FlowSection>

      <PaymentAccountSetup
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSave={async (pa) => {
          try {
            await updateUser.mutateAsync({ paymentAccount: pa });
            toast.success("Withdrawal account updated");
            resetWithdraw();
          } catch {
            toast.error("Failed to update withdrawal account");
          }
        }}
        currentPaymentAccount={paymentAccount}
      />
    </div>
  );
}

export default function Withdraw() {
  return (
    <WithdrawProvider>
      <Page width="narrow">
        <PageHeader title="Withdraw" description="Move money from your balance to your own mobile money or bank account." />
        <WithdrawFlow />
      </Page>
    </WithdrawProvider>
  );
}
