import { Skeleton } from "@/components/ui/skeleton";

export const TokenSketleton = () => {
  return (
    <div className="flex flex-row gap-3 w-full items-center justify-between rounded-xl bg-secondary p-4 py-3">
      <div className="flex flex-row items-center gap-2">
        <Skeleton className="mt-0 w-10 h-10 rounded-full" />

        <div className="flex flex-col gap-2">
          <Skeleton className="mt-0 w-12 h-2" />
          <Skeleton className="mt-0 w-20 h-2" />
        </div>
      </div>

      <Skeleton className="mt-0 w-12 h-2" />
    </div>
  );
};
