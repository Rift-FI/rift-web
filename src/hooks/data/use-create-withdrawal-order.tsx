import { useMutation } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface CreateOfframpOrderRequest {
  token: "USDC" | any;
  amount: number; // USD amount (KES amount / exchange rate)
  currency: "KES" | any;
  chain: "base" | any;
  recipient: string; // JSON stringified Recipient object
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

async function createWithdrawalOrder(request: CreateOfframpOrderRequest): Promise<CreateOfframpOrderResponse> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.offramp.createOrder(request);
    return response;
  } catch (error) {
    console.error("Error creating withdrawal order:", error);
    throw error;
  }
}

export default function useCreateWithdrawalOrder() {
  return useMutation({
    mutationFn: createWithdrawalOrder,
  });
}