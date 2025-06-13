import useWalletTxHistory from "@/hooks/wallet/use-history";
import { TransactionItem, TransactionItemSkeleton } from "./components/TransactionItem";
import { isArray } from "lodash";

export default function History() {
  const walletHistoryQuery = useWalletTxHistory();

  return (
    <div className="w-full min-h-screen p-6 px-0">
      <h1 className="text-xl text-center font-bold text-white">Recent Activity</h1>

      {walletHistoryQuery?.data?.transactions?.length == 0 && <p className="text-md text-center font-medium text-text-subtle">You have no recent activity</p>}

      {walletHistoryQuery?.isLoading && (
        <div className="space-y-2 px-4 mt-4">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      )}

      <div className="flex flex-col gap-4 max-w-2xl mx-auto mt-2">
        {
          walletHistoryQuery?.data?.transactions?.map((transaction, idx) => (
            <TransactionItem
              key={transaction.token + idx}
              transaction={transaction}
            />
          ))}
      </div>
    </div>
  );
}