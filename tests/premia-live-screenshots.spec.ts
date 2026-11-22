import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import { AbiCoder, Contract, JsonRpcProvider, formatUnits, id } from "ethers";
import { installConsoleMocks, WALLET } from "./helpers/console-mocks";

/**
 * PREMIA screenshots against LIVE Base-mainnet contract reads.
 *
 * The Rift API is mocked (so the console shell renders signed in) but the Base
 * RPC is NOT: every PREMIA number on these screens is a real contract read.
 *
 *   RIFT_SCREENSHOTS=1 npx playwright test premia-live-screenshots
 *
 * Set PREMIA_FORK_RPC=http://127.0.0.1:8545 to point the RPC at an anvil fork
 * of Base instead — same contracts, but a trader that has already funded and
 * opened a position, so the funded screens have real content. Without it
 * those tests are skipped.
 */
const ENABLED = !!process.env.RIFT_SCREENSHOTS;
const OUT = process.env.RIFT_SCREENSHOT_DIR || "test-results/premia";
const FORK = process.env.PREMIA_FORK_RPC || "";
/** anvil account #0 — the trader seeded on the fork. */
const FORK_TRADER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const BASE_RPC = /base-rpc\.publicnode\.com|base\.drpc\.org|mainnet\.base\.org/i;

/* ── live ground truth, read independently of the app ───────────────────── */

const NGN_MARKET = "0xa2F5e7CE731b1ed1e7bc0501eAEF451685AA3dE7";
const MARKET_ABI = [
  "function openInterestCap() view returns (uint256)",
  "function payoutNow() view returns (uint256)",
  "function markPrice() view returns (uint256)",
  "function state() view returns (uint8)",
];

/** Matches the app's fmtPrmCompact(n, false) — no currency symbol, ever. */
function compactBare(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString("en-US");
}

async function onChainTruth() {
  const p = new JsonRpcProvider("https://base-rpc.publicnode.com", 8453, { staticNetwork: true });
  const m = new Contract(NGN_MARKET, MARKET_ABI, p);
  const [cap, payout, mark, state] = await Promise.all([
    m.openInterestCap() as Promise<bigint>,
    m.payoutNow() as Promise<bigint>,
    m.markPrice() as Promise<bigint>,
    m.state() as Promise<bigint>,
  ]);
  return {
    capBare: compactBare(Number(formatUnits(cap, 18))),
    payout: Number(formatUnits(payout, 18)),
    mark: Number(formatUnits(mark, 18)),
    state: Number(state),
  };
}

/* ── harness ────────────────────────────────────────────────────────────── */

/** Let PREMIA's Base reads reach the real chain (the console mock stubs RPCs). */
async function useRealBase(page: Page) {
  await page.unroute(BASE_RPC).catch(() => undefined);
  await page.route(BASE_RPC, (route) => route.continue());
}

/** Proxy PREMIA's Base reads to a local anvil fork. */
async function useForkedBase(page: Page) {
  await page.route(BASE_RPC, async (route) => {
    const res = await fetch(FORK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: route.request().postData() ?? "",
    });
    route.fulfill({
      status: res.status,
      contentType: "application/json",
      body: await res.text(),
      headers: { "access-control-allow-origin": "*" },
    });
  });
}

/**
 * The chart can only draw a line once the oracle has published more than once,
 * and on mainnet it has published exactly once — so every live screenshot
 * shows the honest single-reading fallback and the plotting path never runs.
 *
 * This injects N synthetic `IndexPushed` logs into the RPC response so the
 * real chart code renders a real series. Everything else on the page stays
 * live; only the oracle's history is substituted.
 */
async function withSyntheticOracleHistory(page: Page, days = 30) {
  const coder = AbiCoder.defaultAbiCoder();
  const TOPIC = id("IndexPushed(bytes32,uint64,int256,int256,int256,uint32,uint64)");
  const MARKET_ID = "0x073b4c4094438f226383e78329ff6ff51bea64fc33fc05785a8b5e7555556338";
  const word = (n: bigint) => (n < 0n ? (1n << 256n) + n : n).toString(16).padStart(64, "0");

  const today = Math.floor(Date.now() / 86_400_000);
  const logs = Array.from({ length: days }, (_, i) => {
    const day = today - (days - 1 - i);
    // a plausible walk: the index drifts up from 0 toward ~4%
    const x = BigInt(Math.round((0.004 + 0.035 * (i / days) + 0.004 * Math.sin(i / 3)) * 1e18));
    const data =
      "0x" +
      word(x) +
      word(x) +
      word(BigInt(Math.round(-4 * 1e18))) +
      word(5n) +
      word(BigInt(day * 86_400));
    return {
      address: "0x93d1dbac87accf85c3070eedd9eed0ad699b7090",
      topics: [TOPIC, MARKET_ID, "0x" + day.toString(16).padStart(64, "0")],
      data,
      blockNumber: "0x" + (60_887_800 + i).toString(16),
      transactionHash: "0x" + "ab".repeat(32),
      logIndex: "0x0",
      blockHash: "0x" + "cd".repeat(32),
      transactionIndex: "0x0",
      removed: false,
    };
  });
  void coder;

  await page.unroute(BASE_RPC).catch(() => undefined);
  await page.route(BASE_RPC, async (route) => {
    const body = route.request().postData() ?? "";
    // Only the oracle's getLogs is substituted; everything else goes to chain.
    if (body.includes("eth_getLogs") && body.toLowerCase().includes("93d1dbac87accf85c3070eedd9eed0ad699b7090")) {
      const req = JSON.parse(body);
      const one = Array.isArray(req) ? req[0] : req;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(Array.isArray(req) ? [{ jsonrpc: "2.0", id: one.id, result: logs }] : { jsonrpc: "2.0", id: one.id, result: logs }),
      });
    }
    return route.continue();
  });
}

async function shot(page: Page, name: string, project: string, theme: string) {
  await page.addStyleTag({ content: "#eruda{display:none!important}" }).catch(() => undefined);
  await page.waitForTimeout(600);
  const size = project === "desktop" ? "1440x900" : "390x844";
  await page.screenshot({ path: path.join(OUT, `${name}-${theme}-${size}.png`) });
}

/**
 * PREMIA is invite-only, so every screen needs the access check answered.
 * `hasAccess: false` is the state a signed-in stranger is in.
 */
async function withBetaAccess(page: Page, hasAccess: boolean) {
  await page.route("**/v1/premia/beta/**", (route) => {
    const url = route.request().url();
    if (url.includes("/validate")) {
      const body = route.request().postData() ?? "";
      // the real API answers { valid:false, reason } for a code it refuses
      if (body.includes("EXHAUSTEDCODE")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ valid: false, reason: "exhausted" }),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true }) });
    }
    if (url.includes("/redeem")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, code: "X4gH89kLQ89K", redeemedAt: new Date().toISOString() }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(hasAccess ? { hasAccess: true, code: "X4gH89kLQ89K" } : { hasAccess: false }),
    });
  });
}

async function boot(page: Page, theme: string, address?: string, ack = true) {
  await page.addInitScript((t) => localStorage.setItem("rift_theme", t), theme);
  await installConsoleMocks(page, { rich: true });
  const addr = address ?? WALLET;
  await page.addInitScript((a) => localStorage.setItem("address", a), addr);
  if (ack) {
    await page.addInitScript((a) => localStorage.setItem(`premia:ack:v1:${a}`, "1"), addr.toLowerCase());
  }
  await withBetaAccess(page, true);
}

/**
 * prmUSD is a valueless test token, so a "$" next to any PREMIA quantity would
 * let a user believe they made or lost real money. Prices in "¢" are the
 * prediction-market convention for hundredths of a UNIT and are allowed; a
 * currency-formatted dollar figure is not.
 */
async function expectNoDollarAmounts(page: Page) {
  const body = (await page.locator("body").innerText()) || "";
  const offenders = body.match(/\$\s?[\d.,]+/g) ?? [];
  expect(offenders, `rendered a dollar amount: ${offenders.join(", ")}`).toHaveLength(0);
}

/* ── tests ──────────────────────────────────────────────────────────────── */

for (const theme of ["light", "dark"] as const) {
  test.describe(`PREMIA (${theme})`, () => {
    test.skip(!ENABLED, "set RIFT_SCREENSHOTS=1 to capture screenshots");
    test.setTimeout(180_000);

    test("markets list + market page, live Base reads", async ({ page }, info) => {
      const p = info.project.name;
      const truth = await onChainTruth();
      await boot(page, theme);
      await useRealBase(page);

      await page.goto("/app/markets", { waitUntil: "domcontentloaded", timeout: 90_000 });
      // the market grid is the page now — the stats subtitle was deleted
      await expect(page.getByTestId("market-card-ngn-usdt-premium")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId("premia-header-stats")).toHaveCount(0);
      // the standing "not money" marker
      await expect(page.getByTestId("premia-test-badge").first()).toBeVisible();
      await expectNoDollarAmounts(page);
      await shot(page, "01-markets", p, theme);

      await page.getByTestId("market-card-ngn-usdt-premium").click();
      // the question is the page
      await expect(page.getByRole("heading", { level: 1 })).toContainText("street-dollar premium", { timeout: 60_000 });
      await expect(page.getByTestId("stat-oi-cap")).toContainText(truth.capBare, { timeout: 60_000 });
      await expect(page.getByTestId("stat-payout")).toContainText(truth.payout === 0 ? "0%" : ".");
      await expect(page.getByTestId("premia-chart")).toBeVisible();
      await expectNoDollarAmounts(page);
      await shot(page, "02-market", p, theme);

      // Standing marker on every screen. The *consent* now happens once, at
      // the invite terms; the line under Trade is asserted on the ticket.
      await expect(page.getByTestId("premia-test-badge").first()).toBeVisible();

      await page.getByRole("button", { name: "How this works" }).click();
      await expect(page.getByTestId("market-address")).toContainText("0xa2F5e7CE");
      await shot(page, "03-how-it-works", p, theme);
    });

    test("the ticket: two outcomes priced in cents", async ({ page }, info) => {
      test.skip(!FORK, "set PREMIA_FORK_RPC to capture the funded ticket");
      const p = info.project.name;
      await boot(page, theme, FORK_TRADER);
      await useForkedBase(page);

      await page.goto("/app/markets/ngn-usdt-premium", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("trade-panel")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId("side-rise")).toContainText("¢");
      await expect(page.getByTestId("side-fall")).toContainText("¢");
      // a calm market quotes a 1¢/99¢ pair — neither side may collapse to "0¢"
      await expect(page.getByTestId("side-rise")).not.toContainText(/\s0¢/);
      // the standing one-liner lives under the Trade button
      await expect(page.getByTestId("premia-fine-print")).toContainText(/no monetary value/i);
      await shot(page, "04-ticket", p, theme);

      await page.getByTestId("trade-amount").fill("500");
      await expect(page.getByText("To win")).toBeVisible({ timeout: 30_000 });
      await expectNoDollarAmounts(page);
      await shot(page, "05-ticket-sized", p, theme);

      // the book
      await expect(page.getByTestId("premia-book")).toBeVisible();
      await expect(page.getByTestId("position-ngn-usdt-premium-rise")).toBeVisible({ timeout: 30_000 });
      await page.getByTestId("premia-book").scrollIntoViewIfNeeded();
      await shot(page, "06-positions", p, theme);
    });

    test("request beta is the only call to action when unfunded", async ({ page }, info) => {
      const p = info.project.name;
      await boot(page, theme, "0x000000000000000000000000000000000000dEaD", false);
      await useRealBase(page);

      await page.goto("/app/markets", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("premia-beta-gate")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId("premia-request-beta")).toBeVisible();
      // the amount must be the contract's, read from chain — never a config guess
      await expect(page.getByTestId("premia-grant-amount")).toContainText("10,000", { timeout: 60_000 });
      await expect(page.getByTestId("premia-grant-amount")).toContainText("prmUSD");
      await expectNoDollarAmounts(page);
      await shot(page, "07-request-beta", p, theme);
    });

    test("an uninvited user sees no trace of PREMIA", async ({ page }, info) => {
      const p = info.project.name;
      await boot(page, theme);
      // the only difference from every other test: no redeemed invite
      await withBetaAccess(page, false);
      await useRealBase(page);

      await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("tab-home").or(page.getByRole("link", { name: "Home" })).first()).toBeVisible({
        timeout: 60_000,
      });
      // not a disabled tab, not a locked card — absent
      await expect(page.getByRole("link", { name: "Markets" })).toHaveCount(0);
      await expect(page.getByTestId("tab-markets")).toHaveCount(0);
      await shot(page, "08a-no-access-home", p, theme);

      // and typing the URL gets them nowhere
      await page.goto("/app/markets", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page).toHaveURL(/\/app(\?|$|#)/, { timeout: 30_000 });
      await expect(page.getByTestId("premia-market-grid")).toHaveCount(0);
      await shot(page, "08b-no-access-redirect", p, theme);
    });

    test("the invite link admits a user", async ({ page }, info) => {
      const p = info.project.name;
      await boot(page, theme);
      // arrives without access; the redeem is what grants it
      await withBetaAccess(page, false);
      await useRealBase(page);

      await page.goto("/premia?code=X4gH89kLQ89K", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("premia-redeem")).toBeVisible({ timeout: 60_000 });
      // the consent moment has to state what prmUSD is
      await expect(page.locator("body")).toContainText(/no monetary value/i);
      await expect(page.locator("body")).toContainText(/not redeemable/i);
      // and it cannot be skipped
      await expect(page.getByTestId("premia-redeem")).toBeDisabled();
      await shot(page, "08c-invite", p, theme);

      await page.getByTestId("premia-accept-terms").check();
      await expect(page.getByTestId("premia-redeem")).toBeEnabled();
      await page.getByTestId("premia-redeem").click();
      await expect(page).toHaveURL(/\/app\/markets/, { timeout: 30_000 });
      await shot(page, "08d-invite-done", p, theme);
    });

    test("a refused invite says why and admits nobody", async ({ page }, info) => {
      const p = info.project.name;
      await boot(page, theme);
      await withBetaAccess(page, false);
      await useRealBase(page);

      await page.goto("/premia?code=EXHAUSTEDCODE", { waitUntil: "domcontentloaded", timeout: 90_000 });
      // the API's machine reason becomes copy, not a leaked token
      await expect(page.locator("body")).toContainText(/already been used/i, { timeout: 60_000 });
      await expect(page.locator("body")).not.toContainText("exhausted");
      await expect(page.getByTestId("premia-redeem")).toHaveCount(0);
      await expect(page.getByTestId("premia-accept-terms")).toHaveCount(0);
      await shot(page, "08e-invite-refused", p, theme);
    });

    test("the chart plots a series once the oracle has history", async ({ page }, info) => {
      const p = info.project.name;
      await boot(page, theme);
      await withSyntheticOracleHistory(page, 30);
      await page.goto("/app/markets/ngn-usdt-premium", { waitUntil: "domcontentloaded", timeout: 90_000 });

      // the real plotting path, not the single-reading fallback
      await expect(page.getByTestId("premia-chart-plot")).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('[data-testid="premia-chart"] canvas').first()).toBeVisible();
      await page.waitForTimeout(1200);
      await expectNoDollarAmounts(page);
      await shot(page, "11-chart", p, theme);
    });

    test("portfolio", async ({ page }, info) => {
      test.skip(!FORK, "set PREMIA_FORK_RPC to capture a funded portfolio");
      const p = info.project.name;
      await boot(page, theme, FORK_TRADER);
      await useForkedBase(page);

      await page.goto("/app/portfolio", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("premia-portfolio-summary")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId("position-ngn-usdt-premium-rise")).toBeVisible({ timeout: 30_000 });
      await expectNoDollarAmounts(page);
      await shot(page, "09-portfolio", p, theme);

      // points are derived from the same fills — a held position earns
      await page.getByRole("button", { name: "Points" }).click();
      await expect(page.getByTestId("premia-points-value")).not.toHaveText("0");
      await shot(page, "10-points", p, theme);
    });
  });
}
