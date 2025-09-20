import { useMutation } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { Invoice } from "./use-invoices";

export type ChainName = "BASE";
export type TokenSymbol = "USDC";
export type InvoiceStatus = "PENDING" | "COMPLETED" | "EXPIRED";

export interface CreateInvoiceRequest {
  description: string;
  chain: ChainName;
  token: TokenSymbol;
  amount: number;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface CreateInvoiceResponse {
  // Use any to match SDK response structure
  [key: string]: any;
}

async function createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  try {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }
    
    rift.setBearerToken(authToken);
    
    const response = await rift.merchant.createInvoice(request);
    return response;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

export default function useCreateInvoice() {
  return useMutation({
    mutationFn: createInvoice,
  });
}