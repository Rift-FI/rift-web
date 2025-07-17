import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchCoinInfo } from "@/utils/coingecko/markets";

export interface TokenMarketData {
  readonly market_cap: {
    readonly usd: number;
  };
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

export interface TokenDetails {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly genesis_date: string;
  readonly market_cap_rank: number;
  readonly description: {
    readonly en: string;
  };
  readonly image: {
    readonly small: string;
  };
  readonly links: {
    readonly homepage: string[];
  };
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

const QUERY_KEY_PREFIX = "tokenDetails" as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

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

export const useTokenDetails = (id: string): UseTokenDetailsResult => {
  const queryResult: UseQueryResult<TokenDetailsResponse, Error> = useQuery(
    createTokenDetailsQueryOptions(id)
  );

  const {
    data,
    isLoading: isLoadingTokenDetails,
    error: errorTokenDetails,
  } = queryResult;

  if (data && isTokenDetailsError(data)) {
    return {
      tokenDetails: null,
      isLoadingTokenDetails: false,
      errorTokenDetails: new Error(data.error),
    };
  }

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
