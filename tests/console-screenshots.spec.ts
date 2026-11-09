import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Screenshot capture of the main console screens with the backend mocked.
 * Not part of the regular suite — run with:
 *   RIFT_SCREENSHOTS=1 RIFT_SCREENSHOT_DIR=<dir> npx playwright test console-screenshots
 */
const ENABLED = !!process.env.RIFT_SCREENSHOTS;
const OUT = process.env.RIFT_SCREENSHOT_DIR || "test-results/screens";

test.describe("console screenshots", () => {
  test.skip(!ENABLED, "set RIFT_SCREENSHOTS=1 to capture screenshots");
  test.setTimeout(120_000);

  async function shot(page: Page, name: string, project: string) {
    // Hide the dev-only eruda console launcher.
    await page.addStyleTag({ content: "#eruda{display:none!important}" }).catch(() => undefined);
    await page.waitForTimeout(600);
    const size = project === "desktop" ? "1440x900" : "390x844";
    await page.screenshot({ path: path.join(OUT, `${name}-${size}.png`) });
  }

  test("main screens", async ({ page }, info) => {
    const p = info.project.name;
    await installConsoleMocks(page, { rich: true });

    await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByTestId("balance-amount")).toContainText("14,860.80", { timeout: 20_000 });
    await expect(page.locator("[data-testid=payment-row]:visible").first()).toBeVisible({ timeout: 20_000 });
    await shot(page, "01-home", p);

    await page.goto("/app/payments");
    await expect(page.locator("[data-testid=payment-row]:visible").first()).toBeVisible({ timeout: 20_000 });
    await shot(page, "02-payments", p);
    await page.locator("[data-testid=payment-row]:visible").first().click();
    await expect(page.getByTestId("payment-drawer")).toBeVisible();
    await shot(page, "03-payment-detail-drawer", p);
    await page.keyboard.press("Escape");

    await page.goto("/app/send?method=mobile");
    await expect(page.getByText("Destination country")).toBeVisible({ timeout: 20_000 });
    await shot(page, "04-send-mobile-money", p);

    await page.goto("/app/send?method=wallet");
    await page.getByLabel("Wallet address").fill("0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a");
    await page.getByLabel("Amount", { exact: true }).fill("250");
    await shot(page, "05-send-wallet-form", p);
    await page.getByRole("button", { name: "Review transfer" }).click();
    await expect(page.getByRole("button", { name: "Approve with passkey" })).toBeEnabled({ timeout: 20_000 });
    await shot(page, "06-send-wallet-review", p);

    await page.goto("/app/receive");
    await expect(page.getByTestId("receive-address")).toContainText("0x7a3F", { timeout: 20_000 });
    await shot(page, "07-receive", p);

    await page.goto("/app/payment-links");
    await expect(page.getByText("Invoice #1042", { exact: false })).toBeVisible({ timeout: 20_000 });
    await shot(page, "08-payment-links", p);

    await page.goto("/app/approvals");
    await expect(page.getByRole("button", { name: /Send 250 USDC/ })).toBeVisible({ timeout: 20_000 });
    await shot(page, "09-approvals", p);

    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "Security" })).toBeVisible({ timeout: 20_000 });
    await shot(page, "10-settings", p);

    await page.goto("/app/settings/security/passkeys");
    await expect(page.getByTestId("passkey-row")).toHaveCount(2, { timeout: 20_000 });
    await shot(page, "11-settings-passkeys", p);

    // Dark mode sample.
    await page.evaluate(() => localStorage.setItem("rift_theme", "dark"));
    await page.goto("/app");
    await expect(page.getByTestId("balance-amount")).toContainText("14,860.80", { timeout: 20_000 });
    await shot(page, "12-home-dark", p);
  });
});
