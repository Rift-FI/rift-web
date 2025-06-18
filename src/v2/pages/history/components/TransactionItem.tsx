import { openLink } from "@telegram-apps/sdk-react";
import useToken from "@/hooks/data/use-token";
import { dateDistance, shortenString, formatNumberUsd } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/lib/entities";
import { usePlatformDetection } from "@/utils/platform";

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction, }: Partial<TransactionItemProps>) => {
  const { amount, chain, token, id, transactionHash, createdAt } = transaction as Transaction;
  const { isTelegram } = usePlatformDetection()
  const { data: TOKEN } = useToken({ name: token });

  const handleClick = () => {
    isTelegram ? openLink(transactionHash) : window.open(transactionHash);
  }

  return (
    <div onClick={handleClick} className="bg-secondary rounded-xl p-4 py-3 cursor-pointer hover:bg-surface-subtle transition-colors flex flex-row items-center justify-between">
      <img
        src={TOKEN?.icon}
        alt={TOKEN?.name}
        className="w-8 h-8 object-contain mr-2"
      />

      <div className="flex-1 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-white font-semibold">
            {formatNumberUsd(Number(amount))} {token}
          </span>
          <span className="text-[rgba(255,255,255,0.5)] text-sm">
            {dateDistance(createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[#3498db] font-bold text-md">
            {shortenString(id)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const TransactionItemSkeleton = () => {
  return (
    <div className="p-2 flex flex-row gap-3 w-full items-center justify-start rounded-md bg-secondary" >
      <Skeleton className="mt-0 w-10 h-10 rounded-full" />

      <div className="flex flex-col gap-2">
        <Skeleton className="mt-0 w-12 h-2" />
        <Skeleton className="mt-0 w-30 h-4" />
      </div>
    </div>
  )
}