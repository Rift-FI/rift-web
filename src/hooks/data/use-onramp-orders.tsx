import { useQuery } from "@tanstack/react-query";
import { riftRequest } from "@/lib/nonCustodial";
import { handleSuspension } from "@/utils/api-suspension-handler";

/** Paycrest onramp order (GET /v1/onramps, GET /v1/onramps/:id). */
export interface OnrampOrder {
  id: string;
  status: string; // app vocabulary: awaiting_payment | processing | completed | …
  providerStatus?: string;
  currency: string;
  fiatAmount: number;
  cryptoAmount?: number;
  token?: string;
  chain?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  txHash?: string | null;
  reference?: string | null;
  providerAccount?: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    amountToTransfer: number | string;
    currency: string;
    validUntil: string;
    memo?: string;
  };
  [key: string]: unknown;
}

export const ONRAMP_ORDERS_KEY = ["onramp-orders"] as const;

export default function useOnrampOrders() {
  return useQuery({
    queryKey: ONRAMP_ORDERS_KEY,
    queryFn: async (): Promise<OnrampOrder[]> => {
      if (!localStorage.getItem("token")) throw new Error("No authentication token found");
      try {
        const { data } = await riftRequest<any>("GET", "/v1/onramps");
        const list = Array.isArray(data) ? data : data?.orders ?? data?.data ?? [];
        return (Array.isArray(list) ? list : []).sort(
          (a: OnrampOrder, b: OnrampOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error: any) {
        if (error?.status === 403 && /suspended/i.test(error?.message || "")) handleSuspension();
        throw error;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
