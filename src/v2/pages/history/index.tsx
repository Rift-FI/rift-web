import useWalletTxHistory from "@/hooks/wallet/use-history";
import { TransactionItem, TransactionItemSkeleton } from "./components/TransactionItem";

export default function History() {
  const { wallettxhistory } = useWalletTxHistory();
  const { data, isPending: TX_HISTORY_LOADING } = wallettxhistory;
  const TX_HISTORY = data?.transactions || [];

  return (
    <div className="w-full min-h-screen p-6 px-0">
      <h1 className="text-xl text-center font-bold text-white">Recent Activity</h1>

      {TX_HISTORY?.length == 0 && <p className="text-md text-center font-medium text-text-subtle">You have no recent activity</p>}

      {TX_HISTORY_LOADING && (
        <div className="space-y-2 px-4 mt-4">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      )}

      <div className="flex flex-col gap-4 max-w-2xl mx-auto mt-2">
        {Array.isArray(TX_HISTORY) &&
          TX_HISTORY?.map((transaction, idx) => (
            <TransactionItem
              key={transaction.token + idx}
              transaction={transaction}
            />
          ))}
      </div>
    </div>
  );
}