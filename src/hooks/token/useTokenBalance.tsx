import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchCoinInfo } from "@/utils/coingecko/markets";

interface TokenPriceChangeData {
  readonly tokenPriceChange: number | undefined;
  readonly tokenPriceChangeUsd: number | undefined;
}

interface UseTokenPriceChangeResult extends TokenPriceChangeData {
  readonly isLoadingTokenPriceChange: boolean;
  readonly errorTokenPriceChange: Error | null;
}

interface CoinGeckoTokenData {
  readonly market_data: {
    readonly price_change_percentage_24h: number;
    readonly price_change_24h_in_currency: {
      readonly usd: number;
    };
  };
}

const QUERY_KEY_PREFIX = "tokenPriceChange" as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

const createTokenPriceChangeQueryOptions = (id: string) => ({
  queryKey: [QUERY_KEY_PREFIX, id] as const,
  queryFn: () => fetchCoinInfo(id),
  enabled: Boolean(id),
  staleTime: STALE_TIME,
  cacheTime: CACHE_TIME,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
});

const transformTokenPriceChangeData = (
  data: CoinGeckoTokenData | undefined
): TokenPriceChangeData => {
  if (!data?.market_data) {
    return {
      tokenPriceChange: undefined,
      tokenPriceChangeUsd: undefined,
    };
  }

  return {
    tokenPriceChange: data.market_data.price_change_percentage_24h,
    tokenPriceChangeUsd: data.market_data.price_change_24h_in_currency.usd,
  };
};

/**
 * Custom hook to fetch token price change data
 * @param id - The token ID to fetch price change data for
 * @returns Token price change data with loading and error states
 */
export const useTokenPriceChange = (id: string): UseTokenPriceChangeResult => {
  const queryResult: UseQueryResult<CoinGeckoTokenData, Error> = useQuery(
    createTokenPriceChangeQueryOptions(id)
  );

  const {
    data,
    isLoading: isLoadingTokenPriceChange,
    error: errorTokenPriceChange,
  } = queryResult;

  if (data && "error" in (data as any)) {
    return {
      tokenPriceChange: undefined,
      tokenPriceChangeUsd: undefined,
      isLoadingTokenPriceChange: false,
      errorTokenPriceChange: new Error((data as any).error),
    };
  }

  const transformedData = transformTokenPriceChangeData(data);

  return {
    ...transformedData,
    isLoadingTokenPriceChange,
    errorTokenPriceChange,
  };
};
