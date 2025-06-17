import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { CandlestickData } from "lightweight-charts";
import { fetchCoinPrices } from "@/utils/coingecko/markets";

interface UseTokenHistoricalDataResult {
  readonly historicalData: CandlestickData[] | null;
  readonly isLoadingHistoricalData: boolean;
  readonly errorHistoricalData: Error | null;
}

interface TokenHistoricalDataParams {
  readonly id: string;
  readonly daysRange: number;
}

const QUERY_KEY_PREFIX = "historicalData" as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const DEFAULT_DAYS_RANGE = 30;

const createHistoricalDataQueryOptions = (
  params: TokenHistoricalDataParams
) => ({
  queryKey: [QUERY_KEY_PREFIX, params.id, params.daysRange] as const,
  queryFn: () => fetchTokenHistoricalData(params),
  enabled: Boolean(params.id) && params.daysRange > 0,
  staleTime: STALE_TIME,
  cacheTime: CACHE_TIME,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
});

async function fetchTokenHistoricalData({
  id,
  daysRange,
}: TokenHistoricalDataParams): Promise<CandlestickData[]> {
  try {
    const data = await fetchCoinPrices(id, daysRange);

    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid historical data received");
    }

    return data.sort((a, b) => (a.time as number) - (b.time as number));
  } catch (error) {
    console.error("Error fetching token historical data:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch token historical data");
  }
}

/**
 * Custom hook to fetch token historical price data
 * @param id - The token ID to fetch historical data for
 * @param daysRange - Number of days of historical data to fetch
 * @returns Historical price data with loading and error states
 */
export const useTokenHistoricalData = (
  id: string,
  daysRange: number = DEFAULT_DAYS_RANGE
): UseTokenHistoricalDataResult => {
  const queryResult: UseQueryResult<CandlestickData[], Error> = useQuery(
    createHistoricalDataQueryOptions({ id, daysRange })
  );

  const {
    data: historicalData,
    isLoading: isLoadingHistoricalData,
    error: errorHistoricalData,
  } = queryResult;

  return {
    historicalData: historicalData ?? null,
    isLoadingHistoricalData,
    errorHistoricalData,
  };
};
