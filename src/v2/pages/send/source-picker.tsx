/**
 * Balance-driven "pay from" picker shared by Send, Pay and Withdraw.
 *
 * Lists every stablecoin balance (token × network), auto-selects one that
 * covers the amount (Base USDC first, then the largest), and — when no
 * single balance is enough but the total is — offers one clear "move /
 * swap first" step using the existing bridge or swap flows, after which
 * the picker re-evaluates against the refreshed balances.
 */
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, Check, Repeat, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import useAggregateBalance from "@/hooks/data/use-aggregate-balance";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { cn } from "@/lib/utils";
import { Button, EmptyState, SideSheet, Skeleton } from "@/v2/ui";
import { MoveFunds } from "@/v2/pages/bridge";
import { SwapPanel } from "@/v2/pages/swap";

export type StableToken = "USDC" | "USDT";
export interface SourceOption {
  key: string; // `${chain}:${token}`
  chain: string; // BASE, POLYGON, …
  chainLabel: string;
  token: StableToken;
  balance: number;
}

export const CHAIN_LABELS: Record<string, string> = {
  BASE: "Base",
  ETHEREUM: "Ethereum",
  POLYGON: "Polygon",
  ARBITRUM: "Arbitrum",
  CELO: "Celo",
};
export const CHAIN_IDS: Record<string, string> = { BASE: "8453", ETHEREUM: "1", POLYGON: "137", ARBITRUM: "42161", CELO: "42220" };
const TOKEN_IDS: Record<StableToken, string> = { USDC: "usd-coin", USDT: "tether" };
/** Chains the LiFi swap flow supports. */
const SWAP_CHAINS = new Set(["BASE", "POLYGON", "ARBITRUM"]);
const TOKEN_ICON: Record<StableToken, string> = {
  USDC: "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png",
};

export const sourceKey = (chain: string, token: string) => `${chain}:${token}`;

/** Stablecoin balances the user can spend, largest first (Lisk excluded). */
export function useSources(currency: SupportedCurrency = "USD") {
  const { data, isLoading, refetch } = useAggregateBalance({ currency });
  const sources = useMemo<SourceOption[]>(() => {
    if (!data?.breakdown) return [];
    return data.breakdown
      .filter((b) => b.amount > 0 && CHAIN_LABELS[b.chain])
      .map((b) => ({ key: sourceKey(b.chain, b.token), chain: b.chain, chainLabel: CHAIN_LABELS[b.chain], token: b.token as StableToken, balance: b.amount }))
      .sort((a, b) => b.balance - a.balance);
  }, [data?.breakdown]);
  return { sources, isLoading, refetch, exchangeRate: data?.exchangeRate ?? 1 };
}

/** Best single source for `needed`: Base USDC if it covers it, else the largest that does. */
export function bestSource(sources: SourceOption[], needed: number, allowed?: (s: SourceOption) => boolean) {
  const ok = sources.filter((s) => (!allowed || allowed(s)) && s.balance >= needed);
  return ok.find((s) => s.chain === "BASE" && s.token === "USDC") ?? ok[0];
}

export type TopUpPlan =
  | { kind: "bridge"; token: StableToken; from: SourceOption; to: SourceOption; amount: number }
  | { kind: "swap"; chain: string; from: SourceOption; to: SourceOption; amount: number };

/**
 * One step that gets a single balance over `needed`: bridge the same token
 * from another network, or swap the other stablecoin on the same network.
 */
export function planTopUp(sources: SourceOption[], needed: number, allowed?: (s: SourceOption) => boolean): TopUpPlan | null {
  const targets = sources.filter((s) => !allowed || allowed(s));
  let best: TopUpPlan | null = null;
  for (const to of targets) {
    const shortfall = needed - to.balance;
    if (shortfall <= 0) continue;
    // A little headroom for bridge / swap fees and rounding; bridges need ≥ 1.
    const amount = Math.max(1, Math.ceil(shortfall * 1.02 * 100) / 100);
    for (const from of sources) {
      if (from.key === to.key || from.balance < amount) continue;
      let plan: TopUpPlan | null = null;
      if (from.token === to.token && from.chain !== to.chain) plan = { kind: "bridge", token: to.token, from, to, amount };
      else if (from.chain === to.chain && from.token !== to.token && SWAP_CHAINS.has(to.chain)) plan = { kind: "swap", chain: to.chain, from, to, amount };
      if (!plan) continue;
      // Prefer topping up Base USDC, then the plan that moves the least.
      const score = (p: TopUpPlan) => (p.to.chain === "BASE" && p.to.token === "USDC" ? 0 : 1) * 1e12 + p.amount;
      if (!best || score(plan) < score(best)) best = plan;
    }
  }
  return best;
}

export function SmartSourcePicker({
  needed,
  neededLabel,
  value,
  onChange,
  allowed,
  sources,
  isLoading,
  onRefresh,
  tileExtra,
}: {
  /** Amount needed, in token units (USD). */
  needed: number;
  neededLabel?: string;
  value?: string;
  onChange: (key: string) => void;
  allowed?: (s: SourceOption) => boolean;
  sources: SourceOption[];
  isLoading: boolean;
  onRefresh: () => void;
  tileExtra?: (s: SourceOption) => ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const usable = sources.filter((s) => !allowed || allowed(s));
  const total = sources.reduce((a, s) => a + s.balance, 0);
  const best = bestSource(sources, needed, allowed);
  const plan = best ? null : planTopUp(sources, needed, allowed);
  const [sheet, setSheet] = useState<TopUpPlan | null>(null);

  // Auto-select a balance that covers the amount (keep the user's pick if it still does).
  useEffect(() => {
    const current = usable.find((s) => s.key === value);
    if (current && current.balance >= needed) return;
    if (best && best.key !== value) onChange(best.key);
  }, [best?.key, needed, value]);

  if (isLoading && sources.length === 0) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading balances">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (usable.length === 0 && !plan) {
    return (
      <EmptyState
        icon={<Wallet className="h-5 w-5" />}
        title="No funds to send"
        action={<Button onClick={() => navigate("/app/request?type=topup")}>Add funds</Button>}
      />
    );
  }

  return (
    <div>
      <ul className="space-y-2" aria-label="Pay from" data-testid="source-picker">
        {usable.map((s) => {
          const enough = s.balance >= needed;
          const selected = value === s.key;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onChange(s.key)}
                aria-pressed={selected}
                data-testid={`source-${s.chain.toLowerCase()}-${s.token.toLowerCase()}`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors cursor-pointer",
                  selected ? "bg-teal-50 ring-2 ring-accent-primary" : "bg-surface-subtle hover:bg-surface",
                  !enough && !selected && "opacity-60"
                )}
              >
                <img src={TOKEN_ICON[s.token]} alt="" className="h-8 w-8 flex-shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink">
                    {s.token} <span className="font-normal text-ink-3">on {s.chainLabel}</span>
                  </span>
                  <span className={cn("block text-[12.5px]", enough ? "text-ink-3" : "text-pending")}>
                    {enough ? "Enough for this payment" : "Not enough on its own"}
                  </span>
                  {selected && tileExtra?.(s)}
                </span>
                <span className="text-right text-[14px] font-semibold text-ink tabular-numeric">${s.balance.toFixed(2)}</span>
                {selected && <Check className="h-4 w-4 flex-shrink-0 text-accent-primary" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>

      {!best && plan && (
        <div className="mt-4 rounded-xl bg-tint-pending px-4 py-4" role="status" data-testid="move-first">
          <p className="text-[14px] font-semibold text-ink">
            {plan.kind === "bridge" ? `Move ${plan.token} to ${plan.to.chainLabel} first` : `Swap to ${plan.to.token} first`}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">
            {plan.kind === "bridge"
              ? `Your ${plan.token} is split across networks. Move $${plan.amount.toFixed(2)} from ${plan.from.chainLabel} to ${plan.to.chainLabel}, then continue.`
              : `Swap $${plan.amount.toFixed(2)} ${plan.from.token} to ${plan.to.token} on ${plan.to.chainLabel}, then continue.`}
          </p>
          <Button className="mt-3" onClick={() => setSheet(plan)}>
            {plan.kind === "bridge" ? <ArrowLeftRight className="h-4 w-4" aria-hidden="true" /> : <Repeat className="h-4 w-4" aria-hidden="true" />}
            {plan.kind === "bridge" ? "Move funds" : "Swap"}
          </Button>
        </div>
      )}
      {!best && !plan && total < needed && (
        <div className="mt-4 rounded-xl bg-tint-danger px-4 py-4" role="alert">
          <p className="text-[14px] font-semibold text-ink">Not enough balance</p>
          <p className="mt-1 text-[13px] text-ink-2">
            You need {neededLabel ?? `$${needed.toFixed(2)}`} and have ${total.toFixed(2)} in total.
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => navigate("/app/request?type=topup")}>
            Add funds
          </Button>
        </div>
      )}

      <SideSheet
        open={!!sheet}
        onClose={() => {
          setSheet(null);
          queryClient.invalidateQueries({ queryKey: ["aggregate-balance"] });
          onRefresh();
        }}
        title={sheet?.kind === "swap" ? "Swap first" : "Move funds first"}
        testId="move-first-sheet"
      >
        {sheet?.kind === "bridge" && (
          <MoveFunds
            embedded
            initial={{ sourceChain: sheet.from.chain, destChain: sheet.to.chain, token: sheet.token, amount: String(sheet.amount) }}
            onDone={() => {
              queryClient.invalidateQueries({ queryKey: ["aggregate-balance"] });
              onRefresh();
            }}
          />
        )}
        {sheet?.kind === "swap" && (
          <SwapPanel
            initial={{
              from_token: TOKEN_IDS[sheet.from.token],
              to_token: TOKEN_IDS[sheet.to.token],
              from_chain: CHAIN_IDS[sheet.chain],
              to_chain: CHAIN_IDS[sheet.chain],
              amount_in: String(sheet.amount),
            }}
          />
        )}
      </SideSheet>
    </div>
  );
}
