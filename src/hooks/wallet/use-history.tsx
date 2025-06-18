import { useQuery } from "@tanstack/react-query";
import sphere from "@/lib/sphere";
import { Transaction } from "@/lib/entities";

async function getTransactionHistory() {
  const txhistory = (await sphere.transactions.getHistory({})) as unknown as { transactions: Array<Transaction> };

  return txhistory;
}

export default function useWalletTxHistory() {
  const walletHistoryQuery = useQuery({
    queryKey: ["wallet-history"],
    queryFn: getTransactionHistory,
  });

  return walletHistoryQuery
}
