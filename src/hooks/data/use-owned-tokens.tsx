import { getTokens } from "@/lib/assets/tokens";
import { WalletToken } from "@/lib/entities";
import rift from "@/lib/rift";
import { useQuery } from "@tanstack/react-query";

interface Args {
  is_swappable?: boolean;
  withdrawable_only?: boolean;
}

// Withdrawable chain IDs and tokens
const WITHDRAWABLE_CHAINS: Record<string, string> = {
  "8453": "BASE",       // Base
  "1": "ETHEREUM",      // Ethereum
  "137": "POLYGON",     // Polygon
  "42220": "CELO",      // Celo
  "42161": "ARBITRUM",  // Arbitrum
  "1135": "LISK",       // Lisk
};
const WITHDRAWABLE_TOKENS = ["USDC", "USDT"];

// Default icons by token name for SDK tokens without local definitions
const TOKEN_ICONS: Record<string, string> = {
  USDC: "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png",
  ETH: "https://coin-images.coingecko.com/coins/images/279/small/ethereum.png",
  DAI: "https://coin-images.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  WBTC: "https://coin-images.coingecko.com/coins/images/39532/small/wbtc.png",
};

async function getOwnedTokens(args?: Args): Promise<WalletToken[]> {
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    return [];
  }

  rift.setBearerToken(authToken);

  try {
    // Get user's tokens from the SDK
    const response = await rift.assets.getUserTokens();
    const sdkTokens = response.data ?? [];

    if (sdkTokens.length === 0) {
      return [];
    }

    const sdkIds = sdkTokens.map((t: any) => t.id);

    // Match SDK tokens against local definitions (only by backend_id, no base fallback)
    const localMatches = await getTokens({
      list: sdkIds,
      swappable: args?.is_swappable,
    });

    // Build a set of matched backend_ids so we know which SDK tokens are unmatched
    const matchedIds = new Set((localMatches ?? []).map((t) => t.backend_id));

    // For SDK tokens without a local definition, create a WalletToken from SDK data
    const unmatchedTokens: WalletToken[] = sdkTokens
      .filter((t: any) => !matchedIds.has(t.id))
      .map((t: any) => ({
        id: t.name?.toLowerCase() === "usdc" ? "usd-coin" : t.name?.toLowerCase() === "usdt" ? "tether" : t.name?.toLowerCase(),
        name: t.name,
        description: t.description || `${t.name} on ${t.id.split("-")[0]}`,
        enabled: t.enabled ?? true,
        contract_address: t.contract_address || null,
        chain_id: t.chain_id,
        icon: TOKEN_ICONS[t.name] || TOKEN_ICONS.ETH,
        backend_id: t.id,
      }));

    let result = [...(localMatches ?? []), ...unmatchedTokens];

    // Filter to only withdrawable tokens if requested
    if (args?.withdrawable_only) {
      result = result.filter(
        (t) =>
          WITHDRAWABLE_TOKENS.includes(t.name) &&
          !!WITHDRAWABLE_CHAINS[t.chain_id]
      );
    }

    return result;
  } catch {
    // If SDK call fails, fall through to returning all known tokens
  }

  // If SDK call fails, return empty — don't show tokens the user doesn't own
  return [];
}

export default function useOwnedTokens(swappable?: boolean, withdrawableOnly?: boolean) {
  const query = useQuery({
    queryKey: ["owned-tokens", swappable, withdrawableOnly],
    queryFn: async () => {
      return getOwnedTokens({
        is_swappable: swappable,
        withdrawable_only: withdrawableOnly,
      });
    },
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  return query;
}

export function useSearchOwnedTokens(args: { search: string }) {
  const query = useOwnedTokens();

  const searchQuery = useQuery({
    queryKey: [
      "search-owned-tokens",
      args.search,
      query.isLoading,
      query?.data?.length,
    ],
    queryFn: async () => {
      const data = query.data ?? [];
      if (args.search?.trim()?.length == 0) return data;
      return data?.filter((token) => {
        if (
          token.name
            .toLocaleLowerCase()
            .includes(args.search?.toLowerCase().trim())
        )
          return true;
        if (
          token.description
            .toLocaleLowerCase()
            .includes(args.search?.toLowerCase().trim())
        )
          return true;
        return false;
      });
    },
  });

  return searchQuery;
}
