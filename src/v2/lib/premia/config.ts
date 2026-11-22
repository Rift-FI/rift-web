/**
 * PREMIA on-chain config — config-driven addresses + RPC.
 *
 * The Base-mainnet beta deployment is baked in as the DEFAULT so a signed-in
 * Rift user sees live markets with no extra setup; every value can still be
 * overridden by env (see .env.premia.example) without a code change.
 *
 * Collateral is prmUSD (PREMIA Mock USD), a 6-dp ERC-20 with a public faucet
 * (10,000 prmUSD per call, 24h cooldown). Gas is sponsored and paid in USDC via
 * Rift's paymaster (see lib/paymaster.ts + lib/nonCustodial.ts `sendChainTx`) —
 * never in ETH.
 *
 * MODE:
 *   - "live" (default): reads come from the contracts over JSON-RPC and every
 *     action is submitted through the in-app Rift wallet as a gas-sponsored
 *     (USDC) user-op. One passkey tap per step, no WalletConnect.
 *   - "mock": trades/faucet/cash-out run against an in-browser mock of the
 *     contracts (deterministic market data + a local position ledger). Nothing
 *     hits chain; the exact calldata that WOULD be sent is still built via
 *     ethers so the live path is a one-line switch.
 */
const env = import.meta.env;

export type PremiaMode = "mock" | "live";

const str = (v: unknown, fallback: string) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;

/**
 * Base RPCs, in priority order. NOTE: base.llamarpc.com is deliberately absent —
 * it returns 525s and falsely reports deployed contracts as having no code.
 */
const DEFAULT_RPCS = [
  "https://base-rpc.publicnode.com",
  "https://base.drpc.org",
  "https://mainnet.base.org",
];

function rpcUrls(): string[] {
  const list = str(env.VITE_PREMIA_RPC_URLS, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = str(env.VITE_PREMIA_RPC_URL, "");
  const preferred = [...list, ...(single ? [single] : [])];
  // keep the defaults as fallbacks behind anything explicitly configured
  return [...new Set([...preferred, ...DEFAULT_RPCS])];
}

export const PREMIA_CONFIG = {
  /** "live" (default) or "mock". */
  mode: (str(env.VITE_PREMIA_MODE, "live") as PremiaMode) === "mock" ? "mock" : ("live" as PremiaMode),

  /** Base mainnet (Rift's chain). The wallet signs sponsored user-ops here. */
  chain: "BASE" as const,
  chainId: 8453,
  /** First RPC is used for reads; the rest are automatic fallbacks. */
  rpcUrls: rpcUrls(),
  get rpcUrl() {
    return this.rpcUrls[0];
  },

  /** Rift USDC on Base — the token gas is paid in via the paymaster. */
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",

  /** PREMIA core contracts on Base mainnet (beta deployment, 2026-11-22). */
  addresses: {
    prmUSD: str(env.VITE_PREMIA_PRMUSD, "0x7152280AfE7493d84533565Cd5c79B5d4B4EC4CB"),
    collateralVault: str(env.VITE_PREMIA_VAULT, "0x127048434EfD4ac79e5E4ff41E1c6e3d5Fd0279A"),
    marketFactory: str(env.VITE_PREMIA_FACTORY, "0xf9CFf47DE2E6bEAA5F32Cf2090E35aC3B829c3A8"),
    oracleAdapter: str(env.VITE_PREMIA_ORACLE, "0x93D1dbAC87AcCf85C3070eEdD9EeD0Ad699b7090"),
    feeSplitter: str(env.VITE_PREMIA_FEE_SPLITTER, "0x17CA473D42131CB27C1BA129A4404a2FF0140f81"),
    settlementKeeper: str(env.VITE_PREMIA_KEEPER, "0xA10042C12F0ADE1CAF928F023799F6F594C4236b"),
  },

  /**
   * Block the contracts went live. Used as the lower bound for the event scans
   * that build real fill history / oracle history (keeps eth_getLogs cheap).
   */
  deployBlock: Number(env.VITE_PREMIA_DEPLOY_BLOCK) || 60_887_800,

  /** prmUSD faucet drip size (test funds), in whole prmUSD. Contract: 10,000. */
  faucetAmount: Number(env.VITE_PREMIA_FAUCET_AMOUNT) || 10_000,

  /** Default slippage tolerance on the mark, in percent. */
  slippagePct: Number(env.VITE_PREMIA_SLIPPAGE_PCT) || 1,

  explorer: "https://basescan.org",
};

export const isLive = () => PREMIA_CONFIG.mode === "live";

export const txUrl = (hash: string) => `${PREMIA_CONFIG.explorer}/tx/${hash}`;
export const addressUrl = (a: string) => `${PREMIA_CONFIG.explorer}/address/${a}`;
