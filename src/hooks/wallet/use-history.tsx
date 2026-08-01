import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@/lib/entities";
import { getApiBase } from "@/lib/apiBase";

const HISTORY_CACHE_KEY = "wallet-history";

// Direct fetch instead of rift.transactions.getHistory() — the installed
// SDK 1.4.34 has a bug where getHistory posts to /v1/transactions (the
// txSend endpoint) with the filters as query params. That hits the SEND
// controller which returns 400 "to and value required", so the transfers
// tab was empty. Backend already exposes GET /v1/transactions for
// history; hit it directly until the SDK is republished.
async function getTransactionHistory(): Promise<{
  transactions: Array<Transaction>;
}> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No access token");
  const res = await fetch(`${getApiBase()}/v1/transactions`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`transaction history ${res.status}: ${await res.text()}`);
  }
  return res.json();
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
