/**
 * One ledger out of four feeds.
 *
 * The backend exposes payments through four separate endpoints (mobile
 * money deposits, on-chain deposits, payouts/offramps and on-chain
 * transfers). The console shows them as a single, date-sorted list of
 * `Payment` rows with a normalised status so tables, filters and the detail
 * drawer don't need to know which feed a row came from. Read-only: this
 * module only reshapes what the existing query hooks return.
 */
import { useMemo } from "react";
import useOnrampOrders from "@/hooks/data/use-onramp-orders";
import useWithdrawalOrders from "@/hooks/data/use-withdrawal-orders";
import useOnchainHistory from "@/hooks/data/use-onchain-history";
import { useDeposits } from "@/hooks/data/use-deposits";
import type { Status } from "@/v2/ui";

export type PaymentDirection = "in" | "out";
export type PaymentKind = "deposit" | "payout" | "transfer";

export interface Payment {
  id: string;
  kind: PaymentKind;
  direction: PaymentDirection;
  /** "M-Pesa deposit", "Payout", "Wallet transfer"… */
  title: string;
  /** Mobile money / bank / on-chain. */
  method: string;
  status: Status;
  rawStatus?: string;
  amount: number;
  currency: string;
  /** USD equivalent when known. */
  amountUsd?: number | null;
  fee?: number | null;
  counterparty?: string | null;
  reference?: string | null;
  receiptNumber?: string | null;
  txHash?: string | null;
  chain?: string | null;
  token?: string | null;
  createdAt: string;
  /** Original record, for the receipt download. */
  source: "onramp" | "offramp" | "onchain" | "deposit";
  raw: unknown;
}

export function normaliseStatus(s?: string | null): Status {
  const v = (s || "").toLowerCase();
  if (!v) return "succeeded";
  if (/(complete|success|succeed|paid|settled|confirmed|done|processed)/.test(v)) return "succeeded";
  if (/(fail|cancel|reject|expire|revers|error|declin)/.test(v)) return "failed";
  return "pending";
}

const PAYOUT_METHOD: Record<string, string> = {
  KES: "Mobile money",
  NGN: "Bank transfer",
  UGX: "Mobile money",
  TZS: "Mobile money",
  CDF: "Mobile money",
  MWK: "Mobile money",
  BRL: "PIX",
  ETB: "Mobile money",
  GHS: "Mobile money",
};

export function explorerTxUrl(hash: string, chain?: string | null) {
  switch ((chain || "").toLowerCase()) {
    case "ethereum":
      return `https://etherscan.io/tx/${hash}`;
    case "celo":
      return `https://celoscan.io/tx/${hash}`;
    case "polygon":
      return `https://polygonscan.com/tx/${hash}`;
    case "arbitrum":
      return `https://arbiscan.io/tx/${hash}`;
    case "lisk":
      return `https://blockscout.lisk.com/tx/${hash}`;
    default:
      return `https://basescan.org/tx/${hash}`;
  }
}

function titleCaseChain(c?: string | null) {
  if (!c) return null;
  return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
}

export function usePayments() {
  const onramp = useOnrampOrders();
  const offramp = useWithdrawalOrders();
  const onchain = useOnchainHistory();
  const deposits = useDeposits();

  const data = useMemo<Payment[]>(() => {
    const rows: Payment[] = [];
    const arr = <T,>(v: T[] | undefined | null) => (Array.isArray(v) ? v : []);

    for (const o of arr(onramp.data)) {
      rows.push({
        id: `onramp:${o.transactionCode || o.receipt_number || o.createdAt}`,
        kind: "deposit",
        direction: "in",
        title: "Mobile money deposit",
        method: "Mobile money",
        status: normaliseStatus(o.status),
        rawStatus: o.status,
        amount: Number(o.amount || 0),
        currency: o.currency || "KES",
        counterparty: o.public_name || null,
        reference: o.transactionCode,
        receiptNumber: o.receipt_number,
        txHash: o.transaction_hash,
        chain: o.chain,
        token: o.token,
        createdAt: o.createdAt,
        source: "onramp",
        raw: o,
      });
    }

    for (const d of arr(deposits.data)) {
      rows.push({
        id: `deposit:${d.id || d.transactionHash}`,
        kind: "deposit",
        direction: "in",
        title: "Stablecoin deposit",
        method: "On-chain",
        status: d.processed === false ? "pending" : "succeeded",
        amount: Number(d.amount || 0),
        currency: "USD",
        amountUsd: Number(d.amount || 0),
        counterparty: d.fromAddress,
        txHash: d.transactionHash,
        chain: "base",
        token: "USDC",
        createdAt: d.createdAt,
        source: "deposit",
        raw: d,
      });
    }

    for (const o of arr(offramp.data)) {
      const currency = o.currency || "KES";
      rows.push({
        id: `offramp:${o.id || o.transactionCode}`,
        kind: "payout",
        direction: "out",
        title: "Payout",
        method: PAYOUT_METHOD[currency] || "Payout",
        status: normaliseStatus(o.status),
        rawStatus: o.status,
        amount: Number(o.amount || 0),
        currency,
        amountUsd: o.usdcDeducted ?? null,
        fee: o.fee ?? null,
        counterparty: o.public_name || null,
        reference: o.transactionCode,
        receiptNumber: o.receipt_number,
        txHash: o.transaction_hash,
        chain: o.chain,
        token: o.token,
        createdAt: o.createdAt,
        source: "offramp",
        raw: o,
      });
    }

    for (const t of arr(onchain.data)) {
      const isPhone = /^\+?\d{6,}$/.test(t.recipientAddress || "");
      rows.push({
        id: `onchain:${t.id || t.transactionHash}`,
        kind: "transfer",
        direction: t.type === "receive" ? "in" : "out",
        title: t.type === "receive" ? "Wallet transfer received" : isPhone ? "Mobile money transfer" : "Wallet transfer",
        method: `On-chain${t.chain ? ` · ${titleCaseChain(t.chain)}` : ""}`,
        status: t.transactionHash ? "succeeded" : "pending",
        amount: Number(t.amount || 0),
        currency: (t.token || "USDC").toUpperCase(),
        amountUsd: /^(USDC|USDT)$/i.test(t.token || "") ? Number(t.amount || 0) : null,
        counterparty: t.recipientAddress,
        txHash: t.transactionHash,
        chain: t.chain,
        token: t.token,
        createdAt: t.createdAt,
        source: "onchain",
        raw: t,
      });
    }

    return rows
      .filter((r) => r.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [onramp.data, offramp.data, onchain.data, deposits.data]);

  const isLoading = onramp.isLoading || offramp.isLoading || onchain.isLoading || deposits.isLoading;
  return { data, isLoading };
}
