import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchCoinInfo } from "@/utils/coingecko/markets";

// Types
interface TokenMarketData {
  readonly current_price: {
    readonly usd: number;
  };
  readonly price_change_percentage_24h: number;
  readonly price_change_24h_in_currency: {
    readonly usd: number;
  };
  readonly total_supply?: number;
  readonly circulating_supply?: number;
  readonly max_supply?: number;
}

interface TokenDetails {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly market_data: TokenMarketData;
}

interface TokenDetailsError {
  readonly error: string;
}

type TokenDetailsResponse = TokenDetails | TokenDetailsError;

interface UseTokenDetailsResult {
  readonly tokenDetails: TokenDetails | null;
  readonly isLoadingTokenDetails: boolean;
  readonly errorTokenDetails: Error | null;
}

// Constants
const QUERY_KEY_PREFIX = "tokenDetails" as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Type guards
const isTokenDetailsError = (
  data: TokenDetailsResponse
): data is TokenDetailsError => {
  return "error" in data;
};

const isValidTokenDetails = (
  data: TokenDetailsResponse
): data is TokenDetails => {
  return (
    !isTokenDetailsError(data) &&
    data.market_data?.current_price?.usd !== undefined
  );
};

// Query options factory
const createTokenDetailsQueryOptions = (id: string) => ({
  queryKey: [QUERY_KEY_PREFIX, id] as const,
  queryFn: () => fetchCoinInfo(id),
  enabled: Boolean(id),
  staleTime: STALE_TIME,
  cacheTime: CACHE_TIME,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
});

/**
 * Custom hook to fetch token details
 * @param id - The token ID to fetch details for
 * @returns Token details with loading and error states
 */
export const useTokenDetails = (id: string): UseTokenDetailsResult => {
  const queryResult: UseQueryResult<TokenDetailsResponse, Error> = useQuery(
    createTokenDetailsQueryOptions(id)
  );

  const {
    data,
    isLoading: isLoadingTokenDetails,
    error: errorTokenDetails,
  } = queryResult;

  // Handle API error response
  if (data && isTokenDetailsError(data)) {
    return {
      tokenDetails: null,
      isLoadingTokenDetails: false,
      errorTokenDetails: new Error(data.error),
    };
  }

  // Handle invalid token details
  if (data && !isValidTokenDetails(data)) {
    return {
      tokenDetails: null,
      isLoadingTokenDetails: false,
      errorTokenDetails: new Error("Invalid token details received"),
    };
  }

  return {
    tokenDetails: data && isValidTokenDetails(data) ? data : null,
    isLoadingTokenDetails,
    errorTokenDetails,
  };
};
