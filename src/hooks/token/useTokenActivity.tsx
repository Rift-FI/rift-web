import { useQuery, UseQueryResult } from "@tanstack/react-query";
import sphere from "@/lib/sphere";
import {
  TransactionHistoryRequest,
  Transaction,
} from "@stratosphere-network/wallet";

interface UseTokenActivityResult {
  readonly tokenActivity: Transaction[] | null;
  readonly isLoadingTokenActivity: boolean;
  readonly errorTokenActivity: Error | null;
}

interface TokenActivityParams {
  readonly tokenID: string;
  readonly limit: number;
  readonly page: number;
}

const QUERY_KEY_PREFIX = "tokenActivity" as const;
const STALE_TIME = 2 * 60 * 1000; // 2 minutes (more frequent for activity data)
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const createTokenActivityQueryOptions = (params: TokenActivityParams) => ({
  queryKey: [
    QUERY_KEY_PREFIX,
    params.tokenID,
    params.limit,
    params.page,
  ] as const,
  queryFn: () => fetchTokenActivity(params),
  enabled: Boolean(params.tokenID),
  staleTime: STALE_TIME,
  cacheTime: CACHE_TIME,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
});

async function fetchTokenActivity({
  tokenID,
  limit,
  page,
}: TokenActivityParams): Promise<Transaction[] | null> {
  try {
    const history = await fetchTransactionHistory(limit, page, tokenID);
    return history;
  } catch (error) {
    console.error("Error fetching token activity:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch token activity");
  }
}

async function fetchTransactionHistory(
  limit: number = DEFAULT_LIMIT,
  page: number = DEFAULT_PAGE,
  token?: string,
  chain?: string
): Promise<Transaction[] | null> {
  if (!sphere.isAuthenticated()) {
    throw new Error("SDK is not authenticated. Please log in the user first.");
  }

  try {
    const requestPayload: TransactionHistoryRequest = {
      limit,
      page,
      token,
      chain,
    };

    console.log(
      `Fetching transaction history (page ${page}, limit ${limit})...`
    );
    if (token) console.log(`  Filtering by token: ${token}`);
    if (chain) console.log(`  Filtering by chain: ${chain}`);

    const history = await sphere.transactions.getHistory(requestPayload);

    if (history && history.length > 0) {
      console.log(`Successfully fetched ${history.length} transactions:`);
      history.forEach((tx) => {
        console.log(`\n  Transaction Hash: ${tx.transaction_hash}`);
        console.log(`  Created: ${new Date(tx.created_at).toLocaleString()}`);
        console.log(`  Amount: ${tx.amount} ${tx.token}`);
        console.log(`  Chain: ${tx.chain}`);
        console.log(`  To: ${tx.recipient_address}`);
        console.log(`  User Email: ${tx.user_email}`);
      });
      return history;
    } else {
      console.log("No transaction history found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch transaction history");
  }
}

/**
 * Custom hook to fetch token activity data
 * @param tokenID - The token ID to fetch activity for
 * @param limit - Number of transactions to fetch
 * @param page - Page number for pagination
 * @returns Token activity data with loading and error states
 */
export const useTokenActivity = (
  tokenID: string,
  limit: number = DEFAULT_LIMIT,
  page: number = DEFAULT_PAGE
): UseTokenActivityResult => {
  const queryResult: UseQueryResult<Transaction[] | null, Error> = useQuery(
    createTokenActivityQueryOptions({ tokenID, limit, page })
  );

  const {
    data: tokenActivity,
    isLoading: isLoadingTokenActivity,
    error: errorTokenActivity,
  } = queryResult;

  return {
    tokenActivity: tokenActivity ?? null,
    isLoadingTokenActivity,
    errorTokenActivity,
  };
};
