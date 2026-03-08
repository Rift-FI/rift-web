/**
 * WalletConnect Core API Integration
 * Transactions are queued as pending requests — user must approve or reject.
 */

export interface WCPairResult {
  success: boolean;
  topic?: string;
  smartWalletAddress?: string;
  chain?: string;
  chainId?: number;
  peerName?: string;
  peerUrl?: string;
  error?: string;
}

export interface ActiveSession {
  topic: string;
  smartWalletAddress: string;
  chainId: number;
  peerName: string;
  peerUrl: string;
}

// Supported chains for WalletConnect pairing
export const WC_SUPPORTED_CHAINS = [
  { value: "BASE", label: "Base", chainId: 8453 },
  { value: "ETHEREUM", label: "Ethereum", chainId: 1 },
  { value: "ARBITRUM", label: "Arbitrum", chainId: 42161 },
  { value: "POLYGON", label: "Polygon", chainId: 137 },
  { value: "BSC", label: "BNB Chain", chainId: 56 },
  { value: "AVAX", label: "Avalanche", chainId: 43114 },
  { value: "BERACHAIN", label: "Berachain", chainId: 80094 },
  { value: "LISK", label: "Lisk", chainId: 1135 },
] as const;

export type WCSupportedChain = (typeof WC_SUPPORTED_CHAINS)[number]["value"];

// Chain ID to name mapping (for display)
export const CHAIN_ID_NAMES: Record<number, string> = Object.fromEntries(
  WC_SUPPORTED_CHAINS.map((c) => [c.chainId, c.label])
);

// API Configuration
const API_BASE = "https://payment.riftfi.xyz";
const WC_BASE = `${API_BASE}/walletconnect`;

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_SDK_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_SDK_API_KEY is required for WalletConnect operations");
  }
  return apiKey;
};

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "x-api-key": getApiKey(),
});

/**
 * Pair with a DApp using a WalletConnect URI.
 */
export async function pairWithDApp(
  uri: string,
  chain: WCSupportedChain,
  token: string
): Promise<WCPairResult> {
  try {
    const response = await fetch(`${WC_BASE}/pair`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ uri, chain }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Pairing failed",
      };
    }

    return {
      success: true,
      topic: data.topic,
      smartWalletAddress: data.smartWalletAddress,
      chain: data.chain,
      chainId: data.chainId,
      peerName: data.peerName,
      peerUrl: data.peerUrl,
    };
  } catch {
    return {
      success: false,
      error: "Network error — check your connection",
    };
  }
}

/**
 * List all active WalletConnect sessions.
 */
export async function getActiveSessions(
  token: string
): Promise<ActiveSession[]> {
  try {
    const response = await fetch(`${WC_BASE}/sessions`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const sessions = data?.data?.sessions || data?.sessions || [];

    if (!Array.isArray(sessions)) return [];

    return sessions.map((s: any) => ({
      topic: s.topic,
      smartWalletAddress: s.smartWalletAddress || "",
      chainId: s.chainId || 0,
      peerName: s.peerName || s.dappName || "Unknown DApp",
      peerUrl: s.peerUrl || s.dappUrl || "",
    }));
  } catch {
    return [];
  }
}

/**
 * Disconnect a WalletConnect session.
 */
export async function disconnectSession(
  topic: string,
  token: string
): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/sessions/${topic}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Transaction request from a connected DApp.
 */
export interface TransactionRequest {
  id: number;
  topic: string;
  method: string;
  params: unknown;
  peerName: string;
  chainId: number;
  smartWalletAddress: string;
  createdAt: string;
}

/**
 * Get pending transaction requests that need approval.
 */
export async function getPendingRequests(
  token: string
): Promise<TransactionRequest[]> {
  try {
    const response = await fetch(`${WC_BASE}/requests`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data?.requests || data?.requests || [];
  } catch {
    return [];
  }
}

/**
 * Approve a pending transaction request.
 */
export async function approveRequest(
  requestId: number,
  token: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const response = await fetch(`${WC_BASE}/requests/${requestId}/approve`, {
      method: "POST",
      headers: getHeaders(token),
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, result: data?.data?.result };
    }
    return { success: false, error: data.message || data.error || "Approval failed" };
  } catch {
    return { success: false, error: "Network error" };
  }
}

/**
 * Reject a pending transaction request.
 */
export async function rejectRequest(
  requestId: number,
  token: string
): Promise<boolean> {
  try {
    const response = await fetch(`${WC_BASE}/requests/${requestId}/reject`, {
      method: "POST",
      headers: getHeaders(token),
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export function formatMethod(method: string): string {
  const names: Record<string, string> = {
    eth_sendTransaction: "Send Transaction",
    personal_sign: "Sign Message",
    eth_sign: "Sign Message",
    eth_signTypedData: "Sign Typed Data",
    eth_signTypedData_v4: "Sign Typed Data",
    eth_signTransaction: "Sign Transaction",
  };
  return names[method] || method;
}

/**
 * Validate a WalletConnect URI.
 */
export function validateWCURI(uri: string): boolean {
  if (!uri || typeof uri !== "string") return false;
  return uri.startsWith("wc:");
}

/**
 * Error handler for user-friendly messages.
 */
export function handleWCError(error: string): string {
  if (error.includes("URI") || error.includes("uri"))
    return "Invalid or expired link. Get a new one from the DApp.";
  if (error.includes("chain") || error.includes("Chain"))
    return "This chain is not supported yet.";
  if (error.includes("expired"))
    return "The link expired. Get a new one from the DApp.";
  if (error.includes("rejected"))
    return "The DApp rejected the connection.";
  return error || "Something went wrong. Please try again.";
}
