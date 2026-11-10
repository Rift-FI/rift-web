import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Screenshot capture of the console screens and money flows with the
 * backend mocked. Not part of the regular suite — run with:
 *   RIFT_SCREENSHOTS=1 RIFT_SCREENSHOT_DIR=<dir> npx playwright test console-screenshots
 */
const ENABLED = !!process.env.RIFT_SCREENSHOTS;
const OUT = process.env.RIFT_SCREENSHOT_DIR || "test-results/screens";
const ROWS = "[data-testid=payment-row]:visible";

async function shot(page: Page, name: string, project: string, fullPage = false) {
  // Hide the dev-only eruda console launcher.
  await page.addStyleTag({ content: "#eruda{display:none!important}" }).catch(() => undefined);
  await page.waitForTimeout(600);
  const size = project === "desktop" ? "1440x900" : "390x844";
  await page.screenshot({ path: path.join(OUT, `${name}-${size}.png`), fullPage });
}

test.describe("console screenshots", () => {
  test.skip(!ENABLED, "set RIFT_SCREENSHOTS=1 to capture screenshots");
  test.setTimeout(180_000);

  test("main screens", async ({ page }, info) => {
    const p = info.project.name;
    await installConsoleMocks(page, { rich: true });

    await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByTestId("balance-amount")).toContainText("14,860.80", { timeout: 20_000 });
    await expect(page.locator(ROWS).first()).toBeVisible({ timeout: 20_000 });
    await shot(page, "01-home", p);

    await page.goto("/app/payments");
    await expect(page.locator(ROWS).first()).toBeVisible({ timeout: 20_000 });
    await shot(page, "02-payments", p);
    await page.locator(ROWS).first().click();
    await expect(page.getByTestId("payment-drawer")).toBeVisible();
    await shot(page, "03-payment-detail-drawer", p);
    await page.keyboard.press("Escape");

    await page.goto("/app/send?method=wallet");
    await page.getByLabel("Wallet address").fill("0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a");
    await page.getByLabel("Amount", { exact: true }).fill("250");
    await shot(page, "04-send-wallet-form", p);
    await page.getByRole("button", { name: "Review transfer" }).click();
    await expect(page.getByRole("button", { name: "Approve with passkey" })).toBeEnabled({ timeout: 20_000 });
    await shot(page, "05-send-wallet-review", p);

    await page.goto("/app/receive");
    await expect(page.getByTestId("receive-address")).toContainText("0x7a3F", { timeout: 20_000 });
    await shot(page, "06-receive", p);

    await page.goto("/app/payment-links");
    await expect(page.getByText("Invoice #1042", { exact: false })).toBeVisible({ timeout: 20_000 });
    await shot(page, "07-payment-links", p);

    await page.goto("/app/approvals");
    await expect(page.getByRole("button", { name: /Send 250 USDC/ })).toBeVisible({ timeout: 20_000 });
    await shot(page, "08-approvals", p);

    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "Security" })).toBeVisible({ timeout: 20_000 });
    await shot(page, "09-settings", p);

    await page.goto("/app/settings/security/passkeys");
    await expect(page.getByTestId("passkey-row")).toHaveCount(2, { timeout: 20_000 });
    await shot(page, "10-settings-passkeys", p);

    await page.goto("/app/settings/connected-apps");
    await expect(page.getByRole("heading", { level: 1, name: "WalletConnect" })).toBeVisible({ timeout: 20_000 });
    await shot(page, "11-settings-walletconnect", p);
  });

  test("money flows", async ({ page }, info) => {
    const p = info.project.name;
    await installConsoleMocks(page, { rich: true });

    // Mobile-money payout: destination → recipient → pay from → amount → review.
    await page.goto("/app/send?method=mobile", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.getByRole("button", { name: /Kenya/ }).click();
    await shot(page, "12-payout-type", p);
    await page.getByRole("button", { name: /Send Money/ }).click();
    await page.getByRole("button", { name: "Safaricom" }).click();
    await page.getByPlaceholder("0712 345 678").fill("0712345678");
    await page.getByPlaceholder("e.g., John Doe").fill("Jane Wanjiru");
    await shot(page, "13-payout-recipient", p);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByTestId("source-base-usdc").click();
    await page.getByLabel("Recipient gets").fill("5000");
    await shot(page, "14-payout-amount", p);
    await page.getByRole("button", { name: "Continue to review" }).click();
    await expect(page.getByRole("button", { name: /with passkey/ })).toBeEnabled({ timeout: 20_000 });
    await shot(page, "15-payout-review", p);

    // Withdraw to the saved payout account.
    await page.goto("/app/withdraw");
    await page.getByTestId("source-base-usdc").click({ timeout: 20_000 });
    await page.getByLabel("You receive").fill("2000");
    await page.getByRole("button", { name: "Continue to review" }).click();
    await expect(page.getByRole("button", { name: /with passkey/ })).toBeEnabled({ timeout: 20_000 });
    await shot(page, "16-withdraw-review", p);

    // Payment request → link card with QR.
    await page.goto("/app/request?type=request");
    await page.getByLabel("Amount to request").fill("2400");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Description", { exact: true }).fill("Invoice #1043 — cold-chain logistics");
    await page.getByRole("button", { name: "Create payment link" }).click();
    await expect(page.getByTestId("payment-link-card")).toBeVisible({ timeout: 20_000 });
    await shot(page, "17-payment-link-created", p);

    // Add funds (onramp) with fee breakdown.
    await page.goto("/app/request?type=topup");
    await page.getByLabel("Currency").selectOption("KES");
    await page.getByLabel("Amount to add").fill("10000");
    await shot(page, "18-add-funds", p);

    // Move funds between networks.
    await page.goto("/app/convert");
    await page.waitForTimeout(1500);
    await shot(page, "19-move-funds", p);

    // Dark mode samples.
    await page.evaluate(() => localStorage.setItem("rift_theme", "dark"));
    await page.goto("/app");
    await expect(page.getByTestId("balance-amount")).toContainText("14,860.80", { timeout: 20_000 });
    await shot(page, "20-home-dark", p);
    await page.goto("/app/payments");
    await expect(page.locator(ROWS).first()).toBeVisible({ timeout: 20_000 });
    await shot(page, "21-payments-dark", p);
    await page.goto("/app/withdraw");
    await page.getByTestId("source-base-usdc").click({ timeout: 20_000 });
    await page.getByLabel("You receive").fill("2000");
    await page.getByRole("button", { name: "Continue to review" }).click();
    await expect(page.getByRole("button", { name: /with passkey/ })).toBeEnabled({ timeout: 20_000 });
    await shot(page, "22-withdraw-review-dark", p);
  });

  test("sign in", async ({ page }, info) => {
    await page.route("**/api/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await page.route("https://*.riftfi.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByText("Open an account")).toBeVisible({ timeout: 20_000 });
    await shot(page, "23-sign-in", info.project.name);
  });
});
