import { test, expect, Page } from "@playwright/test";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Payments console: navigation, responsive layout, payments table + detail
 * drawer, send form validation, payout rails and settings scope.
 *
 * Backend is fully mocked (tests/helpers/console-mocks.ts); a dummy token
 * in localStorage lets the authenticated shell mount.
 */

const KENYA_BANKS_FIXTURE = [
  { id: "equity", name: "Equity Bank", paybill: "247247", accountHint: "Account" },
  { id: "kcb", name: "KCB Bank", paybill: "522522", accountHint: "Account" },
  { id: "ncba", name: "NCBA Bank", paybill: "880100", accountHint: "Account" },
  { id: "coop", name: "Co-operative Bank", paybill: "400200", accountHint: "Account" },
];

const ROUTES = ["/app", "/app/payments", "/app/send", "/app/send?method=wallet", "/app/receive", "/app/payment-links", "/app/approvals", "/app/settings", "/app/settings/security/passkeys"];

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const main = document.querySelector<HTMLElement>("#main");
    return {
      doc: doc.scrollWidth <= doc.clientWidth + 1,
      main: !main || main.scrollWidth <= main.clientWidth + 1,
    };
  });
}

test.describe("console navigation", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page);
  });

  test("desktop: sidebar lists the payments IA and every item navigates", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "desktop-only");
    await page.goto("/app");
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar).toBeVisible();
    await expect(page.getByTestId("mobile-tabs")).toBeHidden();

    const items: [string, RegExp, string][] = [
      ["Payments", /\/app\/payments$/, "Payments"],
      ["Send", /\/app\/send$/, "Send money"],
      ["Receive", /\/app\/receive$/, "Receive"],
      ["Payment links", /\/app\/payment-links$/, "Payment links"],
      ["Approvals", /\/app\/approvals$/, "Approvals"],
      ["Settings", /\/app\/settings$/, "Settings"],
      ["Home", /\/app$/, "Home"],
    ];
    for (const [label, url, heading] of items) {
      await sidebar.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    }

    // Removed consumer / DeFi surfaces are gone from the IA.
    for (const gone of ["Earn", "Yield", "Holdings", "Explore", "Swap", "Markets", "DeFi", "Invite"]) {
      await expect(sidebar.getByText(gone, { exact: true })).toHaveCount(0);
    }
    await expect(page.getByTestId("env-badge")).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search payments" })).toBeVisible();
  });

  test("mobile: bottom tab bar + More sheet, no sidebar", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile-only");
    await page.goto("/app");
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeHidden();
    const tabs = page.getByTestId("mobile-tabs");
    await expect(tabs).toBeVisible();
    for (const t of ["Home", "Payments", "Send", "Receive", "More"]) {
      await expect(tabs.getByText(t, { exact: true })).toBeVisible();
    }
    await tabs.getByRole("link", { name: "Payments" }).click();
    await expect(page).toHaveURL(/\/app\/payments$/);

    await page.getByTestId("tab-more").click();
    const sheet = page.getByRole("dialog", { name: "More" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/app\/settings$/);
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });

  test("removed routes redirect away (earn, swap, explore, holdings, markets, kyc)", async ({ page }) => {
    test.setTimeout(90_000);
    for (const path of ["/app/invest", "/app/swap", "/app/explore", "/app/assets", "/app/markets", "/app/agent", "/kyc"]) {
      await page.goto(path);
      await expect(page).not.toHaveURL(new RegExp(`${path}$`));
    }
    // Old payment URLs land on their new homes.
    await page.goto("/app/wallet");
    await expect(page).toHaveURL(/\/app\/payments$/);
    await page.goto("/app/profile/security/passkeys");
    await expect(page).toHaveURL(/\/app\/settings\/security\/passkeys$/);
    await page.goto("/app/walletconnect");
    await expect(page).toHaveURL(/\/app\/settings\/connected-apps$/);
    await page.goto("/app/pay");
    await expect(page).toHaveURL(/\/app\/send\?method=mobile$/);
  });

  test("no horizontal overflow on any console screen", async ({ page }) => {
    test.setTimeout(90_000);
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
      const r = await noHorizontalOverflow(page);
      expect(r, `horizontal overflow on ${route}`).toEqual({ doc: true, main: true });
    }
  });

  test("the main content region scrolls", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    const style = await page.locator("#main").evaluate((el) => getComputedStyle(el).overflowY);
    expect(style).toBe("auto");
  });
});

test.describe("payments", () => {
  test("table / list with filters, then the detail drawer", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/payments");
    const rows = page.locator("[data-testid=payment-row]:visible");
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    expect(await rows.count()).toBe(7);

    await page.getByRole("radio", { name: "Incoming" }).click();
    await expect(rows).toHaveCount(3);
    await page.getByRole("radio", { name: "All" }).click();
    await page.getByLabel("Status").selectOption("failed");
    await expect(rows).toHaveCount(1);
    await page.getByLabel("Status").selectOption("all");
    await page.getByPlaceholder("Reference, address, amount").fill("RFT-8K2Q1");
    await expect(rows).toHaveCount(1);

    await rows.first().click();
    const drawer = page.getByTestId("payment-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Succeeded");
    await expect(drawer).toContainText("KSh 645.00"); // fee
    await expect(drawer).toContainText("KSh 65,145.00"); // total
    await expect(drawer).toContainText("Jane Wanjiru");
    await expect(drawer).toContainText("RFT-8K2Q1");
    await expect(drawer.getByRole("link", { name: /0x9f1c3b/ })).toHaveAttribute("href", /basescan\.org\/tx\/0x9f1c3b/);
    await expect(drawer.getByRole("button", { name: "Download receipt" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("empty account shows one primary action", async ({ page }) => {
    await installConsoleMocks(page);
    await page.goto("/app/payments");
    await expect(page.getByText("No payments yet")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Receive your first payment" })).toBeVisible();
  });

  test("home shows a single USD balance with a per-currency breakdown", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app");
    await expect(page.getByTestId("balance-amount")).toContainText("$14,860.80", { timeout: 15_000 });
    const breakdown = page.getByRole("list", { name: "Balance by currency" });
    await expect(breakdown).toContainText("14,000.55 USDC");
    await expect(breakdown).toContainText("860.25 USDT");
    // No token portfolio / yield / coming-soon surfaces.
    for (const gone of ["Coming soon", "Holdings", "Yield", "DeFi connections"]) {
      await expect(page.getByText(gone)).toHaveCount(0);
    }
  });
});

test.describe("send", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
  });

  test("wallet form validates inline and reviews fee + total before the passkey step", async ({ page }) => {
    await page.goto("/app/send?method=wallet");
    await page.getByRole("button", { name: "Review transfer" }).click();
    await expect(page.getByText("Enter the recipient's wallet address")).toBeVisible();
    await expect(page.getByText("Enter an amount")).toBeVisible();

    await page.getByLabel("Wallet address").fill("0x1234");
    await page.getByLabel("Amount", { exact: true }).fill("999999");
    await page.getByLabel("Amount", { exact: true }).blur();
    await expect(page.getByText(/valid EVM address/)).toBeVisible();
    await expect(page.getByText(/You can send up to/)).toBeVisible();

    await page.getByLabel("Wallet address").fill("0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a");
    await page.getByLabel("Amount", { exact: true }).fill("250");
    await page.getByRole("button", { name: "Review transfer" }).click();
    const summary = page.getByRole("region", { name: "Summary" });
    await expect(summary).toContainText("0.042 USDC", { timeout: 15_000 });
    await expect(summary).toContainText("250.042 USDC");
    await expect(page.getByRole("button", { name: "Approve with passkey" })).toBeEnabled();
  });

  test("payout method selector: mobile money hides bank, bank skips the M-Pesa type picker", async ({ page }) => {
    await page.goto("/app/send");
    await expect(page.getByRole("radio", { name: "Mobile money" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Nigeria")).toHaveCount(0);
    await page.getByRole("button", { name: /Kenya/ }).click();
    await expect(page.getByText(/Choose payment type/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Paybill/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Bank Transfer/ })).toHaveCount(0);

    await page.getByRole("radio", { name: "Bank" }).click();
    await expect(page).toHaveURL(/method=bank/);
    await expect(page.getByRole("button", { name: /Nigeria/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Uganda/ })).toHaveCount(0);
  });

  test("Kenya bank payout: bank picker collapses after selection and shows Change", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "flow is covered on desktop");
    await page.route("**/v1/reference/kenya/bank-paybills", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: KENYA_BANKS_FIXTURE }) })
    );
    await page.goto("/app/send?method=bank");
    await page.getByRole("button", { name: /Kenya/ }).click();

    // Several funded wallets → pick the Base USDC source.
    await page.getByText("Base", { exact: true }).first().click({ timeout: 15_000 });

    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toBeVisible({ timeout: 10_000 });
    await amountInput.fill("500");
    await page.getByRole("button", { name: /^(Continue|Next)$/i }).first().click();

    const equityTile = page.getByRole("option", { name: /Equity Bank/i });
    await expect(equityTile).toBeVisible({ timeout: 10_000 });
    expect(await page.getByRole("option").count()).toBeGreaterThan(1);
    await equityTile.click();
    await expect(page.getByText("Change", { exact: true })).toBeVisible();
    await expect(page.getByText(/Selected bank/i)).toBeVisible();
    expect(await page.getByRole("option").count()).toBe(0);
    await page.getByText("Change", { exact: true }).click();
    await expect(page.getByRole("option", { name: /Equity Bank/i })).toBeVisible();
  });
});

test.describe("receive + settings", () => {
  test("receive shows the account address and QR", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/receive");
    await expect(page.getByTestId("receive-address")).toHaveText("0x7a3F9c21B4e8D05a61c2f3E9b0d4A8C6e1F25b9D", { timeout: 15_000 });
    await expect(page.getByRole("img", { name: "Deposit address QR code" })).toBeVisible();
  });

  test("settings keeps only payout account, passkeys, WalletConnect and profile basics", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    for (const h of ["Profile", "Payouts", "Security", "Connected apps"]) {
      await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /Withdrawal account/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    for (const gone of ["Push notifications", "Invite Friends", "App Tutorial", "Account recovery", "Identity verification", "Verification"]) {
      await expect(page.getByText(gone, { exact: true })).toHaveCount(0);
    }

    await page.getByRole("button", { name: /Passkeys/ }).click();
    await expect(page).toHaveURL(/\/app\/settings\/security\/passkeys$/);
    await expect(page.getByTestId("passkey-row")).toHaveCount(2);

    await page.goto("/app/settings");
    await page.getByRole("button", { name: /WalletConnect/ }).click();
    await expect(page).toHaveURL(/\/app\/settings\/connected-apps$/);
    await expect(page.getByRole("heading", { level: 1, name: "WalletConnect" })).toBeVisible();
  });
});
