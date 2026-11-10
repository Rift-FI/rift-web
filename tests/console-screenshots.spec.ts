import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Screenshots of the wallet with the backend mocked, light + dark.
 * Not part of the regular suite — run with:
 *   RIFT_SCREENSHOTS=1 RIFT_SCREENSHOT_DIR=<dir> npx playwright test console-screenshots
 */
const ENABLED = !!process.env.RIFT_SCREENSHOTS;
const OUT = process.env.RIFT_SCREENSHOT_DIR || "test-results/screens";
const ROWS = "[data-testid=payment-row]:visible";
const ADDR = "0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a";

async function shot(page: Page, name: string, project: string, theme: string) {
  await page.addStyleTag({ content: "#eruda{display:none!important}" }).catch(() => undefined);
  await page.waitForTimeout(700);
  const size = project === "desktop" ? "1440x900" : "390x844";
  await page.screenshot({ path: path.join(OUT, `${name}-${theme}-${size}.png`) });
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`screenshots (${theme})`, () => {
    test.skip(!ENABLED, "set RIFT_SCREENSHOTS=1 to capture screenshots");
    test.setTimeout(240_000);

    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("rift_theme", t), theme);
    });

    test("home + activity", async ({ page }, info) => {
      const p = info.project.name;
      await installConsoleMocks(page, { rich: true });
      await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("balance-amount")).toContainText("14,860.80", { timeout: 20_000 });
      await expect(page.getByTestId("rate-KES")).toContainText("129", { timeout: 20_000 });
      await shot(page, "01-home", p, theme);
      await page.getByTestId("balance-currency").click();
      await expect(page.getByTestId("currency-picker")).toBeVisible();
      await shot(page, "02-currency-sheet", p, theme);
      await page.keyboard.press("Escape");

      await page.goto("/app/payments");
      await expect(page.locator(ROWS).first()).toBeVisible({ timeout: 20_000 });
      await shot(page, "03-activity", p, theme);
      await page.locator(ROWS).first().click();
      await expect(page.getByTestId("receipt")).toBeVisible();
      await shot(page, "04-activity-receipt", p, theme);
      await page.keyboard.press("Escape");
      await page.getByTestId("open-statement").click();
      await expect(page.getByTestId("statement-sheet")).toBeVisible();
      await shot(page, "05-statement", p, theme);
    });

    test("send", async ({ page }, info) => {
      const p = info.project.name;
      await installConsoleMocks(page, { rich: true });
      await page.goto("/app/send?method=mobile", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 20_000 });
      await page.getByRole("button", { name: "Safaricom" }).click();
      await page.getByPlaceholder("0712 345 678").fill("0712345678");
      await expect(page.getByTestId("beneficiary")).toContainText("JANE WANJIRU", { timeout: 20_000 });
      await shot(page, "06-send-mobile-name", p, theme);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByLabel("Recipient gets").fill("5000");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Continue to review" }).click({ timeout: 20_000 });
      await expect(page.getByRole("button", { name: /with passkey/ })).toBeEnabled({ timeout: 20_000 });
      await shot(page, "07-send-review", p, theme);

      await page.goto("/app/send?method=till");
      await page.getByPlaceholder("123456").fill("123456");
      await expect(page.getByTestId("beneficiary")).toContainText("KILIMO", { timeout: 20_000 });
      await shot(page, "08-send-till", p, theme);

      await page.goto("/app/send?method=wallet");
      await page.getByLabel("Wallet address").fill(ADDR);
      await page.getByLabel("Amount", { exact: true }).fill("13000");
      await expect(page.getByTestId("move-first")).toBeVisible({ timeout: 20_000 });
      await shot(page, "09-send-wallet-move-first", p, theme);

      await page.goto("/app/withdraw");
      await page.getByLabel("You receive").fill("2000");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Continue to review" }).click({ timeout: 20_000 });
      await expect(page.getByRole("button", { name: /with passkey/ })).toBeEnabled({ timeout: 20_000 });
      await shot(page, "10-withdraw-review", p, theme);
    });

    test("add funds", async ({ page }, info) => {
      const p = info.project.name;
      await installConsoleMocks(page, { rich: true });
      await page.goto("/app/add-funds", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.getByTestId("buy-currency").click({ timeout: 20_000 });
      await page.getByRole("option", { name: /Nigeria/ }).click();
      await page.getByLabel("Amount").fill("5000");
      await expect(page.getByTestId("buy-quote")).toContainText("USDC", { timeout: 20_000 });
      await shot(page, "11-buy", p, theme);
      await page.getByTestId("buy-continue").click();
      await expect(page.getByTestId("deposit-instructions")).toBeVisible({ timeout: 20_000 });
      await shot(page, "12-buy-instructions", p, theme);
      await expect(page.getByTestId("receipt")).toBeVisible({ timeout: 30_000 });
      await shot(page, "13-buy-completed", p, theme);

      await page.goto("/app/add-funds?tab=link");
      await page.getByLabel("Amount to request").fill("2400");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByLabel("Description", { exact: true }).fill("Invoice #1043");
      await page.getByRole("button", { name: "Create payment link" }).click();
      await expect(page.getByTestId("payment-link-card")).toBeVisible({ timeout: 20_000 });
      await shot(page, "14-payment-link", p, theme);

      await page.goto("/app/add-funds?tab=address");
      await expect(page.getByTestId("receive-address")).toContainText("0x7a3F", { timeout: 20_000 });
      await shot(page, "15-address", p, theme);
    });

    test("settings + advanced", async ({ page }, info) => {
      const p = info.project.name;
      await installConsoleMocks(page, { rich: true, kycVerified: false });
      await page.goto("/app/settings", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible({ timeout: 20_000 });
      await shot(page, "16-settings", p, theme);
      await page.goto("/app/settings/security/passkeys");
      await expect(page.getByTestId("passkey-row")).toHaveCount(2, { timeout: 20_000 });
      await shot(page, "17-passkeys", p, theme);
      await page.goto("/app/advanced");
      await expect(page.getByTestId("advanced-list")).toBeVisible({ timeout: 20_000 });
      await shot(page, "18-advanced", p, theme);
      await page.goto("/app/advanced/swap");
      await expect(page.getByTestId("swap-panel")).toBeVisible({ timeout: 20_000 });
      await shot(page, "19-swap", p, theme);
      await page.goto("/app/approvals");
      await expect(page.getByRole("button", { name: /Send 250 USDC/ })).toBeVisible({ timeout: 20_000 });
      await shot(page, "20-approvals", p, theme);
    });
  });
}

test("sign in screenshot", async ({ page }, info) => {
  test.skip(!ENABLED, "set RIFT_SCREENSHOTS=1 to capture screenshots");
  await page.route("**/api/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("https://*.riftfi.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page.getByText("Open an account")).toBeVisible({ timeout: 20_000 });
  await shot(page, "21-sign-in", info.project.name, "light");
});
