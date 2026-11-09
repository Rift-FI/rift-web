import { useMutation, useQueryClient } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { runV3Offramp } from "@/lib/v3Offramp";

export interface CreateOfframpOrderRequest {
  token: "USDC" | any;
  amount: number; // USD amount (KES amount / exchange rate)
  currency: "KES" | any;
  chain: "base" | any;
  recipient: string; // JSON stringified Recipient object
  localAmount?: number;
}

export interface OfframpOrder {
  id: string;
  status: string;
  transactionCode: string;
  amount: number;
  createdAt: string;
}

export interface CreateOfframpOrderResponse {
  order: OfframpOrder;
}

export async function createWithdrawalOrder(request: CreateOfframpOrderRequest): Promise<CreateOfframpOrderResponse> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    rift.setBearerToken(authToken);

    // Passkey-approved two-phase offramp: init → passkey sign → finalize.
    {
      const finalized = await runV3Offramp({
        token: request.token,
        amount: request.amount,
        currency: request.currency,
        chain: request.chain,
        recipient: request.recipient,
        localAmount: request.localAmount,
      });
      return {
        order: {
          id: finalized.orderId,
          status: finalized.status,
          transactionCode: finalized.transactionCode,
          amount: finalized.fiatAmount,
          createdAt: new Date().toISOString(),
        },
      };
    }
  } catch (error) {
    throw error;
  }
}

export default function useCreateWithdrawalOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWithdrawalOrder,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["base-usdc-balance"] });
        queryClient.invalidateQueries({ queryKey: ["sailr-balances"] });
        queryClient.invalidateQueries({ queryKey: ["chains-balances"] });
      }, 3000);
    },
  });
}