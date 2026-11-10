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

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function installConsoleMocks(page: Page, opts: { rich?: boolean } = {}) {
  const rich = !!opts.rich;
  const handler = (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
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
}
