import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "mt-2 w-full h-10 bg-surface/70 animate-pulse rounded-sm",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
