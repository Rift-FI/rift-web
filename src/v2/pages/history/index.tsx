import { useEffect, useState } from "react";
import useAnalaytics from "@/hooks/use-analytics";
import useWalletTxHistory from "@/hooks/wallet/use-history";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import {
  TransactionItem,
  TransactionItemSkeleton,
} from "./components/TransactionItem";
import { LinkItem } from "./components/LinkItem";
import { cn } from "@/lib/utils";
import { Transaction } from "@/lib/entities";

export default function History() {
  const walletHistoryQuery = useWalletTxHistory();
  const { listRequestLinks, listSendLinks } = usePaymentLinks();
  const { logEvent } = useAnalaytics();

  const [activity, setActivity] = useState<
    "transactions" | "sendlinks" | "requestlinks"
  >("transactions");

  useEffect(() => {
    // Track page visit
    logEvent("PAGE_VISIT_ACTIVITY");
  }, [logEvent]);

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4">
      <h1 className="text-xl text-center font-bold text-white">
        Recent Activity
      </h1>

      <div className="flex flex-row w-full mt-4 gap-1.5">
        <button
          onClick={() => setActivity("transactions")}
          className={cn(
            "flex-1 py-2 px-2 text-sm font-medium cursor-pointer border-b-2 border-transparent",
            activity == "transactions"
              ? "border-surface-subtle"
              : "text-muted-foreground"
          )}
        >
          Transactions
        </button>

        <button
          onClick={() => setActivity("sendlinks")}
          className={cn(
            "flex-1 py-2 px-2 text-sm font-medium cursor-pointer border-b-2 border-transparent",
            activity == "sendlinks"
              ? "border-surface-subtle"
              : "text-muted-foreground"
          )}
        >
          Sent Links
        </button>

        <button
          onClick={() => setActivity("requestlinks")}
          className={cn(
            "flex-1 py-2 px-2 text-sm font-medium cursor-pointer border-b-2 border-transparent",
            activity == "requestlinks"
              ? "border-surface-subtle"
              : "text-muted-foreground"
          )}
        >
          Requests
        </button>
      </div>

      {activity == "requestlinks" &&
        listRequestLinks.data?.data?.length == 0 && (
          <p className="text-md text-center font-medium text-text-subtle mt-4">
            Start requesting payments via links to see them listed here
          </p>
        )}

      {activity == "sendlinks" && listSendLinks.data?.data?.length == 0 && (
        <p className="text-md text-center font-medium text-text-subtle mt-4">
          Start sending links to see them listed here
        </p>
      )}

      {activity == "transactions" &&
        walletHistoryQuery?.data?.transactions?.length == 0 && (
          <p className="text-md text-center font-medium text-text-subtle mt-4">
            You have no recent activity
          </p>
        )}

      {(walletHistoryQuery?.isLoading ||
        listSendLinks?.isPending ||
        listRequestLinks?.isPending) && (
        <div className="space-y-2 px-4 mt-4">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {activity == "transactions" &&
          walletHistoryQuery?.data?.transactions?.map(
            (transaction: Transaction, idx: number) => (
              <TransactionItem
                key={transaction.token + idx}
                transaction={transaction}
              />
            )
          )}

        {activity == "sendlinks" &&
          listSendLinks.data?.data?.map((link) => (
            <LinkItem key={link.id} linkdata={link} />
          ))}

        {activity == "requestlinks" &&
          listRequestLinks.data?.data?.map((link) => (
            <LinkItem key={link.id} requestlinkdata={link} />
          ))}
      </div>
    </div>
  );
}
