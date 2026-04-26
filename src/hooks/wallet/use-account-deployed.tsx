import { useQuery } from "@tanstack/react-query";

/**
 * localStorage cache for deployment status.
 *
 * Smart-account deployment is a one-way state change — once an ERC-4337 account
 * has bytecode at its address, it never reverts. So whenever we observe
 * `isDeployed === true`, we persist it indefinitely and skip future RPC calls
 * for that (chain, address) pair. Subsequent app loads return the answer
 * synchronously from disk — no network, no race conditions, no "false
 * negatives" if a public RPC happens to be having a bad day.
 *
 * We never persist `false`. If the account isn't deployed yet today, it might
 * be deployed tomorrow — keep checking.
 */
const CACHE_PREFIX = "rift:deployed:";
const cacheKey = (chain: string, address: string) =>
  `${CACHE_PREFIX}${chain}:${address.toLowerCase()}`;

function readDeployedFromCache(
  chain: string | undefined | null,
  address: string | null
): boolean {
  if (!chain || !address) return false;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(cacheKey(chain, address)) === "1";
  } catch {
    return false;
  }
}

function writeDeployedToCache(chain: string, address: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(chain, address), "1");
  } catch {
    // localStorage may be disabled (private browsing, full disk). Best-effort.
  }
}

/**
 * Imperative helper for callers that just successfully completed a send/userop
 * on a given chain. The very fact that the user-op was signed and bundled
 * means the account is now deployed there, so we mark the cache eagerly —
 * no need to wait for a future eth_getCode round-trip to confirm.
 */
export function markAccountDeployed(chain: string | undefined | null) {
  if (!chain) return;
  if (typeof window === "undefined") return;
  const address = window.localStorage.getItem("address");
  if (!address) return;
  writeDeployedToCache(chain, address);
}

/**
 * Public-RPC endpoints we ping with `eth_getCode` to determine whether the
 * user's smart account is deployed on a chain.
 *
 * For each chain we list BOTH the mainnet and the corresponding testnet
 * endpoint. The hook queries every URL in parallel and considers the account
 * deployed if ANY of them return non-empty bytecode.
 *
 * Why both? The Rift SDK is configured against `Environment.DEVELOPMENT`,
 * which uses testnets (Sepolia, Base Sepolia, Polygon Amoy, etc.), and a
 * counterfactual ERC-4337 account has the same address on every EVM chain.
 * Hitting only mainnet would always report "not deployed" in dev. Hitting
 * only testnet would always report "not deployed" in prod. Querying both
 * avoids the env-mismatch problem with no extra config.
 *
 * Keyed by both numeric chain id (e.g. "8453") and backend name (e.g. "BASE").
 */
const ETHEREUM_RPCS = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
  "https://rpc.flashbots.net",
  "https://ethereum-sepolia-rpc.publicnode.com",
];
const BASE_RPCS = [
  "https://mainnet.base.org",
  "https://base.publicnode.com",
  "https://base.drpc.org",
  "https://sepolia.base.org",
];
const POLYGON_RPCS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon-rpc.com",
  "https://polygon.drpc.org",
  "https://rpc-amoy.polygon.technology",
];
const ARBITRUM_RPCS = [
  "https://arbitrum-one-rpc.publicnode.com",
  "https://arb1.arbitrum.io/rpc",
  "https://arbitrum.drpc.org",
  "https://sepolia-rollup.arbitrum.io/rpc",
];
const CELO_RPCS = [
  "https://forno.celo.org",
  "https://celo.drpc.org",
  "https://alfajores-forno.celo-testnet.org",
];

const CHAIN_RPCS: Record<string, string[]> = {
  "1": ETHEREUM_RPCS,
  "8453": BASE_RPCS,
  "137": POLYGON_RPCS,
  "42161": ARBITRUM_RPCS,
  "42220": CELO_RPCS,

  ETHEREUM: ETHEREUM_RPCS,
  BASE: BASE_RPCS,
  POLYGON: POLYGON_RPCS,
  ARBITRUM: ARBITRUM_RPCS,
  CELO: CELO_RPCS,
};

/**
 * Friendly chain label shown in user-facing messages. Keep these casual —
 * the goal is "first transfer on Polygon" rather than "POLYGON" or "137".
 */
export const FRIENDLY_CHAIN_LABEL: Record<string, string> = {
  "1": "Ethereum",
  "8453": "Base",
  "137": "Polygon",
  "42161": "Arbitrum",
  "42220": "Celo",
  ETHEREUM: "Ethereum",
  BASE: "Base",
  POLYGON: "Polygon",
  ARBITRUM: "Arbitrum",
  CELO: "Celo",
};

async function checkOneRpc(rpcUrl: string, address: string): Promise<boolean> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getCode",
      params: [address, "latest"],
      id: 1,
    }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status} ${res.statusText}`);
  const json = await res.json();
  const code = json?.result;
  // "0x" (or empty) means no contract deployed at the address yet.
  return typeof code === "string" && code !== "0x" && code.length > 2;
}

/**
 * Race the available RPCs in parallel — the account is considered deployed
 * if ANY endpoint returns non-empty bytecode. Failures from individual
 * endpoints are swallowed; we only fail the whole check when every endpoint
 * either errored or returned "0x".
 */
async function fetchIsDeployed(rpcUrls: string[], address: string): Promise<boolean> {
  const results = await Promise.allSettled(
    rpcUrls.map((url) => checkOneRpc(url, address))
  );
  // Found code anywhere → deployed.
  if (results.some((r) => r.status === "fulfilled" && r.value === true)) {
    return true;
  }
  // If at least one endpoint succeeded and they all said "no code", trust that.
  const anySucceeded = results.some((r) => r.status === "fulfilled");
  if (anySucceeded) return false;
  // Every endpoint errored — treat as unknown by throwing so the query can
  // retry; React Query then reports isError without falsely claiming "deployed".
  throw new Error("All RPC endpoints failed for deployment check");
}

interface UseAccountDeployedResult {
  /**
   * `true` when the smart account already has bytecode on the given chain.
   * `false` when it doesn't. `undefined` while loading or when we couldn't
   * resolve the chain (treat undefined as "unknown — be safe").
   */
  isDeployed: boolean | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Friendly label for the chain (e.g. "Base"), or `null` if not mapped. */
  chainLabel: string | null;
  /** Whether we can even check this chain (i.e. we have an RPC for it). */
  isCheckable: boolean;
}

/**
 * Returns whether the user's ERC-4337 smart account is deployed on a chain.
 *
 * The first transaction on any new chain triggers account deployment, which
 * adds a one-time gas overhead. Callers use this signal to decide whether to
 * enforce a deployment-cost minimum (e.g. $3) on the first transfer.
 */
export default function useAccountDeployed(
  chain: string | undefined | null
): UseAccountDeployedResult {
  const address =
    typeof window !== "undefined" ? localStorage.getItem("address") : null;
  const rpcs = chain ? CHAIN_RPCS[chain] : undefined;
  const chainLabel = chain ? FRIENDLY_CHAIN_LABEL[chain] ?? null : null;

  // Synchronous cache lookup — if we've ever seen this account deployed on
  // this chain, return immediately without touching the network.
  const cached = readDeployedFromCache(chain, address);

  const query = useQuery({
    queryKey: ["account-deployed", chain, address],
    enabled:
      !cached && // skip RPC entirely on cache hit
      !!rpcs &&
      rpcs.length > 0 &&
      !!address,
    queryFn: async () => {
      const result = await fetchIsDeployed(rpcs!, address!);
      // Persist `true` results forever (deployment is one-way).
      // Don't persist `false` — the user may deploy on this chain later.
      if (result === true && chain && address) {
        writeDeployedToCache(chain, address);
      }
      return result;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  return {
    isDeployed: cached ? true : query.data,
    isLoading: !cached && query.isLoading,
    isError: !cached && query.isError,
    chainLabel,
    isCheckable: !!(rpcs && rpcs.length > 0),
  };
}
