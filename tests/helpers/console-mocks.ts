import type { Page, Route } from "@playwright/test";

/**
 * Backend mock for the payments console UI tests + screenshots.
 *
 * Every remote call is intercepted; nothing reaches real infra. With
 * `rich: true` the account has balances, payments, invoices, approvals and
 * passkeys so screens render with realistic content. Without it, every
 * feed is empty (empty states).
 */

export const WALLET = "0x7a3F9c21B4e8D05a61c2f3E9b0d4A8C6e1F25b9D";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

const BALANCES: Record<string, number> = {
  "USDC:BASE": 12480.55,
  "USDC:POLYGON": 1520,
  "USDT:ARBITRUM": 860.25,
};

const RATES: Record<string, number> = { KES: 129, NGN: 1545, UGX: 3690, TZS: 2580, MWK: 1736, BRL: 5.42, CDF: 2840 };

const OWNED_TOKENS = [
  { id: "BASE-USDC", name: "USDC", chain_id: "8453" },
  { id: "POLYGON-USDC", name: "USDC", chain_id: "137" },
  { id: "ARBITRUM-USDT", name: "USDT", chain_id: "42161" },
  { id: "BASE-ETH", name: "ETH", chain_id: "8453" },
];

export const RICH = {
  user: {
    id: "usr_test",
    externalId: "acme-traders",
    email: "finance@acmetraders.co.ke",
    displayName: "Acme Traders Ltd",
    notificationEmail: "finance@acmetraders.co.ke",
    evmAddress: WALLET,
    address: WALLET,
    paymentAccount: JSON.stringify({ institution: "Safaricom", accountIdentifier: "0712345678", accountName: "Acme Traders Ltd", currency: "KES", type: "MOBILE" }),
  },
  offramps: [
    { id: "ord_1", status: "COMPLETED", transactionCode: "RFT-8K2Q1", amount: 64500, currency: "KES", createdAt: ago(42), receipt_number: "SGH4KX92LM", transaction_hash: "0x9f1c3b7e2a54d8c06e1f2b3a4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f", chain: "base", token: "USDC", public_name: "Jane Wanjiru", usdcDeducted: 500, fee: 645 },
    { id: "ord_2", status: "PENDING", transactionCode: "RFT-7H1P9", amount: 250000, currency: "NGN", createdAt: ago(180), chain: "base", token: "USDC", public_name: "Zenith Bank · 0123456789", usdcDeducted: 160, fee: 2500 },
    { id: "ord_3", status: "FAILED", transactionCode: "RFT-5D0M3", amount: 12900, currency: "KES", createdAt: ago(60 * 26), chain: "base", token: "USDC", public_name: "Paybill 247247", usdcDeducted: 100, fee: 129 },
  ],
  onramps: [
    { status: "COMPLETED", transactionCode: "ONR-11AA2", createdAt: ago(60 * 5), receipt_number: "SGF1TQ88PZ", transaction_hash: "0x4b2a9e1d7c3f5a6b8d0e2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e", amount: "129000", currency: "KES", chain: "base", token: "USDC", public_name: "Acme Traders Ltd" },
  ],
  transactions: [
    { id: "tx_1", transactionHash: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809", amount: 1250, token: "USDC", chain: "BASE", recipientAddress: "0x5C7e2A9b1D3f4E6a8B0c2D4e6F8a0B2c4D6e8F0a", createdAt: ago(60 * 30), userId: "usr_test" },
    { id: "tx_2", transactionHash: "0x2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a", amount: 3400, token: "USDC", chain: "BASE", recipientAddress: WALLET, createdAt: ago(60 * 50), userId: "usr_test" },
  ],
  deposits: [
    { id: "dep_1", userId: "usr_test", transactionHash: "0x3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b", blockNumber: "1", blockTimestamp: ago(60 * 72), fromAddress: "0x9E8d7C6b5A4f3E2d1C0b9A8f7E6d5C4b3A2f1E0d", toAddress: WALLET, amount: "8000", rawAmount: "8000000000", exchangeRate: 129, kesAmount: 1032000, processed: true, createdAt: ago(60 * 72), updatedAt: ago(60 * 72), user: { email: "", phoneNumber: "" } },
  ],
  invoices: [
    { id: "inv_1", description: "Invoice #1042 — Q4 logistics", chain: "BASE", token: "USDC", amount: 2400, recipientEmail: "ap@kilimofresh.com", status: "PENDING", url: "https://pay.riftfi.com/i/inv_1", createdAt: ago(60 * 20), updatedAt: ago(60 * 20), expiresAt: new Date(now + 6 * 86400_000).toISOString(), userId: "usr_test" },
    { id: "inv_2", description: "Invoice #1041 — Warehousing", chain: "BASE", token: "USDC", amount: 980, recipientEmail: "billing@savannahco.com", status: "COMPLETED", url: "https://pay.riftfi.com/i/inv_2", createdAt: ago(60 * 24 * 3), updatedAt: ago(60 * 24 * 2), paidAt: ago(60 * 24 * 2), userId: "usr_test" },
    { id: "inv_3", description: "Deposit for order 88", chain: "BASE", token: "USDC", amount: 150, recipientPhone: "+254712345678", status: "EXPIRED", url: "https://pay.riftfi.com/i/inv_3", createdAt: ago(60 * 24 * 12), updatedAt: ago(60 * 24 * 5), userId: "usr_test" },
  ],
  approvals: [
    { id: "apr_1", status: "pending", summary: { title: "Send 250 USDC", amount: "250", token: "USDC", recipient: "0x000000000000000000000000000000000000dEaD", createdVia: "api" }, chainId: 8453, createdAt: ago(5), expiresAt: new Date(now + 25 * 60_000).toISOString() },
  ],
  passkeys: [
    { id: "pk_1", label: "MacBook Pro · Touch ID", status: "active", createdAt: ago(60 * 24 * 40), lastUsedAt: ago(30) },
    { id: "pk_2", label: "iPhone 15", status: "active", createdAt: ago(60 * 24 * 12), lastUsedAt: ago(60 * 24 * 2) },
  ],
};

/** The same activity as one ledger, with app-facing statuses. */
export const LEDGER = [
  { id: "l1", createdAt: ago(42), type: "offramp", direction: "debit", status: "completed", providerStatus: "settled", amount: 500, token: "USDC", chain: "base", fiatAmount: 64500, fiatCurrency: "KES", fee: 645, feeToken: "KES", counterparty: { phone: "0712345678", accountName: "JANE WANJIRU" }, reference: "RFT-8K2Q1", txHash: "0x9f1c3b7e2a54d8c06e1f2b3a4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f", provider: "paycrest" },
  { id: "l2", createdAt: ago(180), type: "offramp", direction: "debit", status: "processing", providerStatus: "settling", amount: 160, token: "USDC", chain: "base", fiatAmount: 250000, fiatCurrency: "NGN", fee: 2500, counterparty: { bankName: "Zenith Bank", accountNumber: "0123456789", accountName: "ADA OBI" }, reference: "RFT-7H1P9" },
  { id: "l3", createdAt: ago(300), type: "onramp", direction: "credit", status: "completed", providerStatus: "settled", amount: 1000, token: "USDC", chain: "base", fiatAmount: 129000, fiatCurrency: "KES", fee: 1290, counterparty: { phone: "0712345678" }, reference: "ONR-11AA2", txHash: "0x4b2a9e1d7c3f5a6b8d0e2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e" },
  { id: "l4", createdAt: ago(60 * 26), type: "offramp", direction: "debit", status: "refunded", providerStatus: "refunded", amount: 100, token: "USDC", chain: "base", fiatAmount: 12900, fiatCurrency: "KES", counterparty: { paybill: "247247", accountNumber: "ACC-1" }, reference: "RFT-5D0M3" },
  { id: "l5", createdAt: ago(60 * 30), type: "transfer_out", direction: "debit", status: "completed", amount: 1250, token: "USDC", chain: "base", counterparty: { address: "0x5C7e2A9b1D3f4E6a8B0c2D4e6F8a0B2c4D6e8F0a" }, txHash: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809" },
  { id: "l6", createdAt: ago(60 * 50), type: "transfer_in", direction: "credit", status: "completed", amount: 3400, token: "USDC", chain: "base", counterparty: { address: "0x9E8d7C6b5A4f3E2d1C0b9A8f7E6d5C4b3A2f1E0d" }, txHash: "0x2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a" },
  { id: "l7", createdAt: ago(60 * 72), type: "onramp", direction: "credit", status: "expired", providerStatus: "expired", amount: 0, token: "USDC", chain: "base", fiatAmount: 5000, fiatCurrency: "NGN", reference: "ONR-9ZZ1" },
];

export const COUNTRIES = [
  { country: "KE", currency: "KES", phoneCode: "+254", rails: { mobile: ["Safaricom", "Airtel"], bank: true, till: true, paybill: true }, offrampActive: true, onrampActive: true },
  { country: "NG", currency: "NGN", phoneCode: "+234", rails: { mobile: [], bank: true, till: false, paybill: false }, offrampActive: true, onrampActive: true },
  { country: "UG", currency: "UGX", phoneCode: "+256", rails: { mobile: ["MTN", "Airtel"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "TZ", currency: "TZS", phoneCode: "+255", rails: { mobile: ["Vodacom", "Halotel", "Airtel", "Yas"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: false },
  { country: "GH", currency: "GHS", phoneCode: "+233", rails: { mobile: ["MTN", "AirtelTigo", "Telecel"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: false },
];

export interface MockOptions {
  rich?: boolean;
  /** Serve the ledger (default) or 404 it to exercise the legacy feeds. */
  ledger?: boolean;
  /** Onramp switch reported by /v1/payouts/countries. */
  onramp?: boolean;
  /** KYC: verified users never see the identity flow. */
  kycVerified?: boolean;
}

export interface MockState {
  requests: { method: string; path: string; body: any }[];
  onrampPolls: number;
  kycVerified: boolean;
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function installConsoleMocks(page: Page, opts: MockOptions = {}): Promise<MockState> {
  const rich = !!opts.rich;
  const state: MockState = { requests: [], onrampPolls: 0, kycVerified: opts.kycVerified ?? true };
  const handler = (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    let body: any = {};
    try {
      body = JSON.parse(route.request().postData() || "{}");
    } catch {
      body = {};
    }
    state.requests.push({ method, path, body });

    // ── v3 endpoints ─────────────────────────────────────────────
    if (/\/v1\/ledger$/.test(path)) return opts.ledger === false ? json(route, { error: "NOT_FOUND" }, 404) : json(route, { entries: rich ? LEDGER : [], nextCursor: null });
    if (/\/v1\/payouts\/countries$/.test(path)) {
      const on = opts.onramp ?? true;
      return json(route, COUNTRIES.map((c) => ({ ...c, onrampActive: on && c.onrampActive })));
    }
    if (/\/v1\/payouts\/validate$/.test(path)) {
      const id = body.phone ?? body.till ?? body.paybill ?? body.accountNumber ?? "";
      if (String(id).endsWith("999")) return json(route, { valid: false, message: "No account matches this number." });
      const name = body.type === "till" ? "KILIMO FRESH STORES" : body.type === "paybill" ? "KENYA POWER" : body.type === "bank" ? "ACME SUPPLIES LTD" : "JANE WANJIRU";
      return json(route, { valid: true, accountName: name });
    }
    if (/\/v1\/kyc\/status$/.test(path)) return json(route, { success: true, kycVerified: state.kycVerified, status: state.kycVerified ? "verified" : "not_started", underReview: false });
    if (/\/v1\/onramps\/quote$/.test(path)) {
      const amount = Number(url.searchParams.get("amount") || 0);
      const cur = url.searchParams.get("currency") || "KES";
      const rate = cur === "NGN" ? 1560 : 130;
      return json(route, { currency: cur, fiatAmount: amount, token: url.searchParams.get("token"), chain: url.searchParams.get("chain"), cryptoAmount: Math.round((amount / rate) * 0.99 * 100) / 100, rate, fee: Math.round(amount * 0.01), expiresAt: new Date(Date.now() + 60_000).toISOString() });
    }
    if (/\/v1\/onramps$/.test(path) && method === "POST") {
      if (!state.kycVerified) return json(route, { error: "ONRAMP_KYC_REQUIRED", missing: ["fullName", "dateOfBirth", "idNumber"] }, 409);
      state.onrampPolls = 0;
      const crypto = Math.round((body.fiatAmount / (body.currency === "NGN" ? 1560 : 130)) * 0.99 * 100) / 100;
      const base = { id: "onr_1", status: "awaiting_payment", providerStatus: "initiated", fiatAmount: body.fiatAmount, currency: body.currency, cryptoAmount: crypto, token: body.token, chain: body.chain, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() };
      return json(
        route,
        body.currency === "NGN"
          ? { ...base, providerAccount: { institution: "Moniepoint MFB", accountIdentifier: "6012345678", accountName: "PAYCREST / RIFT", amountToTransfer: body.fiatAmount + 15, currency: "NGN", validUntil: new Date(Date.now() + 30 * 60_000).toISOString(), memo: "RFT-ONR-1" } }
          : base
      );
    }
    const onr = path.match(/\/v1\/onramps\/([^/]+)$/);
    if (onr && method === "GET") {
      state.onrampPolls++;
      const st = state.onrampPolls < 2 ? "awaiting_payment" : state.onrampPolls < 3 ? "processing" : "completed";
      return json(route, { id: onr[1], status: st, providerStatus: st === "processing" ? "settling" : st === "completed" ? "settled" : "initiated", fiatAmount: 5000, currency: "NGN", cryptoAmount: 3.17, token: "USDC", chain: "BASE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), txHash: st === "completed" ? "0x5e5e" + "1".repeat(60) : null, reference: "RFT-ONR-1" });
    }
    if (/\/v1\/offramps\/[^/]+$/.test(path) && method === "GET") return json(route, { id: path.split("/").pop(), status: "processing", providerStatus: "settling" });
    if (/\/v1\/me$|getUser|\/user$/.test(path)) return json(route, { user: rich ? RICH.user : { id: "test-user", externalId: "test-ext-id", phoneNumber: "+254700000000", notificationEmail: "tester@example.com" } });
    if (/balances\/tokens|token-balance/.test(path)) {
      const key = `${url.searchParams.get("token")}:${url.searchParams.get("chain")}`;
      return json(route, { data: [{ amount: rich ? BALANCES[key] ?? 0 : 0, token: url.searchParams.get("token"), chain: url.searchParams.get("chain") }] });
    }
    if (/rates\/quote|preview_exchange_rate|preview-exchange-rate/.test(path)) {
      let cur = "KES";
      try {
        cur = JSON.parse(route.request().postData() || "{}").currency || url.searchParams.get("currency") || "KES";
      } catch {
        /* default */
      }
      const r = RATES[cur] ?? 129;
      return json(route, { rate: r, buying_rate: r, selling_rate: r * 1.01, feeBps: 100, feePercentage: 1 });
    }
    if (/\/v1\/me\/tokens$/.test(path)) return json(route, { data: rich ? OWNED_TOKENS : [] });
    if (/\/v1\/offramps$/.test(path)) return json(route, { orders: rich ? RICH.offramps : [] });
    if (/\/v1\/onramps$/.test(path)) return json(route, { orders: rich ? RICH.onramps : [] });
    if (/\/v1\/transactions$/.test(path)) return json(route, { transactions: rich ? RICH.transactions : [] });
    if (/\/v1\/deposits$/.test(path)) return json(route, { deposits: rich ? RICH.deposits : [] });
    if (/\/v1\/invoices$/.test(path)) {
      if (route.request().method() === "POST") return json(route, { id: "inv_qr", url: "https://pay.riftfi.com/i/acme-traders" });
      return json(route, rich ? RICH.invoices : []);
    }
    if (/\/v1\/approvals$/.test(path)) return json(route, { approvals: rich ? RICH.approvals : [] });
    if (/\/v1\/wallet\/passkeys$/.test(path)) return json(route, { passkeys: RICH.passkeys });
    if (/fee-estimate/.test(path)) {
      return json(route, { gasFeeInToken: "0.042", paymasterFeeInToken: "0.03", sendAmount: "250", totalNeeded: "250.042", tokenBalance: "12480.55", sufficient: true, deficit: "0", token: "USDC", chain: "BASE" });
    }
    return json(route, { orders: [], balances: [], breakdown: [], data: [], rate: 1, buying_rate: 129, selling_rate: 130, feeBps: 100, feePercentage: 1 });
  };
  await page.route("**/api/**", handler);
  await page.route("https://*.riftfi.xyz/**", handler);
  await page.route("https://*.riftfi.com/**", handler);
  // Public RPCs (smart-account deployment check) — answer "deployed".
  await page.route(/(base|polygon|arbitrum|celo|ethereum|llamarpc|publicnode|ankr|alchemy|infura|drpc|blastapi|1rpc)[^/]*\/.*/i, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return json(route, { jsonrpc: "2.0", id: 1, result: "0x6080" });
  });

  await page.addInitScript(
    ({ address }) => {
      localStorage.setItem("token", "dummy-test-token");
      localStorage.setItem("address", address);
      localStorage.setItem("recovery_warning_dismissed", String(Date.now()));
      localStorage.setItem("demo_completed", "true");
      localStorage.setItem("selected_currency", "USD");
      // The dev-only eruda launcher floats over the tab bar; hide it.
      document.addEventListener("DOMContentLoaded", () => {
        const st = document.createElement("style");
        st.textContent = "#eruda{display:none!important}";
        document.head.appendChild(st);
      });
    },
    { address: rich ? WALLET : "0x000000000000000000000000000000000000dead" }
  );
  return state;
}
