/**
 * Pick the stablecoin a user op should pay its gas in.
 *
 * Transfers already pay gas in the token being sent (server-side). For
 * generic calls — swaps, WalletConnect eth_sendTransaction, approvals — we
 * pass `paymasterToken` so the user pays gas in USDC (else USDT) on that
 * chain instead of Rift sponsoring it. Only when the user holds neither do
 * we fall back to sponsored gas (no paymasterToken).
 */
import rift from "./rift";

/** Canonical USDC / USDT contracts per chain (same table as the backend). */
export const STABLECOINS: Record<string, { USDC?: string; USDT?: string }> = {
  BASE: { USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" },
  ETHEREUM: { USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
  POLYGON: { USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
  ARBITRUM: { USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
  CELO: { USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" },
};

const CHAIN_BY_ID: Record<number, string> = { 8453: "BASE", 1: "ETHEREUM", 137: "POLYGON", 42161: "ARBITRUM", 42220: "CELO" };

/** Enough stablecoin to cover a typical user-op's gas. */
export const MIN_GAS_BALANCE = 1;

export function chainKey(chain: string | number): string {
  if (typeof chain === "number" || /^\d+$/.test(String(chain))) return CHAIN_BY_ID[Number(chain)] ?? String(chain);
  return String(chain).toUpperCase();
}

async function balanceOf(token: "USDC" | "USDT", chain: string): Promise<number> {
  try {
    const res: any = await rift.wallet.getTokenBalance({ token: token as any, chain: chain as any });
    return Number(res?.data?.at?.(0)?.amount ?? res?.data?.[0]?.amount ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** USDC address if held, else USDT, else undefined (sponsored). */
export async function pickPaymasterToken(chain: string | number): Promise<string | undefined> {
  const key = chainKey(chain);
  const coins = STABLECOINS[key];
  if (!coins) return undefined;
  const token = localStorage.getItem("token");
  if (token) rift.setBearerToken(token);
  if (coins.USDC && (await balanceOf("USDC", key)) >= MIN_GAS_BALANCE) return coins.USDC;
  if (coins.USDT && (await balanceOf("USDT", key)) >= MIN_GAS_BALANCE) return coins.USDT;
  return undefined;
}
