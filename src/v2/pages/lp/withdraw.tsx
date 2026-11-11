import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAddressValid } from "@/utils/address-verifier";
import { Button, Field, INPUT_CLASS, Segmented, SideSheet } from "@/v2/ui";
import { ChainLogo, Picker } from "@/v2/ui/picker";
import { LP_ASSETS, LP_CHAINS, chainLabel, fmtDate, fmtUsd, lpApi, type LpAsset, type LpMe, type LpPool, type LpSession } from "@/v2/lib/lp";

export function WithdrawSheet({ open, onClose, session, pool, me }: { open: boolean; onClose: () => void; session: LpSession; pool?: LpPool; me: LpMe }) {
  const qc = useQueryClient();
  const amountId = useId();
  const addrId = useId();
  const defaultAddr = session.kind === "wallet" ? session.address : me.provider?.walletAddress ?? "";
  const [amount, setAmount] = useState("");
  const [chain, setChain] = useState<string>("BASE");
  const [asset, setAsset] = useState<LpAsset>("USDC");
  const [to, setTo] = useState(defaultAddr);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setDone(null);
      setError(null);
      setSubmitted(false);
      setAmount("");
    } else setTo((t) => t || defaultAddr);
  }, [open, defaultAddr]);

  const now = Date.now();
  const locked = me.lockSchedule.filter((l) => Date.parse(l.unlocksAt) > now);
  const lockedTotal = locked.reduce((s, l) => s + l.amountUsd, 0);
  const nextUnlock = locked[0];
  const max = Math.max(0, me.withdrawableUsd);
  const amt = Number(amount);

  const amountError = !amount
    ? "Enter an amount"
    : !(amt > 0)
      ? "Amount must be greater than zero"
      : amt > max + 1e-9
        ? max > 0
          ? `You can withdraw up to ${fmtUsd(max)} now. The rest is still locked.`
          : "Nothing is withdrawable yet. Your deposits are still locked."
        : null;
  const addrError = !to ? "Enter the address to send to" : !isAddressValid(to) ? "Enter a valid EVM address (0x followed by 40 hex characters)" : null;
  const valid = !amountError && !addrError;

  const submit = async () => {
    setSubmitted(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await lpApi.withdraw(session, { amountUsd: amt, chain, asset, toAddress: to });
      setDone({ amount: amt });
      qc.invalidateQueries({ queryKey: ["lp", "me"] });
    } catch (e: any) {
      setError(e?.message || "Couldn't request the withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Withdraw" description="Ask for your deposit back once its lock ends." testId="lp-withdraw-sheet">
      {done ? (
        <div className="flex flex-col items-center py-6 text-center" data-testid="lp-withdraw-done">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          <p className="mt-3 text-[16px] font-semibold text-ink">Withdrawal requested</p>
          <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-ink-3">
            {fmtUsd(done.amount)} in {asset} to your address on {chainLabel(chain)}. Rift reviews and sends withdrawals by hand; the status shows under Withdrawals.
          </p>
          <Button className="mt-6" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-surface-subtle px-3 py-2.5">
              <p className="text-[12.5px] text-ink-3">Withdrawable now</p>
              <p className="mt-0.5 text-[17px] font-semibold text-ink tabular-numeric" data-testid="lp-withdraw-max">
                {fmtUsd(max)}
              </p>
            </div>
            <div className="rounded-md bg-surface-subtle px-3 py-2.5">
              <p className="flex items-center gap-1 text-[12.5px] text-ink-3">
                <Lock className="h-3 w-3" aria-hidden="true" /> Locked
              </p>
              <p className="mt-0.5 text-[17px] font-semibold text-ink tabular-numeric">{fmtUsd(lockedTotal)}</p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-3" data-testid="lp-lock-explainer">
            Each deposit is locked for {pool?.lockDays ?? 30} days from when it was credited.
            {nextUnlock ? ` Next: ${fmtUsd(nextUnlock.amountUsd)} unlocks ${fmtDate(nextUnlock.unlocksAt)}.` : ""} Earnings are paid separately each month.
          </p>

          <Field
            label="Amount (USD)"
            htmlFor={amountId}
            error={submitted || (amount && amt > max) ? amountError : null}
            hint={
              max > 0 ? (
                <button type="button" className="cursor-pointer font-medium text-accent-primary hover:underline" onClick={() => setAmount(String(max))}>
                  Withdraw all {fmtUsd(max)}
                </button>
              ) : undefined
            }
          >
            <input
              id={amountId}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              aria-invalid={!!((submitted || amt > max) && amountError)}
              data-testid="lp-withdraw-amount"
              className={cn(INPUT_CLASS, "text-[17px] font-semibold tabular-numeric")}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Network</p>
              <Picker
                value={chain}
                onChange={setChain}
                label="Network"
                testId="lp-withdraw-chain"
                options={LP_CHAINS.filter((c) => !pool || pool.chains.includes(c.id)).map((c) => ({ value: c.id, label: c.label, icon: <ChainLogo chain={c.id} /> }))}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Asset</p>
              <Segmented<LpAsset> label="Asset" value={asset} onChange={setAsset} options={LP_ASSETS.map((a) => ({ value: a, label: a }))} />
            </div>
          </div>
          <Field label="Send to" htmlFor={addrId} error={submitted ? addrError : null} hint="Defaults to your LP wallet. Double-check any other address.">
            <input
              id={addrId}
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!(submitted && addrError)}
              data-testid="lp-withdraw-address"
              className={cn(INPUT_CLASS, "font-mono text-[13.5px]")}
            />
          </Field>
          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" block disabled={busy || max <= 0} data-testid="lp-withdraw-submit">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {max <= 0 ? "Nothing to withdraw yet" : "Request withdrawal"}
          </Button>
        </form>
      )}
    </SideSheet>
  );
}
