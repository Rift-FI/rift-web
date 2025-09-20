import { getChains } from "@/lib/assets/chains";
import { getTokens } from "@/lib/assets/tokens";
import { WalletChain, WalletToken } from "@/lib/entities";
import rift from "@/lib/rift";
import { sleep } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

async function resolveToken(id: string, chain: string) {
  const tokens = await getTokens({
    id,
    chain,
  });

  return tokens?.at(0) ?? null;
}

async function resolveChain(id: string) {
  const chain = await getChains(id);

  return chain as WalletChain | null;
}

/**
 * Determines if a token is an ETH variant (native ETH or any wrapped/staked ETH)
 */
function isEthVariant(token: WalletToken): boolean {
  // Native ETH
  if (token.is_native && token.id === "ethereum") {
    return true;
  }

  // ETH variants by token ID
  const ethVariantIds = [
    "weth", // Wrapped ETH
    "rocket-pool-eth", // Rocket Pool ETH (rETH)
    "coinbase-wrapped-staked-eth", // Coinbase Wrapped Staked ETH (cbETH)
    "arbitrum-bridged-wsteth-arbitrum", // Wrapped Staked ETH (wstETH)
  ];

  return ethVariantIds.includes(token.id);
}

interface SwapTransactionArgs {
  from_token: string;
  to_token: string;
  from_chain: string;
  to_chain: string;
  amount_in: string;
}

async function commitSwap(args: SwapTransactionArgs) {
  if (import.meta.env.VITE_TEST == "true") {
    await sleep(1000);
    return;
  }

  const from_token = await resolveToken(args.from_token, args.from_chain);
  const to_token = await resolveToken(args.to_token, args.to_chain);
  const from_chain = await resolveChain(args.from_chain);
  const to_chain = await resolveChain(args.to_chain);

  if (!from_chain || !to_chain || !to_token || !from_token)
    throw new Error("Unable to resolve tokens");

  // Determine if we're dealing with ETH variants
  const isEth = isEthVariant(from_token);
  const isBuyingEth = isEthVariant(to_token);

  const result = await rift.defi.swap({
    // Existing fields - convert chain to lowercase
    chain: from_chain.backend_id!.toLowerCase() as any,
    flow: "gasless",
    token_to_sell: from_token.name as any,
    token_to_buy: to_token.name as any,
    value: args.amount_in,

    // New required fields (using snake_case as expected by API)
    token_to_sell_address: from_token.contract_address,
    token_to_buy_address: to_token.contract_address,
    is_eth: isEth,
    is_buying_eth: isBuyingEth,
  } as any); // Using 'as any' to bypass TypeScript until API types are updated

  return result;
}

export default function useSwapTransaction() {
  const swapTransactionMutation = useMutation({
    mutationFn: commitSwap,
  });

  return swapTransactionMutation;
}
