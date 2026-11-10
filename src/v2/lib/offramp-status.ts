import { useQuery } from "@tanstack/react-query";
import { riftRequest } from "@/lib/nonCustodial";
import { isFinal, toAppStatus, type AppStatus } from "./status";

/**
 * Live payout status (GET /v1/offramps/:id) for the receipt shown after a
 * payout / withdrawal: "processing" until the provider settles, then
 * "completed" (or refunding / refunded / failed).
 */
export function useOfframpStatus(id: string | undefined, initial: string | undefined) {
  const start = toAppStatus(initial);
  const q = useQuery({
    queryKey: ["offramp", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await riftRequest<any>("GET", `/v1/offramps/${encodeURIComponent(id!)}`);
      const d = data?.data ?? data?.order ?? data;
      return { status: toAppStatus(d?.status ?? initial), txHash: d?.txHash ?? d?.transaction_hash ?? null } as { status: AppStatus; txHash: string | null };
    },
    retry: false,
    refetchInterval: (query) => {
      const s = (query.state.data as { status: AppStatus } | undefined)?.status ?? start;
      return isFinal(s) || query.state.error ? false : 5000;
    },
  });
  return { status: q.data?.status ?? start, txHash: q.data?.txHash ?? null };
}
