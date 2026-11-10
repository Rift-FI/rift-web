import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import useToken from "@/hooks/data/use-token";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { useSwap } from "../swap-context";
import ActionButton from "@/components/ui/action-button";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import { formatFloatNumber } from "@/lib/utils";
import useLifiTransfer, { SUPPORTED_CHAINS, STABLECOIN_ADDRESSES } from "@/hooks/data/use-lifi-transfer";
import useLifiTransaction from "@/hooks/data/use-lifi-transaction";
import useAnalytics from "@/hooks/use-analytics";

// Helper function to get token type from token ID
function getTokenType(tokenId: string): "USDC" | "USDT" | "USDC.e" | null {
  if (tokenId === "usd-coin") return "USDC";
  if (tokenId === "tether") return "USDT";
  if (tokenId === "bob-network-bridged-usdce-bob-network") return "USDC.e";
  return null;
}

export default function SwapSummary() {
  const swap = useSwap();
  const swapState = swap.state.getValues();
  const { executeTransaction, isExecuting } = useLifiTransaction();
  const { logEvent } = useAnalytics();

  const { transferQuoteMutation, transferQuotePending, transferQuoteData } = useLifiTransfer();

  useEffect(() => {
    const address = localStorage.getItem("address");
    if (!address || !swapState.amount_in || parseFloat(swapState.amount_in) === 0) {
      swap.state.setValue("amount_out", "0");
      return;
    }
    
    // Get token addresses for the selected chains
    const fromChainName = Object.keys(SUPPORTED_CHAINS).find(key => SUPPORTED_CHAINS[key as keyof typeof SUPPORTED_CHAINS] === swapState.from_chain) as keyof typeof SUPPORTED_CHAINS | undefined;
    const toChainName = Object.keys(SUPPORTED_CHAINS).find(key => SUPPORTED_CHAINS[key as keyof typeof SUPPORTED_CHAINS] === swapState.to_chain) as keyof typeof SUPPORTED_CHAINS | undefined;
    
    if (!fromChainName || !toChainName) {
      return;
    }
    
    // Get the actual token types from the user's selection
    const fromTokenType = getTokenType(swapState.from_token);
    const toTokenType = getTokenType(swapState.to_token);
    
    if (!fromTokenType || !toTokenType) {
      return;
    }
    
    // Get the correct contract addresses based on user's actual selection
    const fromChainAddresses = STABLECOIN_ADDRESSES[fromChainName];
    const toChainAddresses = STABLECOIN_ADDRESSES[toChainName];
    const fromTokenAddress = fromChainAddresses?.[fromTokenType as keyof typeof fromChainAddresses];
    const toTokenAddress = toChainAddresses?.[toTokenType as keyof typeof toChainAddresses];
    
    if (!fromTokenAddress || !toTokenAddress) {
      return;
    }
    
    transferQuoteMutation({
      from_chain: swapState.from_chain,
      to_chain: swapState.to_chain,
      from_token: fromTokenAddress,
      to_token: toTokenAddress,
      amount: swapState.amount_in,
      from_address: address,
      to_address: address,
      from_amount: swapState.amount_in,
      order: "FASTEST",
    });
  }, [swapState.from_chain, swapState.to_chain, swapState.from_token, swapState.to_token, swapState.amount_in, swap.state, transferQuoteMutation]);

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
  }, [swapState.amount_in, fromBalanceQuery.isLoading, fromBalanceQuery.data]);

  const exchangeRate = useMemo(() => {
    if (!transferQuoteData?.transfer) return 0;
    const fromAmount = parseFloat(transferQuoteData.transfer.from.amountFormatted);
    const toAmount = parseFloat(transferQuoteData.transfer.to.amountFormatted);
    
    if (toAmount > 0) {
      swap.state.setValue("amount_out", toAmount.toString());
    }
    
    return fromAmount > 0 ? toAmount / fromAmount : 0;
  }, [transferQuoteData, swap.state]);

  const fromTokenDetailsQuery = useToken({
    chain: swapState.from_chain,
    id: swapState.from_token,
  });

  const toTokenDetailsQuery = useToken({
    chain: swapState.to_chain,
    id: swapState.to_token,
  });

  const handleTransfer = async () => {
    if (!transferQuoteData?.transaction) {
      toast.custom(() => <RenderErrorToast message="No transfer quote available" />, {
        position: "top-center",
        duration: 2000,
      });
      return;
    }

    const address = localStorage.getItem("address");
    if (!address) {
      toast.custom(() => <RenderErrorToast message="No wallet address found" />, {
        position: "top-center",
        duration: 2000,
      });
      return;
    }

    // Get token addresses for approval
    const fromChainName = Object.keys(SUPPORTED_CHAINS).find(key => SUPPORTED_CHAINS[key as keyof typeof SUPPORTED_CHAINS] === swapState.from_chain) as keyof typeof SUPPORTED_CHAINS | undefined;
    const fromTokenType = getTokenType(swapState.from_token);
    const fromChainAddresses = fromChainName ? STABLECOIN_ADDRESSES[fromChainName] : undefined;
    const fromTokenAddress = fromChainAddresses && fromTokenType ? fromChainAddresses[fromTokenType as keyof typeof fromChainAddresses] : undefined;
    
    // Get approval address from the LiFi response
    const approvalAddress = (transferQuoteData.rawData as { estimate?: { approvalAddress?: string } })?.estimate?.approvalAddress;
    
    logEvent("SWAP_INITIATED", {
      from_token: swapState.from_token,
      to_token: swapState.to_token,
      from_chain: swapState.from_chain,
      to_chain: swapState.to_chain,
      amount: swapState.amount_in,
    });

    executeTransaction({
      transaction: transferQuoteData.transaction,
      fromAddress: address,
      approvalAddress: approvalAddress,
      tokenAddress: fromTokenAddress,
      amount: swapState.amount_in,
    });
  };
  

  return (
    <div className="w-full flex flex-col gap-y-2 flex-1 items-center justify-between">
      <div className="flex flex-col w-full px-3 py-2 rounded-lg bg-surface-subtle">
        <div className="flex flex-row items-center justify-between w-full px-2 py-2 border-b border-accent">
          <p className="font-medium">Exchange Rate</p>
          {transferQuotePending ? (
            <LoadingPill />
          ) : (
            <p className="text-muted-foreground font-medium">
              1 {fromTokenDetailsQuery?.data?.name} &asymp;{" "}
              {formatFloatNumber(exchangeRate)}{" "}
              {toTokenDetailsQuery?.data?.name}
            </p>
          )}
        </div>

        <div className="flex flex-row items-center justify-between w-full px-2 py-2 border-b border-accent">
          <p className="font-medium">Slippage</p>
          <p className="font-medium text-muted-foreground">0.3%</p>
        </div>

        <div className="flex flex-row items-center justify-between w-full px-2 py-2 border-b border-accent">
          <p className="font-medium">Fees</p>
          {transferQuotePending ? (
            <LoadingPill />
          ) : (
            <p className="font-medium text-muted-foreground">
              {transferQuoteData?.transfer?.fees?.totalUSD 
                ? `$${transferQuoteData.transfer.fees.totalUSD.toFixed(4)}`
                : "$0.00"
              }
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-row items-center justify-between">
        <ActionButton
          disabled={
            INSUFFICIENT_FUNDS ||
            swapState.amount_in == "0" ||
            swapState.amount_in == "" ||
            !transferQuoteData?.transaction
          }
          onClick={handleTransfer}
          loading={isExecuting}
          variant={INSUFFICIENT_FUNDS ? "danger" : "secondary"}
          className="p-[0.625rem]"
        >
          {INSUFFICIENT_FUNDS ? "Insufficient Funds" : "Transfer Now"}
        </ActionButton>
      </div>
    </div>
  );
}

function LoadingPill() {
  return (
    <div className="flex flex-row items-center w-[50px] md:w-[100px] h-10 rounded-full bg-surface-alt animate-ping"></div>
  );
}
