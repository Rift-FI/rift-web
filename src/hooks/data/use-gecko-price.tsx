import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getTokens } from "@/lib/assets/tokens";

const ENSO_API_KEY = import.meta.env.VITE_ENSO_API_KEY;
const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

interface PriceArgs {
  /** local token id (e.g. "usd-coin", "ethereum") */
  token?: string;
  base?: "usd" | "eth";
  /** chain id number (e.g. "8453" for Base, "1" for Ethereum) */
  chainId?: string;
  /** contract address — pass null for native tokens */
  contractAddress?: string | null;
}

export async function fetchTokenPrice(args: PriceArgs): Promise<number> {
  let chainId = args.chainId;
  let address = args.contractAddress;

  // If chainId/address not provided, look up from local token definitions
  if (!chainId || address === undefined) {
    const tokens = await getTokens({ id: args.token });
    const token = tokens?.at(0);
    if (!token) return 0;
    chainId = token.chain_id;
    address = token.contract_address;
  }

  if (!chainId) return 0;

  // Native tokens (ETH etc.) use the standard placeholder address
  const tokenAddress = address || NATIVE_TOKEN_ADDRESS;

  const url = `https://api.enso.build/api/v1/prices/${chainId}/${tokenAddress}`;

  const response = await axios.get<{ price: number; decimals: number; symbol: string }>(url, {
    headers: {
      Authorization: `Bearer ${ENSO_API_KEY}`,
    },
  });

  return response.data?.price ?? 0;
}

export default function useGeckoPrice(args: PriceArgs & { amount?: number }) {
  const { token, base = "usd", amount, chainId, contractAddress } = args;

  const query = useQuery({
    queryKey: ["token-price", token, chainId, contractAddress],
    queryFn: async () => {
      if (!token && !chainId) return 0;
      return fetchTokenPrice({ token, base, chainId, contractAddress });
    },
    enabled: !!(token || chainId),
    staleTime: 30_000,
  });

  const convertedAmount = useMemo(() => {
    if (!token && !chainId) return 0;
    if (!query.data) return 0;
    if (!amount) return 0;

    return amount * query.data;
  }, [token, chainId, query.isLoading, query.data, amount]);

  return {
    convertedAmount,
    geckoQuery: query,
  };
}
