import type { Page, Route } from "@playwright/test";

/**
 * In-memory mock of the LP pool API (/v1/lp/*, LP-POOL-CONTRACT). Register
 * AFTER any console/passkey mocks: Playwright runs the newest matching
 * route first, so these win for /v1/lp paths.
 */

export const LP_WALLET = "0xAbC0000000000000000000000000000000001234";
export const DEPOSIT_ADDRESS = "0x98a4BA4dea75F43a617E9753c0e38521391021b8";
export const TERMS_VERSION = "lp-2026-11-v2";

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

export const POOL = {
  totalUsd: 184250.5,
  providers: 23,
  volume30dUsd: 412800,
  eligibleVolume30dUsd: 500000,
  lpFees30dUsd: 1238.4,
  turnover30d: 2.24,
  estApy: 0.0806,
  depositAddress: DEPOSIT_ADDRESS,
  chains: ["BASE", "ETHEREUM", "POLYGON", "ARBITRUM"],
  assets: ["USDC", "USDT"],
  lockDays: 30,
  lpFeeBps: 30,
  riftFeeBps: 99,
  termsVersion: TERMS_VERSION,
  updatedAt: iso(0),
};

export const TERMS_MD = `# Rift LP Terms of Service

These terms explain what you are doing when you add money to the Rift liquidity pool. Read them in full.

## 1. What you are doing
You lend stablecoins to the **payment float** Rift uses to pay out mobile money. This is *not* a bank deposit.

## 2. Where your money is held
- In Rift's account with Pretium, a third party.
- It is **not insured**.

## 3. How you earn
1. When a payment uses the pool, 0.30% of its USD volume goes to LPs.
2. Earnings are split pro-rata by pool share. Estimates are not guaranteed and can be zero.

## 4. Lock and withdrawals
Each deposit is locked for 30 days. After that, withdrawals are processed on request.

## 5. Risks
You can lose some or all of your principal. <script>window.__xss = 1</script>

---

Questions? Email [support](mailto:support@riftfi.com) or read [our site](javascript:alert(1)).
`;

export interface LpMockOptions {
  /** Provider has accepted the current terms. */
  termsAccepted?: boolean;
  /** Position has deposits, accruals, payouts, withdrawals. */
  rich?: boolean;
  /** Withdrawable USD (default 5000 when rich). */
  withdrawable?: number;
  /** The /me response for a provider that doesn't exist yet. */
  meNotFound?: boolean;
  /** Overrides for the /pool response. */
  pool?: Partial<typeof POOL> & Record<string, unknown>;
}

export interface LpMockState {
  requests: { method: string; path: string; body: any; auth?: string }[];
  termsAccepted: boolean;
  withdrawals: any[];
  deposits: any[];
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
}

/** A JWT-shaped token (unsigned) with an expiry, like /auth/verify returns. */
export function fakeLpToken(address = LP_WALLET) {
  const b = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b({ alg: "HS256", typ: "JWT" })}.${b({ sub: address.toLowerCase(), scope: "lp", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

export async function installLpMocks(page: Page, opts: LpMockOptions = {}): Promise<LpMockState> {
  const rich = opts.rich ?? true;
  const state: LpMockState = {
    requests: [],
    termsAccepted: !!opts.termsAccepted,
    withdrawals: rich
      ? [{ id: "w1", amountUsd: 1000, chain: "BASE", asset: "USDC", toAddress: LP_WALLET, status: "paid", requestedAt: iso(-20), paidAt: iso(-18), txHash: "0x" + "c".repeat(64) }]
      : [],
    deposits: rich
      ? [
          { id: "d1", source: "crypto", chain: "BASE", asset: "USDC", amountUsd: 6000, txHash: "0x" + "a".repeat(64), status: "credited", creditedAt: iso(-45), lockedUntil: iso(-15), createdAt: iso(-45) },
          { id: "d2", source: "fiat", amountUsd: 2500, fiatAmount: 6450000, fiatCurrency: "TZS", status: "credited", creditedAt: iso(-18), lockedUntil: iso(12), createdAt: iso(-18) },
        ]
      : [],
  };

  const me = () => {
    const withdrawable = opts.withdrawable ?? (rich ? 5000 : 0);
    return {
      provider: {
        id: "prov_1",
        walletAddress: LP_WALLET.toLowerCase(),
        termsVersion: state.termsAccepted ? TERMS_VERSION : null,
        termsAcceptedAt: state.termsAccepted ? iso(-46) : null,
      },
      principalUsd: rich ? 7500 : 0,
      withdrawableUsd: withdrawable,
      lockSchedule: rich
        ? [
            { amountUsd: 5000, unlocksAt: iso(-15) },
            { amountUsd: 2500, unlocksAt: iso(12) },
          ]
        : [],
      earnedTotalUsd: rich ? 48.213456 : 0,
      earnedThisMonthUsd: rich ? 9.87 : 0,
      unpaidUsd: rich ? 9.87 : 0,
      sharePct: rich ? 4.07 : 0,
      deposits: state.deposits,
      recentAccruals: rich
        ? [
            { id: "a1", source: "offramp_order", orderId: "o1", corridor: "TZS", direction: "offramp", volumeUsd: 1200, share: 0.0407, amountUsd: 0.146520, at: iso(-1) },
            { id: "a2", source: "onramp_order", orderId: "o2", corridor: "GHS", direction: "onramp", volumeUsd: 850, share: 0.0407, amountUsd: 0.103785, at: iso(-2) },
            { id: "a3", source: "onramp_order", orderId: "o3", corridor: "MWK", direction: "onramp", volumeUsd: 40, share: 0.0407, amountUsd: 0.004884, at: iso(-3) },
          ]
        : [],
      payouts: rich ? [{ id: "p1", period: "2026-10", amountUsd: 38.34, status: "paid", txHash: "0x" + "b".repeat(64), paidAt: iso(-10) }] : [],
      withdrawals: state.withdrawals,
    };
  };

  await page.route(/\/v1\/lp\//, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,OPTIONS" } });
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/v1\/lp/, "");
    let body: any = {};
    try {
      body = JSON.parse(req.postData() || "{}");
    } catch {
      body = {};
    }
    const auth = req.headers()["authorization"];
    state.requests.push({ method: req.method(), path, body, auth });
    const authed = !!auth;

    if (path === "/pool") return json(route, { ...POOL, ...(opts.pool || {}) });
    if (path === "/pool/activity")
      return json(route, [
        { at: iso(-0.2), corridor: "TZS", direction: "offramp", volumeUsd: 320, lpFeeUsd: 0.96 },
        { at: iso(-0.5), corridor: "GHS", direction: "onramp", volumeUsd: 1100, lpFeeUsd: 3.3 },
        { at: iso(-1), corridor: "MWK", direction: "onramp", volumeUsd: 75.5, lpFeeUsd: 0.2265 },
      ]);
    if (path === "/terms") return json(route, { version: TERMS_VERSION, effectiveAt: "2026-11-13T00:00:00.000Z", markdown: TERMS_MD });
    if (path === "/auth/nonce") return json(route, { message: `lp.riftfi.com wants you to sign in with your Ethereum account:\n${body.address}\n\nSign in to Rift Yield.\n\nNonce: n0nce123\nExpiration Time: ${iso(0.01)}` });
    if (path === "/auth/verify") {
      if (!/^0x[0-9a-f]{130}$/i.test(body.signature || "") || !String(body.message).includes("n0nce123")) return json(route, { error: "INVALID_SIGNATURE", message: "Signature didn't match." }, 401);
      return json(route, { token: fakeLpToken(body.address) });
    }

    if (!authed) return json(route, { error: "UNAUTHORIZED" }, 401);
    if (path === "/me") return opts.meNotFound && !state.termsAccepted ? json(route, { error: "NOT_FOUND" }, 404) : json(route, me());
    if (path === "/terms/accept") {
      if (body.version !== TERMS_VERSION) return json(route, { error: "TERMS_VERSION_MISMATCH" }, 409);
      state.termsAccepted = true;
      return json(route, { ok: true, version: TERMS_VERSION });
    }
    if (path === "/deposits/crypto") {
      if (!state.termsAccepted) return json(route, { id: "d_held", source: "crypto", chain: body.chain, txHash: body.txHash, status: "held_terms", amountUsd: 250 });
      const d = { id: `d${state.deposits.length + 10}`, source: "crypto", chain: body.chain, asset: "USDC", txHash: body.txHash, status: "pending", amountUsd: null, createdAt: iso(0) };
      state.deposits.unshift(d);
      return json(route, d, 201);
    }
    if (path === "/deposits/fiat") {
      if (!body.phone || !body.network) return json(route, { error: "PHONE_REQUIRED", message: "Enter the phone number to pay from." }, 400);
      const d = { id: "d_fiat", source: "fiat", fiatAmount: body.amount, fiatCurrency: body.currency, status: "pending", collectCode: "COL-123", createdAt: iso(0) };
      state.deposits.unshift(d);
      return json(route, { ...d, message: "" }, 201);
    }
    if (path === "/withdrawals" && req.method() === "POST") {
      const max = me().withdrawableUsd;
      if (body.amountUsd > max) return json(route, { error: "AMOUNT_EXCEEDS_WITHDRAWABLE", message: `Only $${max} is withdrawable.` }, 400);
      const w = { id: `w${state.withdrawals.length + 10}`, ...body, status: "requested", requestedAt: iso(0) };
      state.withdrawals.unshift(w);
      return json(route, w, 201);
    }
    return json(route, { error: "NOT_FOUND" }, 404);
  });
  return state;
}

/** window.ethereum stub: records calls, signs with a fixed 65-byte signature. */
export async function installInjectedWallet(page: Page, address = LP_WALLET) {
  await page.addInitScript((addr) => {
    const calls: { method: string; params?: unknown[] }[] = [];
    (window as any).__ethCalls = calls;
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        calls.push({ method, params });
        if (method === "eth_requestAccounts" || method === "eth_accounts") return [addr];
        if (method === "personal_sign") return "0x" + "1b".repeat(65);
        if (method === "eth_chainId") return "0x2105";
        throw Object.assign(new Error(`unsupported ${method}`), { code: 4200 });
      },
    };
  }, address);
}

/** Pre-seed an external-wallet LP session (sessionStorage), like after sign-in. */
export async function seedWalletSession(page: Page, address = LP_WALLET) {
  await page.addInitScript(
    ({ token, addr }) => {
      sessionStorage.setItem("rift_lp_session", JSON.stringify({ token, address: addr.toLowerCase() }));
    },
    { token: fakeLpToken(address), addr: address }
  );
}

/** Quiet the noisy third parties a public page still touches. */
export async function blockThirdParties(page: Page) {
  await page.route(/^https:\/\/([a-z0-9-]+\.)*(posthog\.com|accounts\.google\.com)\//, (r) => r.fulfill({ status: 200, body: "{}" }));
  // Nothing reaches real Rift infra: anything not mocked is a 404.
  await page.route(/^https:\/\/[a-z.]*riftfi\.(com|xyz)\//, (r) => json(r, { error: "NOT_FOUND" }, 404));
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const st = document.createElement("style");
      st.textContent = "#eruda{display:none!important}";
      document.head.appendChild(st);
    });
  });
}
