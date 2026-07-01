import { useQuery, useMutation } from "@tanstack/react-query";
import { getApiBase } from "@/lib/apiBase";
import { nonCustodialConfig, signWithPreferredMethod } from "@/lib/nonCustodial";

// Route through the centralised resolver so sandbox builds hit
// sandbox.riftfi.com and prod builds hit payment.riftfi.xyz — the
// direct VITE_API_URL read here used to bypass the VITE_RIFT_API_BASE
// override, leaving bridge/quote calls stuck on prod on sandbox.
const API_URL = getApiBase();
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
  /** What Across actually delivers on the destination chain, net of LP+relayer fee. */
  outputAmount: string;
  /** Aggregated fee for backwards-compat: platform + bridge. */
  fee: string;
  feeBps: number;
  estimatedTime: string;
  /** New rich shape — present after the backend bridge-quote rewrite. */
  feeBreakdown?: {
    /** Our 0.1% platform fee, deducted from input. */
    platformFee: string;
    /** Across LP + relayer fee. */
    bridgeFee: string;
    /** Paymaster gas, paid in the same token. */
    gasFeeInToken: string;
  };
  /** Smart-account balance of the bridged token, human-readable. */
  tokenBalance?: string;
  /** inputAmount + gasFeeInToken — what the smart wallet must hold. */
  totalNeeded?: string;
  /** Whether the wallet currently covers totalNeeded. */
  sufficient?: boolean;
  /** totalNeeded − tokenBalance when not sufficient. */
  deficit?: string;
  smartAccount?: string;
  /** `true` when the gas number is a heuristic (precise simulation failed). */
  degraded?: boolean;
  degradedReason?: string;
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

/**
 * Two-phase bridge for v3 users. The legacy one-phase /bridge/execute
 * signs internally at the smart-wallet, which for a v3 envelope means
 * the enclave receives a hash the client never had the chance to sign —
 * verification fails with "consent factor missing/wrong".
 *
 * For v3 the flow is:
 *   1. POST /v1/bridge/transfers/preview → { userOpHashHex, ticketId }
 *      (backend forwards to smart-wallet /api/bridge/preview which
 *       builds the Across approve + depositV3 calls and computes the
 *       SafeOp EIP-712 hash the enclave will see at sign time)
 *   2. Client signs userOpHashHex with passkey / OIDC (method chooser
 *      pops if 2+ methods are enrolled)
 *   3. POST /v1/wallet/user-operations/submit-prepared with authProof
 *      (backend forwards to smart-wallet, enclave verifies, tx broadcasts)
 *
 * v1/v2 users keep the legacy one-phase POST /bridge/execute path — the
 * enclave signs internally with the DEK it already has.
 */
async function bridgeV3TwoPhase(args: {
  sourceChain: string;
  destinationChain: string;
  token: string;
  amount: string;
  recipient?: string;
}): Promise<BridgeExecuteResult> {
  const { passkeyRpId } = nonCustodialConfig();

  // Phase 1 — preview
  const previewRes = await fetch(`${API_URL}/v1/bridge/transfers/preview`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({
      sourceChain: args.sourceChain,
      destChain: args.destinationChain,
      token: args.token,
      amount: args.amount,
      ...(args.recipient ? { recipient: args.recipient } : {}),
    }),
    cache: "no-store",
  });
  const previewBody = await previewRes.json().catch(() => ({}));
  if (!previewRes.ok || !previewBody?.success) {
    throw new Error(
      previewBody?.error || `Bridge preview failed (${previewRes.status})`
    );
  }
  const { userOpHashHex, ticketId } = previewBody as {
    userOpHashHex?: string;
    ticketId?: string;
  };
  if (!userOpHashHex || !ticketId) {
    throw new Error("Bridge preview returned no ticket / hash");
  }

  // Phase 2 — sign
  const authProof = await signWithPreferredMethod({
    userOpHashHex,
    rpId: passkeyRpId,
    preference: "auto",
  });

  // Phase 3 — submit (shared submit-prepared endpoint)
  const submitRes = await fetch(
    `${API_URL}/v1/wallet/user-operations/submit-prepared`,
    {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ ticketId, authProof }),
      cache: "no-store",
    }
  );
  const submitBody = await submitRes.json().catch(() => ({}));
  if (!submitRes.ok || !submitBody?.success) {
    throw new Error(
      submitBody?.error || `Bridge submit failed (${submitRes.status})`
    );
  }

  const txHash =
    submitBody.transactionHash ||
    submitBody.userOperationHash ||
    submitBody.hash ||
    "";

  return {
    success: true,
    sourceChain: args.sourceChain,
    destinationChain: args.destinationChain,
    token: args.token,
    inputAmount: args.amount,
    outputAmount: previewBody?.bridge?.outputAmount || args.amount,
    fee: previewBody?.bridge?.fee || "0",
    recipient: args.recipient || "",
    transactionHash: txHash,
    smartWalletAddress: previewBody?.smartAccountAddress || "",
    sourceChainId: previewBody?.chainId || 0,
    destinationChainId: 0,
  };
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
      // v3 (non-custodial) sandbox: two-phase preview/sign/submit.
      // Legacy one-phase would fail at signRemote because the enclave
      // demands an authProof bound to a hash the client never saw.
      if (nonCustodialConfig().enabled) {
        return await bridgeV3TwoPhase(args);
      }

      // Legacy one-phase path — v1/v2 wallets sign server-side.
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
