import { test, expect, Page } from "@playwright/test";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * The simple wallet: home, navigation (incl. Advanced), responsive layout,
 * activity + drawer, balance-driven send / pay / withdraw, settings.
 * Backend fully mocked (tests/helpers/console-mocks.ts).
 */

const KENYA_BANKS_FIXTURE = [
  { id: "equity", name: "Equity Bank", paybill: "247247", accountHint: "Account" },
  { id: "kcb", name: "KCB Bank", paybill: "522522", accountHint: "Account" },
  { id: "ncba", name: "NCBA Bank", paybill: "880100", accountHint: "Account" },
  { id: "coop", name: "Co-operative Bank", paybill: "400200", accountHint: "Account" },
];

const ROUTES = [
  "/app",
  "/app/payments",
  "/app/send",
  "/app/send?method=wallet",
  "/app/withdraw",
  "/app/request?type=request",
  "/app/request?type=topup",
  "/app/receive",
  "/app/payment-links",
  "/app/approvals",
  "/app/advanced",
  "/app/advanced/assets",
  "/app/advanced/swap",
  "/app/advanced/walletconnect",
  "/app/convert",
  "/app/settings",
  "/app/settings/security/passkeys",
];

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const main = document.querySelector<HTMLElement>("#main");
    return { doc: doc.scrollWidth <= doc.clientWidth + 1, main: !main || main.scrollWidth <= main.clientWidth + 1 };
  });
}

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page);
  });

  test("desktop: minimal sidebar, every item navigates, no filler", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "desktop-only");
    await page.goto("/app");
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar).toBeVisible();
    await expect(page.getByTestId("mobile-tabs")).toBeHidden();

    const items: [string, RegExp, string][] = [
      ["Activity", /\/app\/payments$/, "Activity"],
      ["Payment links", /\/app\/payment-links$/, "Payment links"],
      ["Approvals", /\/app\/approvals$/, "Approvals"],
      ["Advanced", /\/app\/advanced$/, "Advanced"],
      ["Settings", /\/app\/settings$/, "Settings"],
      ["Home", /\/app$/, "Home"],
    ];
    for (const [label, url, heading] of items) {
      await sidebar.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeAttached();
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    }
    // No AI-ish chrome.
    for (const gone of ["Sandbox", "Live", "Good morning", "Good afternoon", "Good evening", "Every payment is approved with your passkey"]) {
      await expect(page.getByText(gone, { exact: true })).toHaveCount(0);
    }
  });

  test("mobile: four tabs (Home, Activity, Advanced, Settings), no sidebar", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile-only");
    await page.goto("/app");
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeHidden();
    const tabs = page.getByTestId("mobile-tabs");
    await expect(tabs).toBeVisible();
    for (const t of ["Home", "Activity", "Advanced", "Settings"]) {
      await expect(tabs.getByText(t, { exact: true })).toBeVisible();
    }
    await tabs.getByRole("link", { name: "Advanced" }).click();
    await expect(page).toHaveURL(/\/app\/advanced$/);
    await tabs.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    // Support lives in the account menu, not a bubble over the tab bar.
    await expect(page.getByTestId("support-bubble")).toHaveCount(0);
  });

  test("old URLs land on their new homes; removed features stay gone", async ({ page }) => {
    test.setTimeout(90_000);
    for (const path of ["/app/invest", "/app/explore", "/app/markets", "/app/agent", "/kyc"]) {
      await page.goto(path);
      await expect(page).not.toHaveURL(new RegExp(`${path}$`));
    }
    const moved: [string, RegExp][] = [
      ["/app/assets", /\/app\/advanced\/assets$/],
      ["/app/swap", /\/app\/advanced\/swap$/],
      ["/app/walletconnect", /\/app\/advanced\/walletconnect$/],
      ["/app/settings/connected-apps", /\/app\/advanced\/walletconnect$/],
      ["/app/wallet", /\/app\/payments$/],
      ["/app/profile/security/passkeys", /\/app\/settings\/security\/passkeys$/],
      ["/app/pay", /\/app\/send\?method=mobile$/],
    ];
    for (const [from, to] of moved) {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    }
  });

  test("no horizontal overflow on any screen", async ({ page }) => {
    test.setTimeout(150_000);
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 15_000 });
      expect(await noHorizontalOverflow(page), `horizontal overflow on ${route}`).toEqual({ doc: true, main: true });
    }
  });
});

test.describe("home", () => {
  test("centered balance, round actions, cards, live rates, activity", async ({ page }) => {
    test.setTimeout(120_000);
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app");
    await expect(page.getByTestId("balance-amount")).toContainText("$14,860.80", { timeout: 15_000 });
    await page.getByRole("button", { name: "Hide balance" }).click();
    await expect(page.getByTestId("balance-amount")).not.toContainText("14,860");
    await page.getByRole("button", { name: "Show balance" }).click();
    await expect(page.getByRole("button", { name: "Refresh balance" })).toBeVisible();

    await expect(page.getByTestId("home-carousel").getByRole("button")).toHaveCount(3);
    await expect(page.getByTestId("rate-KES")).toContainText("129");
    await expect(page.getByTestId("rate-NGN")).toContainText("1,545");
    await expect(page.locator("[data-testid=payment-row]:visible").first()).toBeVisible();

    const targets: [string, RegExp][] = [
      ["send", /\/app\/send\?method=wallet$/],
      ["add-funds", /\/app\/request\?type=topup$/],
      ["pay", /\/app\/send\?method=mobile$/],
      ["receive", /\/app\/receive$/],
      ["withdraw", /\/app\/withdraw$/],
    ];
    for (const [id, url] of targets) {
      await page.goto("/app");
      const btn = page.getByTestId(`home-action-${id}`);
      await expect(btn).toBeVisible({ timeout: 15_000 });
      const box = await btn.boundingBox();
      expect(box!.height, `${id} is a large touch target`).toBeGreaterThanOrEqual(44);
      await btn.click();
      await expect(page).toHaveURL(url);
    }
  });
});

test.describe("activity", () => {
  test("filters and the detail drawer", async ({ page }) => {
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
    await expect(drawer).toContainText("KSh 65,145.00");
    await expect(drawer).toContainText("RFT-8K2Q1");
    await expect(drawer.getByRole("button", { name: "Download receipt" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});

test.describe("advanced", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
  });

  test("lists assets, swap, WalletConnect and move funds", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/app/advanced");
    for (const id of ["assets", "swap", "walletconnect", "move"]) await expect(page.getByTestId(`advanced-${id}`)).toBeVisible();

    await page.getByTestId("advanced-assets").click();
    await expect(page).toHaveURL(/\/app\/advanced\/assets$/);
    const list = page.getByTestId("assets-list");
    await expect(list).toBeVisible({ timeout: 15_000 });
    await expect(list.getByText("USDC", { exact: true })).toHaveCount(2); // Base + Polygon
    await expect(list.getByText("USDT", { exact: true })).toBeVisible();
    await expect(list.getByText("ETH", { exact: true })).toBeVisible();

    await page.goto("/app/advanced");
    await page.getByTestId("advanced-swap").click();
    await expect(page.getByTestId("swap-panel")).toBeVisible({ timeout: 15_000 });

    await page.goto("/app/advanced");
    await page.getByTestId("advanced-walletconnect").click();
    await expect(page.getByRole("heading", { level: 1, name: "WalletConnect" })).toBeVisible();
    await expect(page.getByRole("button", { name: /New connection/ })).toBeVisible();

    await page.goto("/app/advanced");
    await page.getByTestId("advanced-move").click();
    await expect(page.getByRole("heading", { level: 1, name: "Move funds" })).toBeVisible();
  });
});

test.describe("send, pay, withdraw", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
  });

  test("wallet send: validates, auto-picks a balance that covers it, reviews fee + total", async ({ page }) => {
    await page.goto("/app/send?method=wallet");
    await page.getByRole("button", { name: "Review transfer" }).click();
    await expect(page.getByText("Enter the recipient's wallet address")).toBeVisible();
    await page.getByLabel("Wallet address").fill("0x1234");
    await page.getByLabel("Wallet address").blur();
    await expect(page.getByText(/valid EVM address/)).toBeVisible();

    await page.getByLabel("Wallet address").fill("0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a");
    await page.getByLabel("Amount", { exact: true }).fill("1500");
    // Base USDC covers it → auto-selected; Polygon USDC (1,520) does not with headroom.
    await expect(page.getByTestId("source-base-usdc")).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
    await expect(page.getByTestId("source-arbitrum-usdt")).toContainText("Not enough");
    await page.getByRole("button", { name: "Review transfer" }).click();
    const summary = page.getByRole("region", { name: "Summary" });
    await expect(summary).toContainText("0.042 USDC", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Approve with passkey" })).toBeEnabled();
  });

  test("wallet send: balance split across networks → move first (prefilled bridge)", async ({ page }) => {
    await page.goto("/app/send?method=wallet");
    await page.getByLabel("Wallet address").fill("0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a");
    await page.getByLabel("Amount", { exact: true }).fill("13000");
    const panel = page.getByTestId("move-first");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel).toContainText("Move USDC to Base first");
    await expect(panel).toContainText("from Polygon to Base");
    await panel.getByRole("button", { name: "Move funds" }).click();
    const sheet = page.getByTestId("move-first-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Polygon").first()).toBeVisible();
    await expect(sheet.locator("input").first()).toHaveValue(/^\d+(\.\d+)?$/);
  });

  test("wallet send: not enough in total → add funds", async ({ page }) => {
    await page.goto("/app/send?method=wallet");
    await page.getByLabel("Wallet address").fill("0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a");
    await page.getByLabel("Amount", { exact: true }).fill("50000");
    await expect(page.getByText("Not enough balance")).toBeVisible({ timeout: 15_000 });
  });

  test("payout rails: mobile money hides bank; bank skips the M-Pesa type picker", async ({ page }) => {
    await page.goto("/app/send");
    await expect(page.getByRole("radio", { name: "Mobile money" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Nigeria")).toHaveCount(0);
    await page.getByRole("button", { name: /Kenya/ }).click();
    await expect(page.getByRole("button", { name: /Paybill/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Bank Transfer/ })).toHaveCount(0);
    await page.getByRole("radio", { name: "Bank" }).click();
    await expect(page.getByRole("button", { name: /Nigeria/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Uganda/ })).toHaveCount(0);
  });

  test("Kenya bank payout: recipient → amount → balance auto-picked → review", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "flow is covered on desktop");
    await page.route("**/v1/reference/kenya/bank-paybills", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: KENYA_BANKS_FIXTURE }) })
    );
    await page.goto("/app/send?method=bank");
    await page.getByRole("button", { name: /Kenya/ }).click();
    const equity = page.getByRole("option", { name: /Equity Bank/i });
    await expect(equity).toBeVisible({ timeout: 10_000 });
    await equity.click();
    await expect(page.getByText("Change", { exact: true })).toBeVisible();
    expect(await page.getByRole("option").count()).toBe(0);
    await page.getByPlaceholder("1234567890").fill("0123456789");
    await page.getByPlaceholder("e.g., John Doe").fill("Acme Supplies Ltd");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Recipient gets").fill("5000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByTestId("source-base-usdc")).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
    await page.getByRole("button", { name: "Continue to review" }).click();
    const review = page.getByRole("region", { name: "Review and confirm" });
    await expect(review).toContainText("KSh 5,000", { timeout: 15_000 });
    await expect(review).toContainText("Equity Bank");
    await expect(review.getByRole("button", { name: /with passkey/ })).toBeEnabled();
    await page.getByRole("button", { name: "Edit amount" }).click();
    await expect(page.getByLabel("Recipient gets")).toHaveValue("5000");
  });

  test("payout bigger than any one balance → move first", async ({ page }) => {
    await page.goto("/app/send?method=mobile");
    await page.getByRole("button", { name: /Kenya/ }).click();
    await page.getByRole("button", { name: /Send Money/ }).click();
    await page.getByRole("button", { name: "Safaricom" }).click();
    await page.getByPlaceholder("0712 345 678").fill("0712345678");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Recipient gets").fill("1700000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByTestId("move-first")).toContainText("from Polygon to Base", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Continue to review" })).toBeDisabled();
  });

  test("withdraw: saved account → amount → balance → review", async ({ page }) => {
    await page.goto("/app/withdraw");
    await expect(page.getByTestId("section-account-summary")).toContainText("0712345678", { timeout: 15_000 });
    await page.getByLabel("You receive").fill("2000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByTestId("source-base-usdc")).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
    await page.getByRole("button", { name: "Continue to review" }).click();
    const review = page.getByRole("region", { name: "Review and confirm" });
    await expect(review).toContainText("KSh 2,000", { timeout: 15_000 });
    await expect(review).toContainText("Total deducted");
  });

  test("payment request → link card with QR; add funds shows fees", async ({ page }) => {
    await page.goto("/app/request?type=request");
    await page.getByLabel("Amount to request").fill("2400");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Description", { exact: true }).fill("Invoice #1043");
    await page.getByRole("button", { name: "Create payment link" }).click();
    const card = page.getByTestId("payment-link-card");
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByRole("img", { name: "Payment link QR code" })).toBeVisible();

    await page.goto("/app/request?type=topup");
    await page.getByLabel("Currency").selectOption("KES");
    await page.getByLabel("Amount to add").fill("10000");
    const section = page.getByRole("region", { name: "Amount" });
    await expect(section).toContainText("You pay");
    await expect(section).toContainText("You receive");
  });
});

test.describe("receive + settings", () => {
  test("receive shows the account address and QR", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/receive");
    await expect(page.getByTestId("receive-address")).toHaveText("0x7a3F9c21B4e8D05a61c2f3E9b0d4A8C6e1F25b9D", { timeout: 15_000 });
    await expect(page.getByRole("img", { name: "Deposit address QR code" })).toBeVisible();
  });

  test("settings stay minimal: profile, withdrawal account, passkeys", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/settings");
    for (const h of ["Profile", "Payouts", "Security"]) {
      await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 2, name: "Connected apps" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Withdrawal account/ })).toBeVisible();
    await page.getByRole("button", { name: /Passkeys/ }).click();
    await expect(page.getByTestId("passkey-row")).toHaveCount(2);
  });
});
