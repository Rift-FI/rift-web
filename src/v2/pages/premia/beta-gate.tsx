/**
 * "Request beta" — the only thing an unfunded wallet sees.
 *
 * One click runs faucet → approve → deposit. It is three passkey taps,
 * because the wallet signs one {to, data} per signature and prmUSD has no
 * permit — but that is a fact about our plumbing, not something a trader
 * needs previewed, so the steps are no longer listed.
 *
 * THE AMOUNT IS READ FROM THE CONTRACT. `PrmUSD.FAUCET_AMOUNT` is a
 * `constant` with no setter, so this never prints a number from config:
 * whatever the chain is about to mint is what the screen says.
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/v2/ui";
import { usePremia } from "@/v2/lib/premia/store";
import { fmtNum } from "@/v2/lib/premia/format";
import type { MarketSnapshot } from "@/v2/lib/premia/types";
import { cleanErr } from "./components";

export function BetaGate({ snap, compact }: { snap?: MarketSnapshot; compact?: boolean }) {
  const { portfolio, requestBeta, busy, step, signedIn, loading } = usePremia();
  const [error, setError] = useState<string | null>(null);

  const grant = portfolio.faucetAmount ?? 0;
  const readyAt = portfolio.faucetReadyAt ?? 0;
  const onCooldown = readyAt > 0 && readyAt * 1000 > Date.now();
  const wallet = portfolio.walletPrmUSD ?? 0;
  /** Already holds tokens — only the vault leg is left. */
  const fundOnly = wallet > 0;

  const go = async () => {
    setError(null);
    try {
      await requestBeta();
      toast.success("Ready to trade");
    } catch (e) {
      const msg = cleanErr(e);
      setError(msg);
      toast.error("Couldn't start your beta", { description: msg });
    }
  };

  return (
    <div className={cn("rounded-xl border border-hairline bg-card p-4", compact && "p-3.5")} data-testid="premia-beta-gate">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
        {fundOnly ? "In your wallet" : "Beta grant"}
      </p>
      <p className="mt-0.5 text-[24px] font-semibold leading-none text-ink tabular-numeric" data-testid="premia-grant-amount">
        {loading ? "—" : fmtNum(fundOnly ? wallet : grant, 0)}
        <span className="ml-1.5 text-[13px] font-medium text-ink-3">prmUSD</span>
      </p>

      <Button
        block
        size="lg"
        className="mt-3"
        onClick={go}
        disabled={busy || !signedIn || (onCooldown && !fundOnly) || loading}
        data-testid="premia-request-beta"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {step ?? "Working…"}
          </>
        ) : !signedIn ? (
          "Sign in"
        ) : onCooldown && !fundOnly ? (
          "Already claimed"
        ) : fundOnly ? (
          "Fund balance"
        ) : (
          "Request beta"
        )}
      </Button>

      {/* money-relevant: why you can't claim, and when you can */}
      {onCooldown && !fundOnly && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
          Next grant {new Date(readyAt * 1000).toLocaleString()}.
        </p>
      )}
      {error && <p className="mt-2 text-[12px] leading-relaxed text-danger">{error}</p>}
      {snap?.blockedReason && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-warning">{snap.blockedReason}</p>
      )}
    </div>
  );
}
