/**
 * PREMIA on-chain client. Builds REAL calldata (ethers) for every action and,
 * in "live" mode, submits it through the in-app Rift wallet as a gas-sponsored
 * user-op paid in USDC via the paymaster (lib/nonCustodial.ts `sendChainTx` —
 * the same path app-lp's swap already uses). The user is already signed in, so
 * each step is one passkey tap: no WalletConnect, no ETH, no external wallet.
 *
 * In "mock" mode nothing hits chain: the calldata is still built (so the wiring
 * is proven) and the caller applies the result to the local ledger.
 */
import { Interface, MaxUint256 } from "ethers";
import { PERP_MARKET_ABI, PRMUSD_ABI, COLLATERAL_VAULT_ABI } from "./abi";
import { PREMIA_CONFIG, isLive } from "./config";
import { to6, toWad, worstMarkWad, WAD } from "./live";
import type { Side } from "./types";

const perpIface = new Interface(PERP_MARKET_ABI as unknown as string[]);
const tokenIface = new Interface(PRMUSD_ABI as unknown as string[]);
const vaultIface = new Interface(COLLATERAL_VAULT_ABI as unknown as string[]);

export interface TxResult {
  hash: string;
  /** How gas was paid, for the receipt UI. */
  gas: "usdc-paymaster";
  mock: boolean;
}

async function submit(to: string, data: string): Promise<TxResult> {
  if (isLive()) {
    if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
      throw new Error("PREMIA is not configured for this chain yet");
    }
    // Gas sponsored + paid in USDC on Base (the paymaster picks USDC
    // automatically when the user holds some). Loaded lazily so mock mode
    // never pulls in the Rift wallet SDK.
    const { sendChainTx } = await import("@/lib/nonCustodial");
    const res = await sendChainTx(PREMIA_CONFIG.chain, { to, data });
    if (!res?.hash) throw new Error("Transaction was not submitted");
    return { hash: res.hash, gas: "usdc-paymaster", mock: false };
  }
  // Mock: synthesize a believable Base tx hash (nothing hits chain).
  return { hash: mockHash(), gas: "usdc-paymaster", mock: true };
}

function mockHash(): string {
  const h = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 64; i++) s += h[Math.floor(Math.random() * 16)];
  return s;
}

const MOCK_TO = "0x0000000000000000000000000000000000000001";

/* ── step 1: test funds ─────────────────────────────────────────────────── */

/** `prmUSD.faucet()` — mints 10,000 test prmUSD to the signed-in wallet. */
export async function faucet(): Promise<TxResult> {
  const data = tokenIface.encodeFunctionData("faucet", []);
  return submit(PREMIA_CONFIG.addresses.prmUSD || MOCK_TO, data);
}

/* ── step 2: approve → deposit ──────────────────────────────────────────── */

/**
 * `prmUSD.approve(vault, amount)`. Call once before the first deposit; pass no
 * amount for an unlimited allowance so the user never taps approve twice.
 */
export async function approveVault(amount?: number): Promise<TxResult> {
  const value = amount === undefined ? MaxUint256 : to6(amount);
  const data = tokenIface.encodeFunctionData("approve", [
    PREMIA_CONFIG.addresses.collateralVault,
    value,
  ]);
  return submit(PREMIA_CONFIG.addresses.prmUSD || MOCK_TO, data);
}

/** `CollateralVault.deposit(amountUSDC)` — 6-dp prmUSD into free balance. */
export async function depositCollateral(amount: number): Promise<TxResult> {
  const data = vaultIface.encodeFunctionData("deposit", [to6(amount)]);
  return submit(PREMIA_CONFIG.addresses.collateralVault || MOCK_TO, data);
}

/** `CollateralVault.withdraw(amountUSDC)` — free balance back to the wallet. */
export async function withdrawCollateral(amount: number): Promise<TxResult> {
  const data = vaultIface.encodeFunctionData("withdraw", [to6(amount)]);
  return submit(PREMIA_CONFIG.addresses.collateralVault || MOCK_TO, data);
}

/* ── step 3: trade ──────────────────────────────────────────────────────── */

/**
 * `PerpMarket.modifyPosition(deltaQ, worstMarkWad)`.
 *
 * `deltaQUnits` is signed in WAD units: + opens/increases a long (Rise),
 * − opens/increases a short (Fall). `markAfterWad` comes from the live
 * `quote()` so the slippage bound is anchored to the real post-fill mark.
 */
export async function modifyPosition(args: {
  marketAddress: string;
  deltaQUnits: number;
  markAfterWad: bigint;
  slippagePct?: number;
}): Promise<TxResult> {
  const bound = worstMarkWad(
    args.markAfterWad,
    args.deltaQUnits,
    args.slippagePct ?? PREMIA_CONFIG.slippagePct
  );
  const data = perpIface.encodeFunctionData("modifyPosition", [toWad(args.deltaQUnits), bound]);
  return submit(args.marketAddress || MOCK_TO, data);
}

/* ── mock-mode compatibility shims ──────────────────────────────────────── */

/**
 * Mock-mode open: the stake/odds framing the in-browser ledger uses. Live mode
 * calls {@link modifyPosition} instead (units + a quoted mark).
 */
export async function openPosition(args: {
  marketAddress: string;
  units: number;
  side: Side;
  entryOdds: number;
  slippagePct?: number;
}): Promise<TxResult> {
  const deltaQ = args.side === "rise" ? args.units : -args.units;
  const markWad = BigInt(Math.round(Math.min(0.999999, Math.max(1e-9, args.entryOdds)) * 1e6)) * (WAD / 1_000_000n);
  return modifyPosition({
    marketAddress: args.marketAddress,
    deltaQUnits: deltaQ,
    markAfterWad: markWad,
    slippagePct: args.slippagePct,
  });
}

/** Mock-mode close: send the opposite deltaQ back to zero. */
export async function closePosition(args: {
  marketAddress: string;
  units: number;
  side: Side;
  markNow: number;
}): Promise<TxResult> {
  const deltaQ = args.side === "rise" ? -args.units : args.units;
  const markWad = BigInt(Math.round(Math.min(0.999999, Math.max(1e-9, args.markNow)) * 1e6)) * (WAD / 1_000_000n);
  return modifyPosition({
    marketAddress: args.marketAddress,
    deltaQUnits: deltaQ,
    markAfterWad: markWad,
    slippagePct: 2,
  });
}
