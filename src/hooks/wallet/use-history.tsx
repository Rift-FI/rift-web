import { useQuery } from "@tanstack/react-query";
import sphere from "@/lib/sphere";

async function getTransactionHistory() {
  const txhistory = await sphere.transactions.getHistory({});

  return txhistory;
}

export default function useWalletTxHistory() {
  const wallettxhistory = useQuery({
    queryKey: ["wallettxhistory"],
    queryFn: getTransactionHistory,
  });

  return { wallettxhistory };
}
