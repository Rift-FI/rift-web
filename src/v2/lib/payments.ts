/**
 * Activity: one list of every money movement.
 *
 * Source of truth is the backend ledger (`GET /v1/ledger`), whose entries
 * carry the app-facing status vocabulary. While a backend without the
 * ledger is still deployed, we fall back to the older per-feed endpoints
 * (onramps, payouts, transfers, deposits) and translate their statuses.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useOnrampOrders from "@/hooks/data/use-onramp-orders";
import useWithdrawalOrders from "@/hooks/data/use-withdrawal-orders";
import useOnchainHistory from "@/hooks/data/use-onchain-history";
import { useDeposits } from "@/hooks/data/use-deposits";
import { riftRequest } from "@/lib/nonCustodial";
import { toAppStatus, type AppStatus } from "./status";

export type PaymentDirection = "in" | "out";
export type PaymentKind = "deposit" | "payout" | "transfer" | "swap" | "other";

export interface Payment {
  id: string;
  kind: PaymentKind;
  direction: PaymentDirection;
  /** "Added funds", "Sent to M-Pesa", "Wallet transfer"… */
  title: string;
  /** Mobile money / bank / on-chain. */
  method: string;
  status: AppStatus;
  rawStatus?: string;
  amount: number;
  currency: string;
  /** USD equivalent when known. */
  amountUsd?: number | null;
  fee?: number | null;
  feeCurrency?: string | null;
  counterparty?: string | null;
  reference?: string | null;
  receiptNumber?: string | null;
  txHash?: string | null;
  chain?: string | null;
  token?: string | null;
  fiatAmount?: number | null;
  fiatCurrency?: string | null;
  createdAt: string;
  source: "ledger" | "onramp" | "offramp" | "onchain" | "deposit";
  raw: unknown;
}

/* ── Ledger ───────────────────────────────────────────────────────── */

export interface LedgerEntry {
  id: string;
  createdAt: string;
  type: "onramp" | "offramp" | "transfer_out" | "transfer_in" | "swap" | "bridge" | "walletconnect" | "payment_link" | "fee" | "other";
  direction: "credit" | "debit";
  status: string;
  providerStatus?: string;
  amount: number | string;
  token?: string;
  chain?: string;
  fiatAmount?: number | string | null;
  fiatCurrency?: string | null;
  fee?: number | string | null;
  feeToken?: string | null;
  counterparty?: { address?: string; phone?: string; bankName?: string; accountNumber?: string; accountName?: string; till?: string; paybill?: string } | null;
  reference?: string | null;
  txHash?: string | null;
  provider?: string | null;
}

const LEDGER_TITLE: Record<LedgerEntry["type"], [string, string]> = {
  onramp: ["Added funds", "Bank / mobile money"],
  offramp: ["Payout", "Mobile money / bank"],
  transfer_out: ["Sent", "Wallet transfer"],
  transfer_in: ["Received", "Wallet transfer"],
  swap: ["Swap", "Swap"],
  bridge: ["Moved funds", "Between networks"],
  walletconnect: ["App transaction", "WalletConnect"],
  payment_link: ["Payment link paid", "Payment link"],
  fee: ["Fee", "Fee"],
  other: ["Transaction", "Other"],
};

export function counterpartyText(c?: LedgerEntry["counterparty"]): string | null {
  if (!c) return null;
  if (c.till) return `Till ${c.till}`;
  if (c.paybill) return `Paybill ${c.paybill}`;
  if (c.bankName || c.accountNumber) return [c.bankName, c.accountNumber].filter(Boolean).join(" · ") + (c.accountName ? ` (${c.accountName})` : "");
  if (c.phone) return c.accountName ? `${c.phone} (${c.accountName})` : c.phone;
  return c.address ?? c.accountName ?? null;
}

export function ledgerToPayment(e: LedgerEntry): Payment {
  const [title, baseMethod] = LEDGER_TITLE[e.type] ?? LEDGER_TITLE.other;
  const c = e.counterparty ?? {};
  const method =
    e.type === "offramp"
      ? c.till
        ? "Till"
        : c.paybill
          ? "Paybill"
          : c.bankName || (c.accountNumber && !c.phone)
            ? "Bank"
            : "Mobile money"
      : e.type === "onramp"
        ? c.phone
          ? "Mobile money"
          : "Bank transfer"
        : baseMethod;
  const fiat = e.fiatAmount != null ? Number(e.fiatAmount) : null;
  const isPayout = e.type === "offramp";
  const isOnramp = e.type === "onramp";
  // Payouts and onramps read best in the local currency.
  const showFiat = (isPayout || isOnramp) && fiat != null && !!e.fiatCurrency;
  return {
    id: `ledger:${e.id}`,
    kind: isOnramp ? "deposit" : isPayout ? "payout" : e.type === "swap" ? "swap" : e.type.startsWith("transfer") || e.type === "bridge" ? "transfer" : "other",
    direction: e.direction === "credit" ? "in" : "out",
    title,
    method: e.chain && e.type !== "offramp" && e.type !== "onramp" ? `${method} · ${chainName(e.chain)}` : method,
    status: toAppStatus(e.status),
    rawStatus: e.providerStatus ?? e.status,
    amount: showFiat ? fiat! : Number(e.amount || 0),
    currency: showFiat ? e.fiatCurrency! : (e.token || "USDC").toUpperCase(),
    amountUsd: /^(USDC|USDT)$/i.test(e.token || "") ? Number(e.amount || 0) : null,
    fee: e.fee != null ? Number(e.fee) : null,
    feeCurrency: e.feeToken ?? (showFiat ? e.fiatCurrency : e.token) ?? null,
    counterparty: counterpartyText(e.counterparty),
    reference: e.reference ?? null,
    txHash: e.txHash ?? null,
    chain: e.chain ?? null,
    token: e.token ?? null,
    fiatAmount: fiat,
    fiatCurrency: e.fiatCurrency ?? null,
    createdAt: e.createdAt,
    source: "ledger",
    raw: e,
  };
}

function chainName(c: string) {
  const k = c.toUpperCase().replace(/-/g, "_");
  const map: Record<string, string> = { BASE: "Base", POLYGON: "Polygon", ETHEREUM: "Ethereum", ARBITRUM: "Arbitrum", CELO: "Celo", BNB_SMART_CHAIN: "BNB Chain", BNB: "BNB Chain", LISK: "Lisk" };
  return map[k] ?? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
}

async function fetchLedger(): Promise<LedgerEntry[]> {
  const { data } = await riftRequest<any>("GET", "/v1/ledger");
  const list = Array.isArray(data) ? data : data?.entries ?? data?.data?.entries ?? data?.data ?? [];
  if (!Array.isArray(list)) throw new Error("ledger: unexpected shape");
  return list as LedgerEntry[];
}

export function useLedger() {
  return useQuery({
    queryKey: ["ledger"],
    queryFn: fetchLedger,
    enabled: !!localStorage.getItem("token"),
    retry: false,
    refetchInterval: 20_000,
  });
}

/* ── Legacy feeds (fallback) ──────────────────────────────────────── */

const PAYOUT_METHOD: Record<string, string> = {
  KES: "Mobile money",
  NGN: "Bank transfer",
  UGX: "Mobile money",
  TZS: "Mobile money",
  CDF: "Mobile money",
  MWK: "Mobile money",
  BRL: "PIX",
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
    case "bnb-smart-chain":
    case "bnb":
      return `https://bscscan.com/tx/${hash}`;
    default:
      return `https://basescan.org/tx/${hash}`;
  }
}

function legacyPayments(onramp: any[], deposits: any[], offramp: any[], onchain: any[]): Payment[] {
  const rows: Payment[] = [];
  for (const o of onramp) {
    const fiat = Number(o.fiatAmount ?? o.amount ?? 0);
    rows.push({
      id: `onramp:${o.id || o.transactionCode || o.receipt_number || o.createdAt}`,
      kind: "deposit",
      direction: "in",
      title: "Added funds",
      method: "Bank / mobile money",
      status: toAppStatus(o.status, "processing"),
      rawStatus: o.providerStatus ?? o.status,
      amount: fiat,
      currency: o.currency || "KES",
      amountUsd: o.cryptoAmount != null ? Number(o.cryptoAmount) : null,
      counterparty: o.providerAccount?.institution || o.public_name || null,
      reference: o.reference || o.transactionCode || null,
      receiptNumber: o.receipt_number ?? null,
      txHash: o.txHash || o.transaction_hash || null,
      chain: o.chain,
      token: o.token,
      fiatAmount: fiat,
      fiatCurrency: o.currency || "KES",
      createdAt: o.createdAt,
      source: "onramp",
      raw: o,
    });
  }
  for (const d of deposits) {
    rows.push({
      id: `deposit:${d.id || d.transactionHash}`,
      kind: "deposit",
      direction: "in",
      title: "Received",
      method: "Wallet transfer",
      status: d.processed === false ? "processing" : "completed",
      amount: Number(d.amount || 0),
      currency: "USDC",
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
  for (const o of offramp) {
    const currency = o.currency || "KES";
    rows.push({
      id: `offramp:${o.id || o.transactionCode}`,
      kind: "payout",
      direction: "out",
      title: "Payout",
      method: PAYOUT_METHOD[currency] || "Payout",
      status: toAppStatus(o.status),
      rawStatus: o.providerStatus ?? o.status,
      amount: Number(o.amount || 0),
      currency,
      amountUsd: o.usdcDeducted ?? null,
      fee: o.fee ?? null,
      feeCurrency: currency,
      counterparty: o.public_name || null,
      reference: o.transactionCode,
      receiptNumber: o.receipt_number,
      txHash: o.transaction_hash || o.txHash,
      chain: o.chain,
      token: o.token,
      fiatAmount: Number(o.amount || 0),
      fiatCurrency: currency,
      createdAt: o.createdAt,
      source: "offramp",
      raw: o,
    });
  }
  for (const t of onchain) {
    rows.push({
      id: `onchain:${t.id || t.transactionHash}`,
      kind: "transfer",
      direction: t.type === "receive" ? "in" : "out",
      title: t.type === "receive" ? "Received" : "Sent",
      method: `Wallet transfer${t.chain ? ` · ${chainName(t.chain)}` : ""}`,
      status: t.transactionHash ? "completed" : "processing",
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
  return rows;
}

export function usePayments() {
  const ledger = useLedger();
  const useLegacy = ledger.isError;
  const onramp = useOnrampOrders();
  const offramp = useWithdrawalOrders();
  const onchain = useOnchainHistory();
  const deposits = useDeposits();

  const data = useMemo<Payment[]>(() => {
    const arr = (v: unknown) => (Array.isArray(v) ? (v as any[]) : []);
    const rows = !useLegacy && ledger.data ? ledger.data.map(ledgerToPayment) : useLegacy ? legacyPayments(arr(onramp.data), arr(deposits.data), arr(offramp.data), arr(onchain.data)) : [];
    return rows.filter((r) => r.createdAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [useLegacy, ledger.data, onramp.data, offramp.data, onchain.data, deposits.data]);

  const isLoading = ledger.isLoading || (useLegacy && (onramp.isLoading || offramp.isLoading || onchain.isLoading || deposits.isLoading));
  return { data, isLoading, source: useLegacy ? ("legacy" as const) : ("ledger" as const) };
}
