import { useEffect, useId, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Fingerprint, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import { commitTransaction } from "@/hooks/wallet/use-send-transaction";
import { checkAndSetTransactionLock } from "@/utils/transaction-lock";
import { Button, CopyButton, Field, INPUT_CLASS, Segmented, SideSheet, shortHash } from "@/v2/ui";
import { ChainLogo, Picker } from "@/v2/ui/picker";
import {
  LP_ASSETS,
  LP_CHAINS,
  LP_DEPOSIT_ADDRESS,
  chainLabel,
  fmtDate,
  fmtUsd,
  isTxHash,
  lpApi,
  type LpAsset,
  type LpDeposit,
  type LpMe,
  type LpPool,
  type LpSession,
} from "@/v2/lib/lp";

type Stage = "address" | "hash" | "rift" | "sending" | "done";

function riftAddress(me: LpMe) {
  try {
    return me.provider?.walletAddress || localStorage.getItem("address") || "";
  } catch {
    return me.provider?.walletAddress || "";
  }
}

/** Pay from the Rift balance with the usual two-phase passkey send. */
function RiftWalletDeposit({ chain, asset, onSent, onBack }: { chain: string; asset: LpAsset; onSent: (hash: string) => void; onBack: () => void }) {
  const amountId = useId();
  const { data: balance } = useAggregateBalance({ currency: "USD" });
  const available = balance?.breakdown.find((b) => b.token === asset && b.chain === chain)?.amount ?? 0;
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amt = Number(amount);
  const max = Math.floor(available * 0.99 * 1e6) / 1e6; // gas + rounding headroom, as in Send
  const amountError = amount && !(amt > 0) ? "Enter an amount" : amt > max + 1e-9 ? `You have ${max.toLocaleString()} ${asset} on ${chainLabel(chain)}` : null;

  const send = async () => {
    if (!(amt > 0) || amountError) return;
    const lock = checkAndSetTransactionLock("send", amt, LP_DEPOSIT_ADDRESS, asset);
    if (lock) {
      setError(lock);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await commitTransaction({ chain, token: asset, recipient: LP_DEPOSIT_ADDRESS, amount: String(amt) });
      onSent(res.hash);
    } catch (e: any) {
      setError(e?.message || "The transfer didn't go through.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="lp-rift-deposit">
      <Field
        label={`Amount (${asset})`}
        htmlFor={amountId}
        error={amountError}
        hint={
          <>
            Available on {chainLabel(chain)}: {available.toLocaleString(undefined, { maximumFractionDigits: 2 })} {asset}
            {max > 0 && (
              <>
                {" · "}
                <button type="button" className="cursor-pointer font-medium text-accent-primary hover:underline" onClick={() => setAmount(String(max))}>
                  Use max
                </button>
              </>
            )}
          </>
        }
      >
        <input
          id={amountId}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          aria-invalid={!!amountError}
          data-testid="lp-rift-amount"
          className={cn(INPUT_CLASS, "text-[17px] font-semibold tabular-numeric")}
        />
      </Field>
      <p className="text-[13px] text-ink-3">
        Sends to the pool address <span className="font-mono">{shortHash(LP_DEPOSIT_ADDRESS, 6, 4)}</span>. You{"’"}ll confirm with your passkey, then we register the
        deposit for you.
      </p>
      {error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button onClick={send} disabled={busy || !(amt > 0) || !!amountError} data-testid="lp-rift-send">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Confirm with your passkey…" : `Deposit ${amt > 0 ? amt.toLocaleString() : ""} ${asset}`}
        </Button>
      </div>
    </div>
  );
}

function DoneState({ deposit, onClose }: { deposit: LpDeposit; onClose: () => void }) {
  const copy =
    deposit.status === "credited"
      ? `Credited${deposit.amountUsd !== null ? ` ${fmtUsd(deposit.amountUsd)}` : ""}. Locked until ${fmtDate(deposit.lockedUntil)}.`
      : deposit.status === "held_terms"
        ? "Received. It's credited as soon as you accept the current LP Terms."
        : deposit.status === "rejected"
          ? "This transfer couldn't be matched to your wallet. Contact support with the transaction hash."
          : "We're confirming it on-chain. It shows under Deposits and is credited once confirmed.";
  return (
    <div className="flex flex-col items-center py-6 text-center" data-testid="lp-crypto-done" data-status={deposit.status}>
      {deposit.status === "rejected" ? (
        <AlertTriangle className="h-10 w-10 text-danger" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
      )}
      <p className="mt-3 text-[16px] font-semibold text-ink">{deposit.status === "rejected" ? "Deposit not matched" : "Deposit submitted"}</p>
      <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-ink-3">{copy}</p>
      <Button className="mt-6" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

export function CryptoDepositSheet({ open, onClose, session, pool, me }: { open: boolean; onClose: () => void; session: LpSession; pool?: LpPool; me: LpMe }) {
  const qc = useQueryClient();
  const hashId = useId();
  const chains = LP_CHAINS.filter((c) => !pool || pool.chains.includes(c.id));
  const [chain, setChain] = useState<string>("BASE");
  const [asset, setAsset] = useState<LpAsset>("USDC");
  const [stage, setStage] = useState<Stage>("address");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LpDeposit | null>(null);
  const address = pool?.depositAddress || LP_DEPOSIT_ADDRESS;
  const from = session.kind === "wallet" ? session.address : riftAddress(me);

  useEffect(() => {
    if (!open) {
      setStage("address");
      setHash("");
      setError(null);
      setResult(null);
      setBusy(false);
    }
  }, [open]);

  const submit = async (txHash: string) => {
    setBusy(true);
    setError(null);
    try {
      const dep = await lpApi.depositCrypto(session, { chain, txHash: txHash.trim() });
      setResult(dep);
      setStage("done");
      qc.invalidateQueries({ queryKey: ["lp", "me"] });
    } catch (e: any) {
      setError(e?.message || "Couldn't register this deposit.");
      // A Rift-wallet send already happened: let them retry with the hash.
      if (stage !== "hash") {
        setHash(txHash);
        setStage("hash");
      }
    } finally {
      setBusy(false);
    }
  };

  const hashError = hash && !isTxHash(hash) ? "A transaction hash is 0x followed by 64 hex characters." : null;

  return (
    <SideSheet open={open} onClose={onClose} title="Deposit crypto" description={`USDC or USDT, locked ${pool?.lockDays ?? 30} days once credited.`} testId="lp-crypto-sheet">
      {stage === "done" && result ? (
        <DoneState deposit={result} onClose={onClose} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Network</p>
              <Picker
                value={chain}
                onChange={setChain}
                label="Network"
                testId="lp-chain"
                disabled={stage === "sending"}
                options={chains.map((c) => ({ value: c.id, label: c.label, icon: <ChainLogo chain={c.id} /> }))}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Asset</p>
              <Segmented<LpAsset> label="Asset" value={asset} onChange={setAsset} options={LP_ASSETS.map((a) => ({ value: a, label: a, testId: `lp-asset-${a}` }))} />
            </div>
          </div>

          {stage === "rift" || stage === "sending" ? (
            <RiftWalletDeposit
              chain={chain}
              asset={asset}
              onBack={() => setStage("address")}
              onSent={(h) => {
                setStage("sending");
                submit(h);
              }}
            />
          ) : (
            <>
              <div className="rounded-lg border border-hairline p-4" data-testid="lp-deposit-address">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="rounded-md bg-[#ffffff] p-2 ring-1 ring-hairline">
                    <QRCodeSVG value={address} size={132} level="M" bgColor="#ffffff" fgColor="#10181a" aria-label="QR code of the deposit address" role="img" />
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="text-[12.5px] font-medium text-ink-3">
                      Send {asset} on {chainLabel(chain)} to
                    </p>
                    <div className="mt-1 flex items-start justify-center gap-1 sm:justify-start">
                      <code className="break-all font-mono text-[13.5px] leading-snug text-ink" data-testid="lp-address-text">
                        {address}
                      </code>
                      <CopyButton value={address} label="Copy deposit address" />
                    </div>
                    <p className="mt-2 text-[12.5px] text-ink-3">Same address on Base, Ethereum, Polygon and Arbitrum.</p>
                  </div>
                </div>
              </div>

              <div role="note" className="flex gap-3 rounded-md bg-tint-pending px-3.5 py-3 text-[13px] leading-relaxed text-pending" data-testid="lp-sender-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>
                  Send only from {session.kind === "wallet" ? "your connected wallet" : "your Rift wallet"}
                  {from ? (
                    <>
                      {" "}
                      <span className="font-mono">{shortHash(from, 6, 4)}</span>
                    </>
                  ) : null}
                  . Transfers from any other address aren{"’"}t credited to you. Send only {asset} on {chainLabel(chain)}; other tokens can be lost.
                </p>
              </div>

              {stage === "address" && (
                <div className="flex flex-col gap-2">
                  {session.kind === "rift" && (
                    <Button size="lg" block onClick={() => setStage("rift")} data-testid="lp-from-rift">
                      <Fingerprint className="h-4 w-4" aria-hidden="true" />
                      Deposit from my Rift wallet
                    </Button>
                  )}
                  <Button size="lg" block variant={session.kind === "rift" ? "secondary" : "primary"} onClick={() => setStage("hash")} data-testid="lp-sent-it">
                    I{"’"}ve sent it
                  </Button>
                </div>
              )}

              {stage === "hash" && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isTxHash(hash)) submit(hash);
                  }}
                >
                  <Field label="Transaction hash" htmlFor={hashId} error={hashError} hint={`From your wallet or a ${chainLabel(chain)} block explorer.`}>
                    <input
                      id={hashId}
                      value={hash}
                      onChange={(e) => setHash(e.target.value.trim())}
                      placeholder="0x…"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={!!hashError}
                      data-testid="lp-tx-hash"
                      className={cn(INPUT_CLASS, "font-mono text-[13.5px]")}
                    />
                  </Field>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button variant="ghost" onClick={() => setStage("address")}>
                      Back
                    </Button>
                    <Button type="submit" disabled={busy || !isTxHash(hash)} data-testid="lp-submit-hash">
                      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      Submit deposit
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
          {stage === "sending" && busy && (
            <p role="status" className="text-[13px] text-ink-2">
              Sent. Registering your deposit…
            </p>
          )}
          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger" data-testid="lp-crypto-error">
              {error}
            </p>
          )}
        </div>
      )}
    </SideSheet>
  );
}
