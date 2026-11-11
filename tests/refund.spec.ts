import { test, expect } from "@playwright/test";
import { installConsoleMocks } from "./helpers/console-mocks";

// Failed Pretium payouts show "Request refund" in the payment sheet; it posts
// once to /v1/offramps/:orderId/refund and reports that the refund started.
test("failed Pretium payout → Request refund → refund started", async ({ page }) => {
  await installConsoleMocks(page, { rich: true });
  const failed = {
    id: "lf1",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    type: "offramp",
    direction: "debit",
    status: "failed",
    providerStatus: "pretium_failed",
    amount: 3.85,
    token: "USDC",
    chain: "BASE",
    fiatAmount: 10000,
    fiatCurrency: "TZS",
    counterparty: { phone: "255744100357" },
    reference: "v3_pretium_1",
    txHash: "0xfailed",
    provider: "pretium",
    orderId: "v3_pretium_1",
    refundable: true,
  };
  const refundCalls: string[] = [];
  await page.route(/\/v1\/ledger(\?.*)?$/, (route) => route.fulfill({ json: { entries: [failed], nextCursor: null } }));
  await page.route(/\/v1\/offramps\/[^/]+\/refund$/, (route) => {
    refundCalls.push(route.request().url());
    return route.fulfill({ json: { id: "v3_pretium_1", status: "refunded", message: "Refunded to your wallet" } });
  });
  await page.goto("/app/payments");
  await page.getByPlaceholder("Reference, address, amount").fill("v3_pretium_1");
  await page.locator("[data-testid=payment-row]:visible").first().click();
  await page.getByTestId("refund-button").click();
  await page.getByTestId("refund-confirm").click();
  await expect(page.getByTestId("refund-action")).toContainText("Refunded to your wallet");
  await expect(page.getByTestId("refund-action")).not.toContainText(/pretium|paycrest/i);
  expect(refundCalls).toHaveLength(1);
  expect(refundCalls[0]).toContain("/v1/offramps/v3_pretium_1/refund");
});

test("completed payouts have no refund button", async ({ page }) => {
  await installConsoleMocks(page, { rich: true });
  await page.goto("/app/payments");
  await page.locator("[data-testid=payment-row]:visible").first().click();
  await expect(page.getByTestId("receipt")).toBeVisible();
  await expect(page.getByTestId("refund-button")).toHaveCount(0);
});

test("a payment being resolved by the team says so", async ({ page }) => {
  await installConsoleMocks(page, { rich: true });
  const held = { id: "lh1", createdAt: new Date().toISOString(), type: "offramp", direction: "debit", status: "processing", providerStatus: "underfunded", amount: 1.48, token: "USDC", chain: "BASE", fiatAmount: 4000, fiatCurrency: "TZS", counterparty: { phone: "255744100357" }, reference: "v3_held_1", orderId: "v3_held_1", attention: true, refundable: false };
  await page.route(/\/v1\/ledger(\?.*)?$/, (route) => route.fulfill({ json: { entries: [held], nextCursor: null } }));
  await page.goto("/app/payments");
  await page.getByPlaceholder("Reference, address, amount").fill("v3_held_1");
  await page.locator("[data-testid=payment-row]:visible").first().click();
  await expect(page.getByTestId("attention-note")).toContainText("Your money is safe");
  await expect(page.getByTestId("refund-button")).toHaveCount(0);
});

test("failed Rift-run payout → Retry payment (main action), no stuck refund", async ({ page }) => {
  await installConsoleMocks(page, { rich: true });
  const failed = { id: "lr1", createdAt: new Date().toISOString(), type: "offramp", direction: "debit", status: "refunding", providerStatus: "refund_pending", amount: 2.26, token: "USDC", chain: "BASE", fiatAmount: 6000, fiatCurrency: "TZS", counterparty: { phone: "255744100357" }, reference: "v3_retry_1", orderId: "v3_retry_1", provider: "pretium_virtual", retryable: true, refundable: false };
  const retryCalls: string[] = [];
  await page.route(/\/v1\/ledger(\?.*)?$/, (route) => route.fulfill({ json: { entries: [failed], nextCursor: null } }));
  await page.route(/\/v1\/offramps\/[^/]+\/retry$/, (route) => {
    retryCalls.push(route.request().url());
    return route.fulfill({ json: { id: "v3_retry_1", status: "processing", message: "Sending again" } });
  });
  await page.goto("/app/payments");
  await page.getByPlaceholder("Reference, address, amount").fill("v3_retry_1");
  await page.locator("[data-testid=payment-row]:visible").first().click();
  await expect(page.getByTestId("refund-button")).toHaveCount(0);
  await page.getByTestId("retry-button").click();
  await expect(page.getByTestId("retry-action")).toContainText("sending it again");
  expect(retryCalls).toHaveLength(1);
});
