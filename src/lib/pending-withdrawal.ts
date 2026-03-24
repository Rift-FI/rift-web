/**
 * Track pending withdrawals after submitting.
 * Stored in localStorage with a TTL so the home page can show
 * a "processing withdrawal" banner.
 */

const STORAGE_KEY = "rift_pending_withdrawals";
const TTL_MS = 2 * 60 * 1000; // 2 minutes

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh", NGN: "\u20A6", UGX: "USh", TZS: "TSh",
  CDF: "FC", MWK: "MK", BRL: "R$", USD: "$",
};

export interface PendingWithdrawal {
  id: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  transactionCode?: string;
  createdAt: number;
}

function readEntries(): PendingWithdrawal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: PendingWithdrawal[] = JSON.parse(raw);
    const now = Date.now();
    return entries.filter((e) => now - e.createdAt < TTL_MS);
  } catch {
    return [];
  }
}

function writeEntries(entries: PendingWithdrawal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addPendingWithdrawal(entry: { amount: number; currency: string; transactionCode?: string }) {
  const entries = readEntries();
  entries.push({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    currencySymbol: CURRENCY_SYMBOLS[entry.currency] || entry.currency,
    createdAt: Date.now(),
  });
  writeEntries(entries);
}

export function getPendingWithdrawals(): PendingWithdrawal[] {
  const entries = readEntries();
  writeEntries(entries);
  return entries;
}

export function clearPendingWithdrawal(id: string) {
  const entries = readEntries().filter((e) => e.id !== id);
  writeEntries(entries);
}
