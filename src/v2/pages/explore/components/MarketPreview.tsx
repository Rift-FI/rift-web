import { IoChevronForwardOutline } from "react-icons/io5";
import { useMarket } from "@/hooks/prediction-markets/use-markets";
import { Skeleton } from "@/components/ui/skeleton";
import { dateDistance, cn } from "@/lib/utils";

interface Props {
  marketId: string;
  isLast: boolean;
}

export default function MarketPreview({ marketId, isLast }: Props) {
  const { data: MARKET_DATA, isPending: MARKET_LOADING } = useMarket(marketId);

  return (
    <div
      className={cn(
        "flex flex-row items-start justify-between w-full p-2 border-b-1 border-app-background",
        isLast && "border-0 pb-0"
      )}
    >
      <div className="flex flex-col">
        <span className="text-sm">
          {MARKET_LOADING ? (
            <Skeleton className="mt-0 w-40 h-4" />
          ) : (
            MARKET_DATA?.question
          )}
        </span>

        <div>
          {MARKET_LOADING ? (
            <Skeleton className="mt-1 w-20 h-4" />
          ) : (
            <>
              <span className="w-fit px-2 rounded-full bg-text-subtle/10 font-medium text-xs text-text-subtle">
                {MARKET_DATA?.category}
              </span>

              <span className="ml-2 text-xs text-text-subtle">
                {dateDistance(MARKET_DATA?.createdAt ?? "")}
              </span>
            </>
          )}
        </div>
      </div>

      {MARKET_LOADING ? (
        <Skeleton className="mt-0 w-4 h-4" />
      ) : (
        <IoChevronForwardOutline className="text-xl text-text-subtle" />
      )}
    </div>
  );
}
