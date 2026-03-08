import { getChains } from "@/lib/assets/chains";
import { getTokens } from "@/lib/assets/tokens";
import { Balance, WalletChain } from "@/lib/entities";
import rift from "@/lib/rift";
import { useQuery } from "@tanstack/react-query";

interface TokenBalanceArgs {
  chain?: string;
  token: string;
  /** Token name for SDK call (e.g. "USDC"). If provided, skips local token lookup. */
  tokenName?: string;
  /** Backend ID (e.g. "ETHEREUM-USDC"). Used as fallback to extract token name. */
  backendId?: string;
}

const ZERO_BALANCE: Balance = { amount: 0, chain: "1", token: "", usd: 0 };

async function getTokenBalance(args: TokenBalanceArgs): Promise<Balance> {
  const chain = (await getChains(args.chain)) as WalletChain | null;
  if (!chain) return ZERO_BALANCE;

  let tokenName = args.tokenName;

  // If tokenName not provided directly, look up from local definitions
  if (!tokenName) {
    const token = (
      await getTokens({
        id: args.token,
        chain: args.chain,
      })
    )?.at(0);

    if (token?.backend_id) {
      tokenName = token.name;
    } else if (args.backendId) {
      // No local definition — extract token name from backend_id (e.g. "ETHEREUM-USDC" -> "USDC")
      tokenName = args.backendId.split("-").slice(1).join("-");
    } else {
      return ZERO_BALANCE;
    }
  }

  const balanceResponse = await rift.wallet.getTokenBalance({
    token: tokenName as any,
    chain: chain.backend_id as any,
  });

  return balanceResponse?.data?.at(0) ?? ZERO_BALANCE;
}

export default function useTokenBalance(args: TokenBalanceArgs) {
  const query = useQuery({
    queryKey: ["token-balance", args.token, args.chain, args.backendId],
    queryFn: async () => {
      return getTokenBalance(args);
    },
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  return query;
}
