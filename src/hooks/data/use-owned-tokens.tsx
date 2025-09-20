import { getTokens } from "@/lib/assets/tokens";
import { WalletToken } from "@/lib/entities";
import rift from "@/lib/rift";
import { useQuery } from "@tanstack/react-query";

export const MOCK_STABLE_COINS: WalletToken[] = [
  {
    id: "usd-coin",
    name: "USD Coin",
    description: "USDC on Polygon",
    enabled: true,
    contract_address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    chain_id: "137",
    icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    is_native: false,
  },
  {
    id: "usd-coin",
    name: "USD Coin",
    description: "USDC on Base",
    enabled: true,
    contract_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chain_id: "8453",
    icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    is_native: false,
  },
  {
    id: "usd-coin",
    name: "USD Coin",
    description: "USDC on Arbitrum",
    enabled: true,
    contract_address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    chain_id: "42161",
    icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    is_native: false,
  },
  // {
  //   id: "bob-network-bridged-usdce-bob-network",
  //   name: "USDC.e",
  //   description: "BOB Network Bridged USDC.E (BOB Network)",
  //   enabled: true,
  //   contract_address: "0x549943e04f40284185054145c6E4e9568C1D3241",
  //   chain_id: "80085",
  //   icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
  //   is_native: false,
  // },
  {
    id: "tether",
    name: "Tether USD",
    description: "USDT on Polygon",
    enabled: true,
    contract_address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    chain_id: "137",
    icon: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    is_native: false,
  },
  {
    id: "tether",
    name: "Tether USD",
    description: "USDT on Base",
    enabled: true,
    contract_address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    chain_id: "8453",
    icon: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    is_native: false,
  },
  {
    id: "tether",
    name: "Tether USD",
    description: "USDT on Arbitrum",
    enabled: true,
    contract_address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    chain_id: "42161",
    icon: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    is_native: false,
  }
];


interface Args {
  is_swappable?: boolean;
}

async function getOwnedTokens(args?: Args) {
  // Ensure sphere has the auth token
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    return [];
  }

  rift.setBearerToken(authToken);

  const chainsResponse = await rift.assets.getUserTokens();
  const token_list = chainsResponse.data?.map((c) => c.id) ?? [];
  const actual_tokens = await getTokens({
    base: true,
    list: token_list,
    swappable: args?.is_swappable,
  });

  //TODO: return actual_tokens remove this mock
  return MOCK_STABLE_COINS;
}

export default function useOwnedTokens(swappable?: boolean) {
  const query = useQuery({
    queryKey: ["owned-tokens"],
    queryFn: async () => {
      return getOwnedTokens({
        is_swappable: swappable,
      });
    },
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
