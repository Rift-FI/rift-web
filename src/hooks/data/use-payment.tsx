import { useMutation } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface PayRequest {
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

export interface PayResponse {
  order: OfframpOrder;
}

async function makePayment(request: PayRequest): Promise<PayResponse> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.offramp.pay(request);
    return response;
  } catch (error) {
    console.error("Error making payment:", error);
    throw error;
  }
}

export default function usePayment() {
  return useMutation({
    mutationFn: makePayment,
  });
}