import { useMemo, useState } from "react";
import { isDeviceBlock } from "@/lib/device";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Fingerprint, Loader2, Pencil, XCircle } from "lucide-react";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import { useTransactionFee } from "@/hooks/data/use-transaction-fee";
import useSendTranaction from "@/hooks/wallet/use-send-transaction";
import useAccountDeployed, { markAccountDeployed } from "@/hooks/wallet/use-account-deployed";
import useAnalytics from "@/hooks/use-analytics";
import { toAppStatus } from "@/v2/lib/status";
import { isAddressValid } from "@/utils/address-verifier";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { explorerTxUrl } from "@/v2/lib/payments";
import { Button, Card, CardHeader, Field, INPUT_CLASS, Row, Rows, shortHash } from "@/v2/ui";
import { SmartSourcePicker, sourceKey, useSources } from "./source-picker";
import { ReceiptCard } from "@/v2/ui/receipt";
import { SaveBeneficiaryOffer, SavedBeneficiaries } from "./saved";

type Token = "USDC" | "USDT";

/** Networks a wallet transfer can go out on, keyed by backend id. */
const NETWORKS: { id: string; label: string; chainId: string }[] = [
  { id: "BASE", label: "Base", chainId: "8453" },
  { id: "POLYGON", label: "Polygon", chainId: "137" },
  { id: "ARBITRUM", label: "Arbitrum", chainId: "42161" },
  { id: "CELO", label: "Celo", chainId: "42220" },
  { id: "ETHEREUM", label: "Ethereum", chainId: "1" },
];

// Same rules as the previous send screen: keep 1% headroom for gas +
// rounding, and a $3 minimum on the first transfer from a chain (it
// pays for the smart-account deployment).
const MAX_SEND_FRACTION = 0.99;
const MIN_FIRST_SEND_USD = 3;
const maxSendable = (balance: number) => (balance > 0 ? Math.floor(balance * MAX_SEND_FRACTION * 1_000_000) / 1_000_000 : 0);

type Stage = "form" | "review" | "processing" | "done" | "failed";

const fmt = (n: number | string, token: string) =>
  `${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${token}`;

export default function SendWallet() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { data: balance } = useAggregateBalance({ currency: "USD" });
  const { sources, isLoading: sourcesLoading, refetch: refetchSources } = useSources("USD");
  const { sendTransactionMutation } = useSendTranaction();

  const [stage, setStage] = useState<Stage>("form");
  const [recipient, setRecipient] = useState("");
  const [savedId, setSavedId] = useState<string | undefined>();
  const [token, setToken] = useState<Token>("USDC");
  const [network, setNetwork] = useState("BASE");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState({ recipient: false, amount: false });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ hash: string; at: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const net = NETWORKS.find((n) => n.id === network) ?? NETWORKS[0];
  const available = useMemo(
    () => balance?.breakdown.find((b) => b.token === token && b.chain === network)?.amount ?? 0,
    [balance, token, network]
  );
  const max = maxSendable(available);
  const largestMax = maxSendable(sources.filter((x) => NETWORKS.some((n) => n.id === x.chain))[0]?.balance ?? 0);
  const { isDeployed } = useAccountDeployed(net.chainId);
  const needsFirstMin = isDeployed !== true;

  const amountNum = Number(amount);
  const recipientError = !recipient
    ? "Enter the recipient's wallet address"
    : !isAddressValid(recipient)
      ? "Enter a valid EVM address: 0x followed by 40 hex characters (mixed case must match its checksum)"
      : null;
  const amountError = !amount
    ? "Enter an amount"
    : !(amountNum > 0)
      ? "Amount must be greater than zero"
      : amountNum > max + 1e-9
        ? `Not enough ${token} on ${net.label}. Pick another balance below.`
        : needsFirstMin && amountNum < MIN_FIRST_SEND_USD
          ? `Your first transfer on ${net.label} must be at least ${MIN_FIRST_SEND_USD} ${token} (it activates your account there)`
          : null;
  const valid = !recipientError && !amountError;

  const feeArgs = valid && stage !== "form" ? { recipient, amount, chain: network, token } : null;
  const feeQuery = useTransactionFee(feeArgs, !!feeArgs);
  const fee = feeQuery.data ?? null;
  const insufficient = fee?.sufficient === false;
  const total = fee ? Number(fee.totalNeeded) : amountNum;

  const showRecipientError = (touched.recipient || submitted) && recipientError;
  // "Not enough on this balance" is shown by the Pay-from picker (with the
  // move-first fix), so the field itself doesn't repeat it.
  const notEnoughHere = amountNum > max + 1e-9;
  const fieldError = notEnoughHere && amountError?.startsWith("Not enough") ? null : amountError;
  const showAmountError = (touched.amount || submitted) && amount !== "" ? fieldError : submitted ? fieldError : null;

  const toReview = () => {
    setSubmitted(true);
    if (!valid) return;
    setStage("review");
  };

  const approve = async () => {
    const lockError = checkAndSetTransactionLock("send", amountNum, recipient, token);
    if (lockError) {
      toast.error(lockError);
      return;
    }
    setStage("processing");
    setError(null);
    try {
      const res = await sendTransactionMutation.mutateAsync({ token, chain: network, recipient, amount });
      logEvent("SEND_COMPLETED", { method: "address" });
      markAccountDeployed(net.chainId);
      setResult({ hash: res.hash, at: new Date(res.timestamp || Date.now()) });
      setStage("done");
    } catch (err: any) {
      logEvent("SEND_FAILED", { method: "address" });
      if (!isDeviceBlock(err)) setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "We couldn't process this transfer.");
      setStage("failed");
    }
  };

  const reset = () => {
    setStage("form");
    setRecipient("");
    setSavedId(undefined);
    setAmount("");
    setTouched({ recipient: false, amount: false });
    setSubmitted(false);
    setResult(null);
    setError(null);
  };

  /* ── Receipt ─────────────────────────────────────────────────────── */
  if (stage === "done" && result) {
    const from = localStorage.getItem("address") || "";
    return (
      <div className="mx-auto w-full max-w-[520px]">
        <ReceiptCard
          title="Transfer sent"
          amount={fmt(amount, token)}
          date={result.at}
          from={<span className="font-mono text-[12.5px]">{shortHash(from, 6, 4) || "Your account"}</span>}
          fromText={from || "Your account"}
          toText={recipient}
          reference={result.hash}
          to={<span className="font-mono text-[12.5px]">{shortHash(recipient, 6, 4)}</span>}
          lines={[
            { label: "Network", value: net.label },
            ...(fee ? [{ label: "Network fee", value: fmt(fee.gasFeeInToken, token) }] : []),
            { label: "Total", value: fmt(total, token), strong: true },
            {
              label: "Transaction",
              value: result.hash ? (
                <a href={explorerTxUrl(result.hash, network)} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] text-accent-primary hover:underline">
                  {shortHash(result.hash, 8, 6)}
                </a>
              ) : (
                "Submitted"
              ),
              text: result.hash || "Submitted",
            },
          ]}
          shareText={`Rift transfer: ${fmt(amount, token)} on ${net.label} to ${recipient}${result.hash ? `\nTx: ${explorerTxUrl(result.hash, network)}` : ""}`}
        />
        <SaveBeneficiaryOffer
          alreadySavedId={savedId}
          draft={{ label: shortHash(recipient, 6, 4), type: "wallet", identifier: recipient, network }}
        />
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" block onClick={() => navigate("/app/payments")}>
            View payments
          </Button>
          <Button block onClick={reset}>
            New transfer
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "processing") {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center" aria-live="polite">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-accent-primary">
          <Fingerprint className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-[16px] font-semibold text-ink">Confirm with your passkey</p>
        <p className="mt-1 max-w-sm text-[13.5px] text-ink-3">
          Use Face ID, Touch ID or your device PIN to approve {fmt(amount, token)} to {shortHash(recipient)}.
        </p>
        <Loader2 className="mt-5 h-5 w-5 animate-spin text-ink-3" aria-label="Sending" />
      </Card>
    );
  }

  if (stage === "failed") {
    return (
      <Card className="flex flex-col items-center px-6 py-12 text-center" role="alert">
        <XCircle className="h-10 w-10 text-danger" aria-hidden="true" />
        <p className="mt-3 text-[16px] font-semibold text-ink">Transfer not sent</p>
        <p className="mt-1 max-w-sm text-[13.5px] text-ink-3">{error}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={() => setStage("form")}>
            Edit details
          </Button>
          <Button onClick={approve}>Try again</Button>
        </div>
      </Card>
    );
  }

  const reviewing = stage === "review";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {/* 1. Recipient */}
        <Card>
          <CardHeader step={1} title="Recipient" action={reviewing && <EditButton onClick={() => setStage("form")} />} />
          <div className="p-5">
            {reviewing ? (
              <p className="break-all font-mono text-[13.5px] text-ink">{recipient}</p>
            ) : (
              <>
              <SavedBeneficiaries
                types={["wallet"]}
                selectedId={savedId}
                onPick={(b) => {
                  setRecipient(b.identifier);
                  setSavedId(b.id);
                  const n = String(b.network ?? "").toUpperCase();
                  if (NETWORKS.some((x) => x.id === n)) setNetwork(n);
                }}
              />
              <Field label="Wallet address" htmlFor="send-recipient" error={showRecipientError || undefined} hint="">
                <input
                  id="send-recipient"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value.trim());
                    setSavedId(undefined);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, recipient: true }))}
                  aria-invalid={!!showRecipientError}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="0x…"
                  className={`${INPUT_CLASS} font-mono text-[14px]`}
                />
              </Field>
              </>
            )}
          </div>
        </Card>

        {/* 2. Amount */}
        <Card>
          <CardHeader step={2} title="Amount" action={reviewing && <EditButton onClick={() => setStage("form")} />} />
          <div className="space-y-4 p-5">
            {reviewing ? (
              <p className="text-[15px] font-semibold text-ink tabular-numeric">
                {fmt(amount, token)} <span className="font-normal text-ink-3">on {net.label}</span>
              </p>
            ) : (
              <>
                <Field label="Amount" htmlFor="send-amount" error={showAmountError || undefined}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ink-3">$</span>
                    <input
                      id="send-amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
                      onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                      aria-invalid={!!showAmountError}
                      placeholder="0.00"
                      className={`${INPUT_CLASS} pl-8 pr-16 text-[17px] font-semibold tabular-numeric`}
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(largestMax ? String(largestMax) : "")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-semibold text-accent-primary hover:bg-teal-50 cursor-pointer"
                    >
                      Max
                    </button>
                  </div>
                </Field>
                <div>
                  <p className="mb-2 text-[13px] font-medium text-ink-2">Pay from</p>
                  <SmartSourcePicker
                    needed={amountNum > 0 ? amountNum / MAX_SEND_FRACTION : 0}
                    value={sourceKey(network, token)}
                    onChange={(key) => {
                      const [c, t] = key.split(":");
                      setNetwork(c);
                      setToken(t as Token);
                    }}
                    allowed={(src) => !!NETWORKS.find((n) => n.id === src.chain)}
                    sources={sources}
                    isLoading={sourcesLoading}
                    onRefresh={() => refetchSources()}
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {!reviewing && (
          <div className="flex justify-end">
            <Button size="lg" onClick={toReview} className="w-full sm:w-auto">
              Review transfer
            </Button>
          </div>
        )}
      </div>

      {/* 3. Summary / review */}
      <Card className="lg:sticky lg:top-6" aria-label="Summary">
        <CardHeader step={3} title={reviewing ? "Review and confirm" : "Summary"} />
        <div className="px-5 py-2">
          <Rows>
            <Row label="Recipient gets">{amountNum > 0 ? fmt(amountNum, token) : "—"}</Row>
            <Row label="Network fee">
              {!reviewing ? (
                <span className="text-ink-3">Calculated at review</span>
              ) : feeQuery.isLoading ? (
                <Loader2 className="ml-auto h-4 w-4 animate-spin text-ink-3" aria-label="Calculating fee" />
              ) : fee ? (
                `${fmt(fee.gasFeeInToken, token)}${fee.degraded ? " (approx.)" : ""}`
              ) : (
                <span className="text-ink-3">Unavailable</span>
              )}
            </Row>
            <Row label="Total" strong>
              {amountNum > 0 ? fmt(total, token) : "—"}
            </Row>
          </Rows>
        </div>
        {reviewing && (
          <div className="space-y-3 border-t border-hairline p-5">
            {insufficient && (
              <p role="alert" className="flex gap-2 text-[13px] text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                You need {fmt(fee!.deficit, token)} more on {net.label} to cover the network fee.
              </p>
            )}
            <Button size="lg" block onClick={approve} disabled={insufficient || feeQuery.isLoading}>
              <Fingerprint className="h-4 w-4" aria-hidden="true" />
              Approve with passkey
            </Button>
            <p className="text-center text-[12px] text-ink-3">On-chain transfers can&rsquo;t be reversed. Check the address.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      Edit
    </Button>
  );
}
