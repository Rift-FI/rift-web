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
    return route.fulfill({ json: { id: "v3_pretium_1", status: "refunding", message: "Refund queued" } });
  });
  await page.goto("/app/payments");
  await page.getByPlaceholder("Reference, address, amount").fill("v3_pretium_1");
  await page.locator("[data-testid=payment-row]:visible").first().click();
  await page.getByTestId("refund-button").click();
  await page.getByTestId("refund-confirm").click();
  await expect(page.getByTestId("refund-action")).toContainText("Refund started");
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
