import { Fragment, useEffect, useState } from "react";
import { motion } from "motion/react";
import useAnalaytics from "@/hooks/use-analytics";
import useWalletTxHistory from "@/hooks/wallet/use-history";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import {
  TransactionItem,
  TransactionItemSkeleton,
} from "./components/TransactionItem";
import { LinkItem } from "./components/LinkItem";
import ChatBot from "../home/components/ChatBot";
import { Transaction } from "@/lib/entities";
import { colors } from "@/constants";

type activityType = "transactions" | "sendlinks" | "requestlinks";

const activity_tabs: { text: string; activity: activityType }[] = [
  { text: "Transactions", activity: "transactions" },
  { text: "Sent Links", activity: "sendlinks" },
  { text: "Requests", activity: "requestlinks" },
];

export default function History() {
  const walletHistoryQuery = useWalletTxHistory();
  const { listRequestLinks, listSendLinks } = usePaymentLinks();
  const { logEvent } = useAnalaytics();

  const [activity, setActivity] = useState<activityType>("transactions");

  useEffect(() => {
    logEvent("PAGE_VISIT_ACTIVITY");
  }, [logEvent]);

  return (
    <Fragment>
      <motion.div
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full h-full overflow-y-auto mb-18 p-4"
      >
        <h1 className="text-xl text-center font-medium text-white">
          Recent Activity
        </h1>

        <div className="flex flex-row w-full mt-4 gap-1.5">
          {activity_tabs.map((_actTab) => (
            <motion.button
              key={_actTab.activity}
              initial={false}
              animate={{
                borderBottomColor:
                  activity == _actTab?.activity
                    ? colors.surfacesubtle
                    : colors.surface,
                color:
                  activity == _actTab?.activity
                    ? colors.textdefault
                    : colors.textsubtle,
              }}
              transition={{ ease: "easeInOut" }}
              onClick={() => setActivity(_actTab.activity)}
              className="flex-1 py-2 px-2 text-sm text-text-subtle font-medium cursor-pointer border-b-2 border-transparent"
            >
              {_actTab.text}
            </motion.button>
          ))}
        </div>

        {(walletHistoryQuery?.isLoading ||
          listSendLinks?.isPending ||
          listRequestLinks?.isPending) && (
          <div className="space-y-2 mt-4">
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
          </div>
        )}

        {!walletHistoryQuery?.isLoading &&
          !listSendLinks?.isPending &&
          !listRequestLinks?.isPending && (
            <motion.div
              key={activity}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2 mt-4"
            >
              {activity == "requestlinks" &&
                listRequestLinks.data?.data?.length == 0 && (
                  <p className="text-md text-center font-medium text-text-subtle mt-4">
                    Start requesting crypto with Sphere links to see them listed
                    here
                  </p>
                )}

              {activity == "sendlinks" &&
                listSendLinks.data?.data?.length == 0 && (
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
            </motion.div>
          )}
      </motion.div>

      <ChatBot />
    </Fragment>
  );
}
