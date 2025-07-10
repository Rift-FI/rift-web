import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getTokens } from "@/lib/assets/tokens";

type GeckoResponse = Record<string, Record<string, number>>;

interface PriceArgs {
  /** token id */
  token?: string;
  base?: "usd" | "eth";
}

export async function fetchGeckoPrice(args: PriceArgs) {
  // TODO: custom logic for sphere and other unlisted tokens
  const tokens = await getTokens({
    id: args.token,
  });
  const token = tokens?.at(0);

  const TOKEN_GECKO_ID = token?.id;

  if (!TOKEN_GECKO_ID) return 0;

  const response = await axios.get<GeckoResponse>(
    "https://pro-api.coingecko.com/api/v3/simple/price",
    {
      params: {
        ids: TOKEN_GECKO_ID,
        vs_currencies: args.base,
        x_cg_pro_api_key: "CG-Whw1meTdSTTT7CSpGZbaB3Yi", // TODO: Move to env variables
      },
    }
  );

  const gecko = response.data;

  const baseValue = gecko?.[TOKEN_GECKO_ID][args?.base!] ?? 0;

  return baseValue;
}

export default function useGeckoPrice(args: PriceArgs & { amount?: number }) {
  const { token, base = "usd", amount } = args;

  const query = useQuery({
    queryKey: ["gecko-price", token, base, amount],
    queryFn: async () => {
      if (!token || !base) return 0;
      return fetchGeckoPrice({
        token,
        base,
      });
    },
    enabled: !!token && !!base,
  });

  const convertedAmount = useMemo(() => {
    if (!token || !base) return 0;
    if (!query.data) return 0;
    if (!amount) return 0;

    return amount * query.data;
  }, [token, base, query.isLoading, query.data, amount]);

  return {
    convertedAmount,
    geckoQuery: query,
  };
}
