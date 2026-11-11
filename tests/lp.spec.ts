import { test, expect, Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { installConsoleMocks } from "./helpers/console-mocks";
import { attachVirtualAuthenticator, installPasskeyBackend, newState, seedCredential, seedSession } from "./helpers/passkey-backend";
import { DEPOSIT_ADDRESS, LP_WALLET, TERMS_VERSION, blockThirdParties, installInjectedWallet, installLpMocks, seedWalletSession } from "./helpers/lp-mocks";

/**
 * Yield (LP pool) UI against LP-POOL-CONTRACT, every /v1/lp call mocked
 * (tests/helpers/lp-mocks.ts): public page, calculator math, wallet sign-in,
 * the terms gate, crypto + local-money deposits, withdraw limits, dashboard.
 */

const SHOTS = "C:/Users/ADMIN/Downloads/rift-lp";

async function pickOption(page: Page, trigger: string, option: string | RegExp) {
  await page.getByTestId(trigger).click();
  await page.getByRole("listbox").getByRole("option", { name: option }).click();
}

async function openPublic(page: Page, opts: Parameters<typeof installLpMocks>[1] = {}) {
  await blockThirdParties(page);
  const lp = await installLpMocks(page, opts);
  return lp;
}

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>("#main");
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1 && (!el || el.scrollWidth <= el.clientWidth + 1);
  });
}

test.describe("public /lp", () => {
  test("terminal: stats strip, chart, ticket, activity table and risks without login", async ({ page }) => {
    await openPublic(page);
    await page.goto("/lp");
    await expect(page).toHaveURL(/\/lp$/);
    await expect(page.getByRole("heading", { level: 1, name: "Yield Pool" })).toBeVisible();
    await expect(page.getByTestId("lp-stat-total")).toContainText("$184,251");
    await expect(page.getByTestId("lp-stat-providers")).toContainText("23");
    await expect(page.getByTestId("lp-stat-volume")).toContainText("$500,000");
    await expect(page.getByTestId("lp-stat-fees")).toContainText("$1,238.40");
    await expect(page.getByTestId("lp-stat-apy")).toContainText("9.77%"); // 0.003 × 12 × 500,000 ÷ 184,250.50
    await expect(page.getByTestId("lp-stat-lock")).toContainText("30d");
    await expect(page.locator("body")).not.toContainText(/pretium/i);

    // Chart: real series from /pool/history, switchable metric + range.
    const chart = page.getByTestId("lp-chart");
    await expect(chart.locator("canvas").first()).toBeVisible();
    await expect(page.getByTestId("lp-chart-empty")).toHaveCount(0);
    await page.getByTestId("lp-chart-volume").click();
    await expect(page.getByTestId("lp-chart-volume")).toHaveAttribute("aria-selected", "true");
    await page.getByTestId("lp-range-90").click();
    await expect(page.getByTestId("lp-range-90")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("lp-chart-headline")).toContainText("$");

    // One-line formula behind the info button, not paragraphs.
    await page.getByTestId("lp-formula-info").click();
    await expect(page.getByTestId("lp-formula")).toBeVisible();
    await expect(page.getByTestId("lp-formula")).toContainText("0.30%");

    await expect(page.getByTestId("lp-activity-row")).toHaveCount(3);
    await page.getByTestId("lp-tab-risks").click();
    const risks = page.getByTestId("lp-risks");
    await expect(risks).toContainText(/third party/i);
    await expect(risks).toContainText(/Currency risk/i);
    await expect(risks).toContainText(/not insured/i);
    await expect(risks).toContainText(/lose money/i);
    await expect(page.getByTestId("lp-cta-connect")).toBeVisible();
    await expect(page.getByTestId("lp-cta-rift")).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test("no history yet: flat chart with a 'No activity yet' note, no made-up numbers", async ({ page }) => {
    await openPublic(page, { history: "empty" });
    await page.goto("/lp");
    await expect(page.getByTestId("lp-chart-empty")).toHaveText("No activity yet");
  });

  test("history API down: retry line inside the chart panel", async ({ page }) => {
    await openPublic(page, { history: "error" });
    await page.goto("/lp");
    await expect(page.getByTestId("lp-chart-error")).toContainText("Retry", { timeout: 15_000 });
    await expect(page.getByTestId("lp-stat-total")).toContainText("$184,251");
  });

  test("pool API down: no made-up numbers", async ({ page }) => {
    await blockThirdParties(page);
    await page.route(/\/v1\/lp\//, (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto("/lp");
    await expect(page.getByTestId("lp-pool-error")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("lp-stat-total")).toHaveCount(0);
    await expect(page.getByTestId("lp-chart-error")).toBeVisible({ timeout: 15_000 });
  });

  test("terms page renders the markdown safely", async ({ page }) => {
    await openPublic(page);
    await page.goto("/lp");
    await page.getByTestId("lp-terms-link").click();
    await expect(page).toHaveURL(/\/lp\/terms$/);
    const body = page.getByTestId("lp-terms-body");
    await expect(body.getByRole("heading", { name: "Rift LP Terms of Service" })).toBeVisible();
    await expect(body.getByRole("heading", { name: "5. Risks" })).toBeVisible();
    await expect(body).toContainText(TERMS_VERSION);
    await expect(body.locator("strong", { hasText: "not insured" })).toBeVisible();
    await expect(body.getByRole("listitem")).toHaveCount(4);
    // Raw HTML shows as text and never runs; unsafe links render as plain text.
    await expect(body).toContainText("<script>");
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
    await expect(body.getByRole("link", { name: "support" })).toHaveAttribute("href", "mailto:support@riftfi.com");
    await expect(body.getByRole("link", { name: "our site" })).toHaveCount(0);
  });
});

test.describe("calculator", () => {
  test("amount only: monthly = 0.30% × 30-day volume × amount ÷ (pool + amount)", async ({ page }) => {
    await openPublic(page);
    await page.goto("/lp");
    // Pool $184,250.50, payments $500,000 → LPs share $1,500 a month.
    await expect(page.getByTestId("lp-calc-turnover")).toHaveCount(0);
    await expect(page.getByTestId("lp-calc-monthly")).toHaveText("$8.10"); // 1500 × 1000 / 185,250.50
    await expect(page.getByTestId("lp-calc-yearly")).toHaveText("$97.17");
    await expect(page.getByTestId("lp-calc-apy")).toHaveText("9.72%");
    await expect(page.getByTestId("lp-calc-share")).toHaveText("0.54%");

    await page.getByTestId("lp-calc-amount").fill("10000");
    await expect(page.getByTestId("lp-calc-monthly")).toHaveText("$77.22");
    await expect(page.getByTestId("lp-calc-yearly")).toHaveText("$926.64");
    await expect(page.getByTestId("lp-calc-share")).toHaveText("5.15%");

    await page.getByTestId("lp-calc-quick-50000").click();
    await expect(page.getByTestId("lp-calc-amount")).toHaveValue("50000");
    await expect(page.getByTestId("lp-calc-monthly")).toHaveText("$320.17");
    await expect(page.getByTestId("lp-calc-note")).toContainText(/not a promise/i);
  });

  test("no payments in 30 days → estimate is zero, and says why", async ({ page }) => {
    await openPublic(page, { pool: { eligibleVolume30dUsd: 0, volume30dUsd: 0 } } as any);
    await page.goto("/lp");
    await expect(page.getByTestId("lp-calc-monthly")).toHaveText("$0.00");
    await expect(page.getByTestId("lp-calc-note")).toContainText(/estimate is zero/i);
  });
});

test.describe("wallet sign-in", () => {
  test("connect injected wallet → nonce → personal_sign → verify → dashboard", async ({ page }) => {
    await installInjectedWallet(page);
    const lp = await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await page.getByTestId("lp-cta-connect").click();
    const sheet = page.getByTestId("lp-connect");
    await expect(sheet).toBeVisible();
    await sheet.getByTestId("lp-wallet-option").first().click();

    await expect(page.getByTestId("lp-dashboard")).toBeVisible({ timeout: 15_000 });
    const calls = await page.evaluate(() => (window as any).__ethCalls as { method: string; params: string[] }[]);
    const sign = calls.find((c) => c.method === "personal_sign")!;
    expect(sign).toBeTruthy();
    const nonceReq = lp.requests.find((r) => r.path === "/auth/nonce")!;
    expect(nonceReq.body.address).toBe(LP_WALLET);
    const signed = Buffer.from(sign.params[0].slice(2), "hex").toString("utf8");
    expect(signed).toContain("Nonce: n0nce123");
    expect(sign.params[1]).toBe(LP_WALLET);
    const verify = lp.requests.find((r) => r.path === "/auth/verify")!;
    expect(verify.body).toMatchObject({ address: LP_WALLET, message: signed, signature: "0x" + "1b".repeat(65) });

    // The LP token (not a Rift token) authorises /me, and lives in sessionStorage.
    const meReq = lp.requests.find((r) => r.path === "/me")!;
    expect(meReq.auth).toMatch(/^Bearer ey/);
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("rift_lp_session") || "{}"));
    expect(stored.address).toBe(LP_WALLET.toLowerCase());
    await expect(page.getByTestId("lp-session")).toContainText("0xabc0");

    // Disconnect returns to the public page.
    await page.getByTestId("lp-signout").click();
    await expect(page.getByTestId("lp-cta-connect")).toBeVisible();
  });

  test("rejected signature request shows a clear error", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async ({ method }: { method: string }) => {
          if (method === "eth_requestAccounts") return ["0xAbC0000000000000000000000000000000001234"];
          throw Object.assign(new Error("User rejected the request."), { code: 4001 });
        },
      };
    });
    await openPublic(page);
    await page.goto("/lp");
    await page.getByTestId("lp-cta-connect").click();
    await page.getByTestId("lp-wallet-option").click();
    await expect(page.getByTestId("lp-connect").getByRole("alert")).toHaveText("You cancelled the request in your wallet.");
  });

  test("no wallet in the browser explains what to do", async ({ page }) => {
    await openPublic(page);
    await page.goto("/lp");
    await page.getByTestId("lp-cta-connect").click();
    await expect(page.getByTestId("lp-no-wallet")).toBeVisible();
    await expect(page.getByTestId("lp-use-rift")).toHaveText(/Sign in with Rift/);
  });
});

test.describe("dashboard (wallet session)", () => {
  test("account rows in the ticket; earnings, deposits, payouts, withdrawals and locks as tabs", async ({ page }) => {
    await seedWalletSession(page);
    await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await expect(page.getByTestId("lp-dashboard")).toBeVisible();
    await expect(page.getByTestId("lp-principal")).toContainText("$7,500.00");
    await expect(page.getByTestId("lp-share")).toContainText("4.07%");
    await expect(page.getByTestId("lp-earned-total")).toContainText("$48.21");
    await expect(page.getByTestId("lp-earned-month")).toContainText("$9.87");
    await expect(page.getByTestId("lp-unpaid")).toContainText("$9.87");
    await expect(page.getByTestId("lp-unpaid")).toContainText("Next payout");
    await expect(page.getByTestId("lp-withdrawable")).toHaveText("$5,000.00");
    await expect(page.getByTestId("lp-terms-banner")).toHaveCount(0);

    // Earnings is the first tab once signed in.
    const accruals = page.getByTestId("lp-accruals");
    await expect(accruals).toContainText("Cash out · TZS");
    await expect(accruals).toContainText("+$0.15");
    await expect(accruals).toContainText("+$0.0049"); // sub-cent earnings keep their precision

    await page.getByTestId("lp-tab-deposits").click();
    await expect(page.getByTestId("lp-deposit-row")).toHaveCount(2);
    await page.getByTestId("lp-tab-payouts").click();
    await expect(page.getByTestId("lp-payout-row")).toContainText("October 2026");
    await expect(page.getByTestId("lp-payout-row")).toContainText("$38.34");
    await page.getByTestId("lp-tab-withdrawals").click();
    await expect(page.getByTestId("lp-withdrawal-row")).toContainText("Paid");
    await page.getByTestId("lp-tab-locks").click();
    const locks = page.getByTestId("lp-lock-row");
    await expect(locks).toHaveCount(2);
    await expect(locks.nth(0)).toContainText("Unlocked");
    await expect(locks.nth(1)).toContainText("Unlocks");
    // Pool activity stays one tab away.
    await page.getByTestId("lp-tab-activity").click();
    await expect(page.getByTestId("lp-activity-row")).toHaveCount(3);

    expect(await noHorizontalOverflow(page)).toBe(true);
    const vw = page.viewportSize()!.width;
    for (const id of ["lp-tables", "lp-ticket", "lp-chart", "lp-pool-stats"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1);
    }
  });
});

test.describe("terms gate", () => {
  test("blocks deposits until the terms are accepted", async ({ page }) => {
    await seedWalletSession(page);
    const lp = await openPublic(page, { termsAccepted: false });
    await page.goto("/lp");
    await expect(page.getByTestId("lp-terms-banner")).toBeVisible();

    for (const action of ["lp-deposit-crypto", "lp-deposit-fiat"]) {
      await page.getByTestId(action).click();
      const gate = page.getByTestId("lp-terms-gate");
      await expect(gate).toBeVisible();
      await expect(page.getByTestId("lp-crypto-sheet")).toHaveCount(0);
      await expect(page.getByTestId("lp-fiat-sheet")).toHaveCount(0);
      await expect(gate.getByTestId("lp-terms-body")).toContainText("What you are doing");
      await expect(gate.getByText(`I have read and accept the LP Terms (${TERMS_VERSION})`)).toBeVisible();
      await expect(gate.getByTestId("lp-terms-accept")).toBeDisabled();
      await gate.getByRole("button", { name: "Close" }).click();
    }
    expect(lp.requests.some((r) => r.path.startsWith("/deposits"))).toBe(false);
    expect(lp.requests.some((r) => r.path === "/terms/accept")).toBe(false);

    await page.getByTestId("lp-deposit-crypto").click();
    const gate = page.getByTestId("lp-terms-gate");
    await gate.getByTestId("lp-terms-check").check();
    await expect(gate.getByTestId("lp-terms-accept")).toBeEnabled();
    await gate.getByTestId("lp-terms-accept").click();
    await expect(page.getByTestId("lp-crypto-sheet")).toBeVisible();
    await expect(page.getByTestId("lp-terms-gate")).toHaveCount(0);
    expect(lp.requests.find((r) => r.path === "/terms/accept")?.body).toEqual({ version: TERMS_VERSION });
    await page.getByTestId("lp-crypto-sheet").getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("lp-terms-banner")).toHaveCount(0);
  });

  test("first-time provider (/me 404) is treated as an empty position needing terms", async ({ page }) => {
    await seedWalletSession(page);
    await openPublic(page, { meNotFound: true, rich: false });
    await page.goto("/lp");
    await expect(page.getByTestId("lp-principal")).toContainText("$0.00");
    await expect(page.getByTestId("lp-terms-banner")).toBeVisible();
    await expect(page.getByTestId("lp-accruals")).toContainText("No earnings yet");
  });
});

test.describe("deposits", () => {
  test("crypto: chain + asset, address with QR, warning, paste tx hash → POST /deposits/crypto", async ({ page }) => {
    await seedWalletSession(page);
    const lp = await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await page.getByTestId("lp-deposit-crypto").click();
    const sheet = page.getByTestId("lp-crypto-sheet");
    await expect(sheet.getByTestId("lp-address-text")).toHaveText(DEPOSIT_ADDRESS);
    await expect(sheet.getByRole("img", { name: /QR code/ })).toBeVisible();
    await expect(sheet.getByTestId("lp-from-rift")).toHaveCount(0); // external wallet: no Rift balance option
    await pickOption(page, "lp-chain", "Polygon");
    await sheet.getByTestId("lp-asset-USDT").click();
    await expect(sheet).toContainText("Send USDT on Polygon to");
    await expect(sheet.getByTestId("lp-sender-warning")).toContainText("your connected wallet");
    await expect(sheet.getByTestId("lp-sender-warning")).toContainText("0xabc0");

    await sheet.getByTestId("lp-sent-it").click();
    await sheet.getByTestId("lp-tx-hash").fill("0x1234");
    await expect(sheet.getByTestId("lp-submit-hash")).toBeDisabled();
    await expect(sheet.getByRole("alert")).toContainText("64 hex");
    const tx = "0x" + "d".repeat(64);
    await sheet.getByTestId("lp-tx-hash").fill(tx);
    await sheet.getByTestId("lp-submit-hash").click();
    await expect(sheet.getByTestId("lp-crypto-done")).toHaveAttribute("data-status", "pending");
    expect(lp.requests.find((r) => r.path === "/deposits/crypto")?.body).toEqual({ chain: "POLYGON", txHash: tx });
    await sheet.getByRole("button", { name: "Done" }).click();
    await page.getByTestId("lp-tab-deposits").click();
    await expect(page.getByTestId("lp-deposit-row")).toHaveCount(3);
  });

  test("local money: currency, amount, network, phone → POST /deposits/fiat → phone prompt", async ({ page }) => {
    await seedWalletSession(page);
    const lp = await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await page.getByTestId("lp-deposit-fiat").click();
    const sheet = page.getByTestId("lp-fiat-sheet");
    await expect(sheet.getByTestId("lp-fiat-submit")).toBeDisabled();
    await page.getByTestId("lp-fiat-currency").click();
    await page.getByRole("listbox").getByRole("option", { name: /Tanzanian Shilling/ }).click();
    await sheet.getByTestId("lp-fiat-amount").fill("50000");
    await pickOption(page, "lp-fiat-network", "Halotel");
    await sheet.getByTestId("lp-fiat-phone").fill("0712 345 678");
    await expect(sheet).toContainText("+255");
    await sheet.getByTestId("lp-fiat-submit").click();
    await expect(sheet.getByTestId("lp-fiat-prompt")).toContainText("Approve the prompt on your phone");
    await expect(sheet.getByTestId("lp-fiat-prompt")).toContainText("+255712345678");
    expect(lp.requests.find((r) => r.path === "/deposits/fiat")?.body).toEqual({ currency: "TZS", amount: 50000, phone: "+255712345678", network: "Halotel" });
  });

  test("Rift account: sign out clears this site's login and shows Sign in again", async ({ page }) => {
    await installLpMocks(page, { termsAccepted: true });
    await seedSession(page);
    await page.goto("/lp", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByTestId("lp-session")).toContainText("Rift account", { timeout: 30_000 });
    await page.getByTestId("lp-signout").click();
    await expect(page.getByTestId("lp-signin")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  });

  test("Rift account: deposit from my Rift wallet (passkey send) auto-submits the tx hash", async ({ page }) => {
    const state = newState();
    const auth = await attachVirtualAuthenticator(page);
    await seedCredential(auth, state);
    await installPasskeyBackend(page, state);
    const lp = await installLpMocks(page, { termsAccepted: true });
    await seedSession(page);
    await page.goto("/lp", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByTestId("lp-dashboard")).toBeVisible({ timeout: 30_000 });
    expect(lp.requests.find((r) => r.path === "/me")?.auth).toBe("Bearer test-access-token");

    await page.getByTestId("lp-deposit-crypto").click();
    const sheet = page.getByTestId("lp-crypto-sheet");
    await expect(sheet.getByTestId("lp-sender-warning")).toContainText("your Rift wallet");
    await sheet.getByTestId("lp-from-rift").click();
    await expect(sheet.getByTestId("lp-rift-deposit")).toContainText("Available on Base: 100");
    await sheet.getByTestId("lp-rift-amount").fill("500");
    await expect(sheet.getByTestId("lp-rift-send")).toBeDisabled();
    await sheet.getByTestId("lp-rift-amount").fill("25");
    await sheet.getByTestId("lp-rift-send").click();
    await expect(sheet.getByTestId("lp-crypto-done")).toBeVisible({ timeout: 20_000 });

    const preview = state.requests.find((r: any) => r.path.endsWith("/v1/transactions/preview"));
    expect(preview?.body).toMatchObject({ chain: "BASE", token: "USDC", recipient: DEPOSIT_ADDRESS, amount: "25" });
    expect(state.submits.at(-1)?.challengeOk).toBe(true);
    expect(lp.requests.find((r) => r.path === "/deposits/crypto")?.body).toEqual({ chain: "BASE", txHash: "0xtxhash" });
  });
});

test.describe("withdraw", () => {
  test("amount is capped by what's unlocked; locked part is explained", async ({ page }) => {
    await seedWalletSession(page);
    const lp = await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await page.getByTestId("lp-ticket-withdraw").click();
    await page.getByTestId("lp-withdraw").click();
    const sheet = page.getByTestId("lp-withdraw-sheet");
    await expect(sheet.getByTestId("lp-withdraw-max")).toHaveText("$5,000.00");
    await expect(sheet.getByTestId("lp-lock-explainer")).toContainText("$2,500.00 unlocks");
    await expect(sheet.getByTestId("lp-withdraw-address")).toHaveValue(LP_WALLET.toLowerCase());

    await sheet.getByTestId("lp-withdraw-amount").fill("6000");
    await expect(sheet.getByRole("alert")).toContainText("up to $5,000.00");
    await sheet.getByTestId("lp-withdraw-submit").click();
    expect(lp.requests.some((r) => r.path === "/withdrawals")).toBe(false);

    await sheet.getByTestId("lp-withdraw-amount").fill("5000");
    await pickOption(page, "lp-withdraw-chain", "Arbitrum");
    await sheet.getByRole("radio", { name: "USDT" }).click();
    await sheet.getByTestId("lp-withdraw-submit").click();
    await expect(sheet.getByTestId("lp-withdraw-done")).toBeVisible();
    expect(lp.requests.find((r) => r.path === "/withdrawals")?.body).toEqual({ amountUsd: 5000, chain: "ARBITRUM", asset: "USDT", toAddress: LP_WALLET.toLowerCase() });
  });

  test("everything locked: nothing can be requested", async ({ page }) => {
    await seedWalletSession(page);
    await openPublic(page, { termsAccepted: true, withdrawable: 0 });
    await page.goto("/lp");
    await page.getByTestId("lp-ticket-withdraw").click();
    await page.getByTestId("lp-withdraw").click();
    const sheet = page.getByTestId("lp-withdraw-sheet");
    await expect(sheet.getByTestId("lp-withdraw-submit")).toBeDisabled();
    await expect(sheet.getByTestId("lp-withdraw-submit")).toHaveText("Nothing to withdraw yet");
    await sheet.getByTestId("lp-withdraw-amount").fill("10");
    await expect(sheet.getByRole("alert")).toContainText("still locked");
  });
});

test.describe("entry points", () => {
  test("Yield is not in the wallet app: no sidebar/Advanced entry, /app/yield leaves for Yield", async ({ page, isMobile }) => {
    await installConsoleMocks(page, { rich: true });
    await installLpMocks(page, { termsAccepted: true });
    await page.goto("/app");
    if (isMobile) {
      await page.getByTestId("tab-advanced").click();
      await expect(page.getByTestId("advanced-list")).toBeVisible();
      await expect(page.getByTestId("advanced-yield")).toHaveCount(0);
    } else {
      await expect(page.getByTestId("nav-activity")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("nav-yield")).toHaveCount(0);
    }
    // Off production (localhost) the redirect lands on /lp; on wallet.riftfi.com it goes to lp.riftfi.com.
    await page.goto("/app/yield");
    await expect(page).toHaveURL(/\/lp$/);
  });

  test("lp.* host serves only Yield: / is the pool, /terms the terms, anything else goes home", async ({ page, baseURL }) => {
    await installLpMocks(page, { termsAccepted: false });
    const lpBase = baseURL!.replace("//localhost", "//lp.localhost").replace("//127.0.0.1", "//lp.localhost");
    await page.goto(`${lpBase}/`);
    await expect(page.getByTestId("lp-chrome")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("lp-terms-link").click();
    await expect(page).toHaveURL(/lp\.localhost:\d+\/terms$/);
    await page.goto(`${lpBase}/app/payments`);
    await expect(page).toHaveURL(/lp\.localhost:\d+\/$/);
    await expect(page.getByTestId("lp-chrome")).toBeVisible();
  });
});

/* ── Screenshots ─────────────────────────────────────────────────────── */

async function fullShot(page: Page, file: string) {
  // The page scrolls inside #main, so grow the viewport to the content.
  const width = page.viewportSize()!.width;
  const h = await page.evaluate(() => document.querySelector<HTMLElement>("#main")?.scrollHeight ?? document.body.scrollHeight);
  await page.setViewportSize({ width, height: Math.min(Math.max(h, 600), 6000) });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/${file}` });
}

test.describe("screenshots", () => {
  test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

  for (const scheme of ["light", "dark"] as const) {
    test(`public page (${scheme})`, async ({ page }, info) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.addInitScript((t) => localStorage.setItem("rift_theme", t), scheme);
      await openPublic(page);
      await page.goto("/lp");
      await expect(page.getByTestId("lp-stat-total")).toContainText("$");
      await expect(page.getByTestId("lp-activity-row")).toHaveCount(3);
      await page.waitForTimeout(400); // chart paints
      await fullShot(page, `public-${info.project.name === "mobile" ? 390 : 1440}-${scheme}.png`);
    });

    test(`dashboard (${scheme})`, async ({ page }, info) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.addInitScript((t) => localStorage.setItem("rift_theme", t), scheme);
      await seedWalletSession(page);
      await openPublic(page, { termsAccepted: true });
      await page.goto("/lp");
      await expect(page.getByTestId("lp-accruals")).toContainText("TZS");
      await page.waitForTimeout(400);
      await fullShot(page, `dashboard-${info.project.name === "mobile" ? 390 : 1440}-${scheme}.png`);
    });
  }

  test("terms gate", async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedWalletSession(page);
    await openPublic(page, { termsAccepted: false });
    await page.goto("/lp");
    await page.getByTestId("lp-deposit-crypto").click();
    await expect(page.getByTestId("lp-terms-body")).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/terms-gate-${info.project.name === "mobile" ? 390 : 1440}.png` });
  });

  test("deposit crypto sheet", async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedWalletSession(page);
    await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await page.getByTestId("lp-deposit-crypto").click();
    await expect(page.getByTestId("lp-address-text")).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/deposit-crypto-${info.project.name === "mobile" ? 390 : 1440}.png` });
  });

  test("tablet 768", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "one tablet pass is enough");
    await page.setViewportSize({ width: 768, height: 1024 });
    await seedWalletSession(page);
    await openPublic(page, { termsAccepted: true });
    await page.goto("/lp");
    await expect(page.getByTestId("lp-accruals")).toContainText("TZS");
    expect(await noHorizontalOverflow(page)).toBe(true);
    await fullShot(page, "dashboard-768-dark.png");
  });
});
