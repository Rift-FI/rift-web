import { getTokens } from "@/lib/assets/tokens";
import { WalletToken } from "@/lib/entities";
import rift from "@/lib/rift";
import { useQuery } from "@tanstack/react-query";

interface Args {
  is_swappable?: boolean;
}

// Default icons by token name for SDK tokens without local definitions
const TOKEN_ICONS: Record<string, string> = {
  USDC: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
  USDT: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
  ETH: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
  DAI: "https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996",
  WBTC: "https://coin-images.coingecko.com/coins/images/39532/large/wbtc.png?1722810336",
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
      const allTokens = await getTokens({ swappable: args?.is_swappable });
      return allTokens ?? [];
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

    return [...(localMatches ?? []), ...unmatchedTokens];
  } catch {
    // If SDK call fails, fall through to returning all known tokens
  }

  // Fallback: return all enabled tokens so users can at least see what's available
  const allTokens = await getTokens({ swappable: args?.is_swappable });
  return allTokens ?? [];
}

export default function useOwnedTokens(swappable?: boolean) {
  const query = useQuery({
    queryKey: ["owned-tokens", swappable],
    queryFn: async () => {
      return getOwnedTokens({
        is_swappable: swappable,
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
