import { useQuery, useMutation } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_SDK_API_KEY;

function getHeaders(withAuth = false) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
  if (withAuth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// Types
export interface BridgeRoutes {
  routes: Record<string, string[]>;
  supportedTokens: string[];
}

export interface BridgeQuote {
  sourceChain: string;
  destinationChain: string;
  token: string;
  inputAmount: string;
  outputAmount: string;
  fee: string;
  feeBps: number;
  estimatedTime: string;
}

export interface BridgeExecuteResult {
  success: boolean;
  sourceChain: string;
  destinationChain: string;
  token: string;
  inputAmount: string;
  outputAmount: string;
  fee: string;
  recipient: string;
  transactionHash: string;
  smartWalletAddress: string;
  sourceChainId: number;
  destinationChainId: number;
  timedOut?: boolean;
}

// Fetch bridge routes
export function useBridgeRoutes() {
  return useQuery({
    queryKey: ["bridge-routes"],
    queryFn: async (): Promise<BridgeRoutes> => {
      const res = await fetch(`${API_URL}/bridge/routes`, {
        headers: getHeaders(true),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch bridge routes");
      return res.json();
    },
    staleTime: 60_000,
  });
}

// Fetch bridge quote
export function useBridgeQuote(args: {
  sourceChain: string;
  destinationChain: string;
  token: string;
  amount: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["bridge-quote", args.sourceChain, args.destinationChain, args.token, args.amount],
    queryFn: async (): Promise<BridgeQuote> => {
      const res = await fetch(`${API_URL}/bridge/quote`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          sourceChain: args.sourceChain,
          destinationChain: args.destinationChain,
          token: args.token,
          amount: args.amount,
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
    enabled: args.enabled !== false && !!args.sourceChain && !!args.destinationChain && !!args.token && !!args.amount && parseFloat(args.amount) > 0,
    staleTime: 15_000,
  });
}

// Execute bridge
export function useBridgeExecute() {
  return useMutation({
    mutationFn: async (args: {
      sourceChain: string;
      destinationChain: string;
      token: string;
      amount: string;
      recipient?: string;
    }): Promise<BridgeExecuteResult> => {
      const res = await fetch(`${API_URL}/bridge/execute`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(args),
        cache: "no-store",
      });
      if (res.status === 408) {
        const data = await res.json().catch(() => ({}));
        return { ...data, timedOut: true } as BridgeExecuteResult;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Bridge failed" }));
        throw new Error(err.message || "Bridge failed");
      }
      return res.json();
    },
  });
}
