import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import RenderSuccessToast from "@/components/ui/helpers/render-success-toast";

export const SUPPORTED_CHAINS = {
  "base": "8453",
  "polygon": "137", 
  "arbitrum": "42161",
  "berachain": "80085"
} as const;

export const STABLECOIN_ADDRESSES = {
  "base": {
    "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "USDT": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"
  },
  "polygon": {
    "USDC": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "USDT": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
  },
  "arbitrum": {
    "USDC": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "USDT": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
  },
  "berachain": {
    "USDC.e": "0x549943e04f40284185054145c6E4e9568C1D3241",
    "USDT": undefined  // USDT not available on Berachain yet
  }
} as const;

interface TransferQuoteArgs {
  from_chain: string;
  to_chain: string;
  from_token: string;
  to_token: string;
  amount: string;
  from_address: string;
  to_address: string;
  from_amount: string;
  order: "FASTEST" | "CHEAPEST" | "SAFEST";
}

interface TransferToken {
  chain: number;
  token: string;
  amount: string;
  amountFormatted: string;
}

interface TransferFee {
  name: string;
  amount: string;
  amountUSD: string;
}

interface TransferFees {
  total: number;
  totalUSD: number;
  breakdown: TransferFee[];
}

interface TransferGas {
  estimatedCost: string;
  gasLimit: string;
  gasPrice: string;
}

interface TransferExecution {
  estimatedTime: number;
  tool: string;
  toolName: string;
}

interface TransferDetails {
  from: TransferToken;
  to: TransferToken;
  fees: TransferFees;
  gas: TransferGas;
  execution: TransferExecution;
}

interface TransferTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  chainId: number;
}

interface TransferQuoteResponse {
  success: boolean;
  transfer: TransferDetails;
  transaction: TransferTransaction;
  rawData: Record<string, unknown>;
}

export default function useLifiTransfer() {
  const { mutate: transferQuoteMutation, isPending: transferQuotePending, data: transferQuoteData } = useMutation({
    mutationFn: async (args: TransferQuoteArgs) => {
      const baseUrl = import.meta.env.VITE_LIFI_API_URL || "https://swap.captain.riftfi.xyz";
      
      const amountInSmallestUnit = Math.floor(parseFloat(args.amount) * 1000000).toString();
      
      const url = `${baseUrl}/transfer?${new URLSearchParams({
        fromChain: args.from_chain,
        toChain: args.to_chain,
        fromToken: args.from_token,
        toToken: args.to_token,
        amount: amountInSmallestUnit,
        fromAddress: args.from_address,
        toAddress: args.to_address,
        fromAmount: amountInSmallestUnit,
        order: args.order
      })}`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get transfer quote');
      }
      
      return data as TransferQuoteResponse;
    },
    onSuccess: () => {
      toast.custom(() => <RenderSuccessToast message="Transfer quote ready!" />, {
        position: "top-center",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('LiFi transfer quote error:', error);
      toast.custom(() => <RenderErrorToast message="Transfer quote failed" />, {
        position: "top-center",
        duration: 2000,
      });
    }
  });

  return {
    transferQuoteMutation,
    transferQuotePending,
    transferQuoteData,
  };
}
