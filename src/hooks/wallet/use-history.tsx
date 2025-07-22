import { useQuery, useQueryClient } from "@tanstack/react-query";
import sphere from "@/lib/sphere";
import { Transaction } from "@/lib/entities";

const HISTORY_CACHE_KEY = "wallet-history";

async function getTransactionHistory() {
  const txhistory = (await sphere.transactions.getHistory({})) as unknown as {
    transactions: Array<Transaction>;
  };

  return txhistory;
}

export function useClearHistoryCache() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem(HISTORY_CACHE_KEY);
    queryClient.invalidateQueries({ queryKey: [HISTORY_CACHE_KEY] });
  };
}

export default function useWalletTxHistory() {
  const walletHistoryQuery = useQuery({
    queryKey: [HISTORY_CACHE_KEY],
    queryFn: getTransactionHistory,
    initialData: () => {
      const cachedHistory = localStorage.getItem(HISTORY_CACHE_KEY);
      if (cachedHistory) {
        return JSON.parse(cachedHistory);
      }
      return undefined;
    },
  });

  return walletHistoryQuery;
}
