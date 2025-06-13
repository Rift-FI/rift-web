import { Transaction } from "@stratosphere-network/wallet";
import useToken from "@/hooks/data/use-token";
import { dateDistance, shortenString, formatNumberUsd } from "@/lib/utils";
import useTokens from "@/hooks/data/use-tokens";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction, }: Partial<TransactionItemProps>) => {
  const { token, transaction_hash, amount, created_at } = transaction as Transaction;
  const { data: TOKEN } = useToken({ id: token });
  console.log(TOKEN);


  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.1)] py-2.5 px-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <img
            src={TOKEN?.icon}
            alt={TOKEN?.name}
            className="w-8 h-8 object-contain"
          />
        </div>

        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-white font-semibold">
              {formatNumberUsd(Number(amount))} {token}
            </span>
            <span className="text-[rgba(255,255,255,0.5)] text-sm">
              {dateDistance(created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://etherscan.io/tx/${transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3498db] hover:text-[#2980b9] transition-colors font-medium text-sm"
            >
              {shortenString(transaction_hash)}
            </a>
          </div>
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