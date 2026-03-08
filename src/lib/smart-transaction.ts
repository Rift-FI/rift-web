/**
 * Smart Transaction Planner
 *
 * Given a USD amount needed for withdraw/pay, plans the optimal steps:
 * 1. Use Base USDC first
 * 2. If insufficient, bridge USDC from other chains to Base
 * 3. If still insufficient, use USDT (bridge to Base if needed)
 * 4. Split into multiple offramp calls if using both USDC and USDT
 */

import type { ChainTokenBalance } from "@/hooks/data/use-aggregate-balance";

export type TransactionStepType = "bridge" | "withdraw" | "pay";

export interface BridgeStep {
  type: "bridge";
  token: "USDC" | "USDT";
  fromChain: string;
  toChain: "BASE";
  amount: number;
  status: "pending" | "executing" | "done" | "failed";
}

export interface OfframpStep {
  type: "withdraw" | "pay";
  token: "USDC" | "USDT";
  chain: "base";
  amount: number; // USD amount
  currency: string;
  recipient: string;
  status: "pending" | "executing" | "done" | "failed";
}

export type TransactionStep = BridgeStep | OfframpStep;

export interface TransactionPlan {
  /** Unique ID for this plan */
  id: string;
  /** Total USD amount requested */
  totalAmount: number;
  /** All steps to execute in order */
  steps: TransactionStep[];
  /** Whether this requires bridging */
  requiresBridge: boolean;
  /** Whether this splits across USDC and USDT */
  isSplit: boolean;
  /** Overall status */
  status: "planned" | "executing" | "done" | "failed";
  /** Human-readable summary */
  summary: string;
  /** Created timestamp */
  createdAt: number;
}

/**
 * Plan a smart transaction to cover the required USD amount.
 *
 * @param usdAmountNeeded - USD amount to send to backend (without fee)
 * @param breakdown - Per-chain-token balances
 * @param txType - "withdraw" or "pay"
 * @param currency - Local currency code
 * @param recipient - Recipient string for the offramp call
 * @param usdAmountWithFee - Total USD the user needs on Base (amount + fee). If not provided, uses usdAmountNeeded.
 */
export function planTransaction(
  usdAmountNeeded: number,
  breakdown: ChainTokenBalance[],
  txType: "withdraw" | "pay",
  currency: string,
  recipient: string,
  usdAmountWithFee?: number
): TransactionPlan | { error: string } {
  const steps: TransactionStep[] = [];
  // Plan bridging based on total needed (including fee), but offramp sends amount without fee
  const totalNeeded = usdAmountWithFee ?? usdAmountNeeded;
  let remaining = totalNeeded;

  // Helper: get balance for a specific token+chain
  const getBalance = (token: "USDC" | "USDT", chain: string) =>
    breakdown.find((b) => b.token === token && b.chain === chain)?.amount ?? 0;

  // Step 1: Use Base USDC first
  const baseUsdc = getBalance("USDC", "BASE");
  const usdcFromBase = Math.min(baseUsdc, remaining);
  remaining -= usdcFromBase;

  // Step 2: If still need more, bridge USDC from other chains
  const otherChains = ["ETHEREUM", "ARBITRUM", "POLYGON"] as const;
  const usdcBridges: BridgeStep[] = [];

  if (remaining > 0) {
    for (const chain of otherChains) {
      if (remaining <= 0) break;
      const bal = getBalance("USDC", chain);
      if (bal <= 0) continue;
      const bridgeAmount = Math.min(bal, remaining);
      usdcBridges.push({
        type: "bridge",
        token: "USDC",
        fromChain: chain,
        toChain: "BASE",
        amount: bridgeAmount,
        status: "pending",
      });
      remaining -= bridgeAmount;
    }
  }

  // Total USDC we can use (base + bridged)
  const totalUsdcAvailable = usdcFromBase + usdcBridges.reduce((s, b) => s + b.amount, 0);

  // Step 3: If USDC isn't enough, use USDT
  let usdtFromBase = 0;
  const usdtBridges: BridgeStep[] = [];

  if (remaining > 0) {
    // Base USDT first
    const baseUsdt = getBalance("USDT", "BASE");
    usdtFromBase = Math.min(baseUsdt, remaining);
    remaining -= usdtFromBase;

    // Bridge USDT from other chains
    if (remaining > 0) {
      for (const chain of otherChains) {
        if (remaining <= 0) break;
        const bal = getBalance("USDT", chain);
        if (bal <= 0) continue;
        const bridgeAmount = Math.min(bal, remaining);
        usdtBridges.push({
          type: "bridge",
          token: "USDT",
          fromChain: chain,
          toChain: "BASE",
          amount: bridgeAmount,
          status: "pending",
        });
        remaining -= bridgeAmount;
      }
    }
  }

  const totalUsdtAvailable = usdtFromBase + usdtBridges.reduce((s, b) => s + b.amount, 0);

  // Not enough funds across everything
  if (remaining > 0) {
    return {
      error: `Insufficient balance. You need $${usdAmountNeeded.toFixed(2)} but only have $${(totalUsdcAvailable + totalUsdtAvailable).toFixed(2)} across all chains.`,
    };
  }

  const isSplit = totalUsdcAvailable > 0 && totalUsdtAvailable > 0;
  const requiresBridge = usdcBridges.length > 0 || usdtBridges.length > 0;

  // Build step list: bridges first, then offramp calls
  // USDC bridges
  steps.push(...usdcBridges);
  // USDT bridges
  steps.push(...usdtBridges);

  // Offramp amounts: send usdAmountNeeded (without fee) to backend — backend deducts fee.
  // If split, proportion the send amount based on how much each token contributed.
  const totalSourced = totalUsdcAvailable + totalUsdtAvailable;
  const usdcOfframpAmount = isSplit
    ? Math.round((totalUsdcAvailable / totalSourced) * usdAmountNeeded * 1e6) / 1e6
    : usdAmountNeeded;
  const usdtOfframpAmount = isSplit
    ? Math.round((usdAmountNeeded - usdcOfframpAmount) * 1e6) / 1e6
    : usdAmountNeeded;

  // USDC offramp (if we're using any USDC)
  if (totalUsdcAvailable > 0) {
    steps.push({
      type: txType,
      token: "USDC",
      chain: "base",
      amount: usdcOfframpAmount,
      currency,
      recipient,
      status: "pending",
    });
  }

  // USDT offramp (if we're using any USDT)
  if (totalUsdtAvailable > 0) {
    steps.push({
      type: txType,
      token: "USDT",
      chain: "base",
      amount: usdtOfframpAmount,
      currency,
      recipient,
      status: "pending",
    });
  }

  // Build summary
  let summary = "";
  if (!requiresBridge && !isSplit) {
    summary = `${txType === "withdraw" ? "Withdraw" : "Pay"} $${usdAmountNeeded.toFixed(2)} from Base USDC`;
  } else if (requiresBridge && !isSplit) {
    const token = totalUsdcAvailable > 0 ? "USDC" : "USDT";
    summary = `Bridge ${token} to Base, then ${txType} $${usdAmountNeeded.toFixed(2)}`;
  } else {
    summary = `Split: $${totalUsdcAvailable.toFixed(2)} USDC + $${totalUsdtAvailable.toFixed(2)} USDT${requiresBridge ? " (bridging required)" : ""}`;
  }

  return {
    id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    totalAmount: usdAmountNeeded,
    steps,
    requiresBridge,
    isSplit,
    status: "planned",
    summary,
    createdAt: Date.now(),
  };
}

// LocalStorage key for tracking active transactions
const STORAGE_KEY = "rift_active_transactions";

export function saveTransactionPlan(plan: TransactionPlan) {
  const existing = getActiveTransactions();
  existing.push(plan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function updateTransactionPlan(plan: TransactionPlan) {
  const existing = getActiveTransactions();
  const idx = existing.findIndex((t) => t.id === plan.id);
  if (idx >= 0) existing[idx] = plan;
  else existing.push(plan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getActiveTransactions(): TransactionPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const plans: TransactionPlan[] = JSON.parse(raw);
    // Clean up old completed/failed plans (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return plans.filter(
      (p) => p.status === "executing" || p.status === "planned" || p.createdAt > oneHourAgo
    );
  } catch {
    return [];
  }
}

export function clearTransaction(id: string) {
  const existing = getActiveTransactions();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing.filter((t) => t.id !== id))
  );
}
