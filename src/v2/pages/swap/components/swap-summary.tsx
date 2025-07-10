import useSwapPairPricing from "@/hooks/data/use-swap-pair-pricing";
import { useSwap } from "../swap-context";
import useSwapFee from "@/hooks/data/use-swap-fee";
import useToken from "@/hooks/data/use-token";
import ActionButton from "@/components/ui/action-button";
import useSwapTransaction from "@/hooks/data/use-swap-transaction";
import { toast } from "sonner";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import RenderSuccessToast from "@/components/ui/helpers/render-success-toast";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { usePWAShortcuts } from "@/hooks/use-pwa-shortcuts";
import { useMemo } from "react";

export default function SwapSummary() {
  const swap = useSwap();
  const swapState = swap.state.getValues();
  const swapMutation = useSwapTransaction();
  const { updateRecentActivity } = usePWAShortcuts();

  const fromBalanceQuery = useTokenBalance({
    token: swapState.from_token,
    chain: swapState.from_chain,
  });

  const INSUFFICIENT_FUNDS = useMemo(() => {
    if (fromBalanceQuery.isLoading) return false;
    if (
      (fromBalanceQuery.data?.amount ?? 0) &&
      parseFloat(swapState.amount_in) == 0
    )
      return false;
    return (
      (fromBalanceQuery.data?.amount ?? 0) < parseFloat(swapState.amount_in)
    );
  }, [
    swapState.amount_in,
    swapState.from_token,
    swapState.from_chain,
    fromBalanceQuery.isLoading,
  ]);

  const { SELL_TOKEN_PRICE, BUY_TOKEN_PRICE } = useSwapPairPricing({
    from_chain: swapState.from_chain,
    to_chain: swapState.to_chain,
    from_token: swapState.from_token,
    to_token: swapState.to_token,
  });

  const buySellTokenEquiv = SELL_TOKEN_PRICE / BUY_TOKEN_PRICE;

  const feeQuery = useSwapFee({
    from_chain: swapState.from_chain,
    to_chain: swapState.to_chain,
    from_token: swapState.from_token,
    to_token: swapState.to_token,
  });

  const fromTokenDetailsQuery = useToken({
    chain: swapState.from_chain,
    id: swapState.from_token,
  });

  const toTokenDetailsQuery = useToken({
    chain: swapState.to_chain,
    id: swapState.to_token,
  });

  const handleSwap = async () => {
    swapMutation.mutate(
      {
        from_chain: swapState.from_chain,
        to_chain: swapState.to_chain,
        from_token: swapState.from_token,
        to_token: swapState.to_token,
        amount_in: swapState.amount_in,
      },
      {
        onSuccess(data, variables, context) {
          toast.custom(() => <RenderSuccessToast message="Swap Complete" />, {
            position: "top-center",
            duration: 2000,
          });

          // Update recent activity for PWA shortcuts
          updateRecentActivity({
            id: `swap_${Date.now()}`, // Generate unique ID
            type: "swap",
            amount: `${swapState.amount_in} ${fromTokenDetailsQuery.data?.name} → ${swapState.amount_out} ${toTokenDetailsQuery.data?.name}`,
            token: `${fromTokenDetailsQuery.data?.name}/${toTokenDetailsQuery.data?.name}`,
            timestamp: Date.now(),
            status: "completed",
          });
        },
        onError(error, variables, context) {
          toast.custom(() => <RenderErrorToast message="Swap failed" />, {
            position: "top-center",
            duration: 2000,
          });
        },
      }
    );
  };

  return (
    <div className="w-full flex flex-col gap-y-2 flex-1 items-center justify-between">
      <div className="flex flex-col w-full px-3 py-2 rounded-lg bg-surface-subtle">
        <div className="flex flex-row items-center justify-between w-full px-2 py-2 border-b border-accent">
          <p className="font-semibold">Pricing</p>
          {fromTokenDetailsQuery.isLoading || toTokenDetailsQuery.isLoading ? (
            <LoadingPill />
          ) : (
            <p className="text-muted-foreground font-semibold">
              1 {fromTokenDetailsQuery?.data?.name} &asymp;{" "}
              {buySellTokenEquiv ?? 0} {toTokenDetailsQuery?.data?.name}
            </p>
          )}
        </div>

        <div className="flex flex-row items-center justify-between w-full px-2 py-2 border-b border-accent">
          <p className="font-semibold">Slippage</p>
          <p className="font-semibold text-muted-foreground">
            {/* TODO: slippage might be customizable in the future, will use a dummy value for now */}
            0.3%
          </p>
        </div>

        <div className="flex flex-row items-center justify-between w-full px-2 py-2 border-b border-accent">
          <p className="font-semibold">Fees</p>
          {feeQuery?.isLoading ? (
            <LoadingPill />
          ) : (
            <p className="font-semibold text-muted-foreground">
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumSignificantDigits: 8,
              }).format(feeQuery?.data?.fee ?? 0)}
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-row items-center justify-between">
        <ActionButton
          disabled={
            INSUFFICIENT_FUNDS ||
            swapState.amount_in == "0" ||
            swapState.amount_in == ""
          }
          onClick={handleSwap}
          loading={swapMutation.isPending}
          variant={INSUFFICIENT_FUNDS ? "danger" : "secondary"}
        >
          {INSUFFICIENT_FUNDS ? "Insufficient Funds" : "Swap Now"}
        </ActionButton>
      </div>
    </div>
  );
}

function LoadingPill() {
  return (
    <div className="flex flex-row items-center w-[100px] h-10 rounded-full bg-surface-alt animate-ping"></div>
  );
}
