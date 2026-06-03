import { useQuery, keepPreviousData } from "@tanstack/react-query";
import rift from "@/lib/rift";

/**
 * Live gas-fee preview for an on-chain transfer (USDC/USDT via paymaster,
 * or native ETH/MATIC/etc.).
 *
 * Why this hook exists: on chains where the paymaster's gas fee in the
 * token being sent is non-trivial (Ethereum mainnet most painfully), a
 * user with exactly enough USDC to send the amount BUT not enough for
 * the gas hits a silent "paymaster rejected" failure. The fix:
 *
 *   1. Before the Send button is enabled, fetch `rift.transactions.getFee()`.
 *   2. Show "send X, gas Y, total Z".
 *   3. Hard-block submission if `sufficient` is false; tell the user
 *      exactly how much more they need ("Need 0.42 more USDC for gas").
 *
 * The endpoint is the same one used by offramp/pay confirmation balance
 * checks (just gas-aware now — backend re-routes ERC-20 estimates through
 * the smart-wallet's /api/estimate-fee endpoint).
 */
export interface TransactionFeeBreakdown {
  /**
   * Combined fee in the same token: paymaster gas + Rift markup
   * + project markup. Use this for the balance gate (it's what
   * the smart-wallet will actually charge beyond `sendAmount`).
   */
  gasFeeInToken: string;
  /**
   * Just the paymaster's portion (pure network gas, no markup).
   * Optional — older backends only return `gasFeeInToken`.
   * Use this for a clean "Network fee" display row when shown
   * alongside a separate service-fee/markup row.
   */
  paymasterFeeInToken?: string;
  /** Echoed send amount. */
  sendAmount: string;
  /** sendAmount + gasFeeInToken — what the wallet must hold. */
  totalNeeded: string;
  /** Current token balance of the user's smart account. */
  tokenBalance: string | null;
  /** Whether tokenBalance >= totalNeeded. May be null if backend couldn't
   *  resolve balance (e.g. native-asset path without the user address). */
  sufficient: boolean | null;
  /** totalNeeded - tokenBalance when not sufficient, else "0". */
  deficit: string;
  /** Token symbol the fee is denominated in. */
  token: string;
  /** Chain key (BASE, POLYGON, …) — for display only. */
  chain?: string;
  /**
   * `true` when the precise gas simulation failed and the backend
   * returned a heuristic estimate. UI should label the gas number
   * with "(approx)" or similar so the user knows it's not exact.
   */
  degraded?: boolean;
  /** Reason the precise simulation failed (degraded only). */
  degradedReason?: string;
}

export interface TransactionFeeArgs {
  recipient: string;
  amount: string | number;
  chain: string;
  token: string;
}

/**
 * Convert the SDK's TransactionFeeResponse into a clean breakdown.
 * Tolerates the legacy 2-field shape (no rich fields) by surfacing the
 * gas-only number and leaving `sufficient: null` — callers must treat
 * `sufficient === null` as "unknown" (don't hard-block).
 */
function normalize(
  response: any,
  fallbackAmount: string
): TransactionFeeBreakdown {
  const sendAmount = String(response.sendAmount ?? fallbackAmount);
  const gasFeeInToken = String(
    response.gasFeeInToken ?? response.amount ?? "0"
  );
  const totalNeeded = String(
    response.totalNeeded ?? Number(sendAmount) + Number(gasFeeInToken)
  );
  return {
    gasFeeInToken,
    paymasterFeeInToken:
      response.paymasterFeeInToken != null
        ? String(response.paymasterFeeInToken)
        : undefined,
    sendAmount,
    totalNeeded,
    tokenBalance: response.tokenBalance ?? null,
    sufficient: typeof response.sufficient === "boolean" ? response.sufficient : null,
    deficit: String(response.deficit ?? "0"),
    token: String(response.token ?? ""),
    chain: response.chain,
    degraded: response.degraded === true,
    degradedReason: response.degradedReason,
  };
}

/**
 * Hook returning the live fee preview. Re-fetches when args change and
 * keeps the previous value visible during refetches so the UI doesn't
 * flicker between renders.
 */
export function useTransactionFee(
  args: TransactionFeeArgs | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      "transaction-fee",
      args?.chain,
      args?.token,
      args?.recipient,
      args?.amount,
    ],
    queryFn: async (): Promise<TransactionFeeBreakdown> => {
      if (!args) throw new Error("transaction-fee: args required");
      // Debug: log the request + raw response so we can verify the
      // backend → smart-wallet estimate path end-to-end from the
      // browser console. Remove once the gas row is confirmed live.
      // eslint-disable-next-line no-console
      console.log("[useTransactionFee] request →", {
        recipient: args.recipient,
        amount: String(args.amount),
        chain: args.chain,
        token: args.token,
      });
      try {
        const response = await rift.transactions.getFee({
          recipient: args.recipient,
          amount: String(args.amount),
          chain: args.chain,
          token: args.token,
        });
        // eslint-disable-next-line no-console
        console.log("[useTransactionFee] raw response ←", response);
        const normalized = normalize(response, String(args.amount));
        // eslint-disable-next-line no-console
        console.log("[useTransactionFee] normalized ←", normalized);
        return normalized;
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error("[useTransactionFee] ERROR", {
          message: err?.message,
          status: err?.response?.status,
          data: err?.response?.data,
          stack: err?.stack,
        });
        throw err;
      }
    },
    enabled:
      enabled &&
      !!args &&
      !!args.recipient &&
      !!args.chain &&
      !!args.token &&
      Number(args?.amount ?? 0) > 0,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
    retryDelay: (a) => Math.min(1000 * 2 ** a, 4000),
    placeholderData: keepPreviousData,
  });
}

export default useTransactionFee;
