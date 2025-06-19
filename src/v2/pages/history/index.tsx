import useWalletTxHistory from "@/hooks/wallet/use-history";
import {
  TransactionItem,
  TransactionItemSkeleton,
} from "./components/TransactionItem";

export default function History() {
  const walletHistoryQuery = useWalletTxHistory();

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4">
      <h1 className="text-xl text-center font-bold text-white">
        Recent Activity
      </h1>

      {walletHistoryQuery?.data?.transactions?.length == 0 && (
        <p className="text-md text-center font-medium text-text-subtle">
          You have no recent activity
        </p>
      )}

      {walletHistoryQuery?.isLoading && (
        <div className="space-y-2 px-4 mt-4">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {walletHistoryQuery?.data?.transactions?.map((transaction, idx) => (
          <TransactionItem
            key={transaction.token + idx}
            transaction={transaction}
          />
        ))}
      </div>
    </div>
  );
}
