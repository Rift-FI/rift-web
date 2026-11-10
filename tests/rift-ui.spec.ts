import { test, expect, Page } from "@playwright/test";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Simple wallet v3: home (carousel, actions, currency sheet), navigation,
 * Activity (ledger statuses, receipts), merged Send (wallet, mobile, bank,
 * till, paybill) with beneficiary names, Add funds (Paycrest buy, payment
 * link, address), KYC only when the onramp needs it, settings.
 * Backend fully mocked (tests/helpers/console-mocks.ts).
 */

const KENYA_BANKS_FIXTURE = [
  { id: "equity", name: "Equity Bank", paybill: "247247", accountHint: "Account" },
  { id: "kcb", name: "KCB Bank", paybill: "522522", accountHint: "Account" },
  { id: "ncba", name: "NCBA Bank", paybill: "880100", accountHint: "Account" },
];
const ADDR = "0x5c7e2a9b1d3f4e6a8b0c2d4e6f8a0b2c4d6e8f0a";

const ROUTES = [
  "/app",
  "/app/payments",
  "/app/send",
  "/app/send?method=wallet",
  "/app/send?method=till",
  "/app/withdraw",
  "/app/add-funds",
  "/app/add-funds?tab=link",
  "/app/add-funds?tab=address",
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

async function pickOption(page: Page, trigger: string, option: string | RegExp) {
  await page.getByTestId(trigger).click();
  await page.getByRole("listbox").getByRole("option", { name: option }).click();
}

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
    }
    for (const gone of ["Sandbox", "Good morning", "Receive", "Pay"]) {
      await expect(page.getByText(gone, { exact: true })).toHaveCount(0);
    }
  });

  test("mobile: four tabs, no sidebar", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile-only");
    await page.goto("/app");
    const tabs = page.getByTestId("mobile-tabs");
    for (const t of ["Home", "Activity", "Advanced", "Settings"]) await expect(tabs.getByText(t, { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeHidden();
  });

  test("old URLs land on their new homes", async ({ page }) => {
    test.setTimeout(90_000);
    const moved: [string, RegExp][] = [
      ["/app/receive", /\/app\/add-funds\?tab=address$/],
      ["/app/request?type=topup", /\/app\/add-funds\?tab=buy$/],
      ["/app/request?type=request", /\/app\/add-funds\?tab=link$/],
      ["/app/pay", /\/app\/send\?method=mobile$/],
      ["/app/assets", /\/app\/advanced\/assets$/],
      ["/app/walletconnect", /\/app\/advanced\/walletconnect$/],
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

test.describe("pickers", () => {
  test("no native <select> or date inputs on the main screens", async ({ page }) => {
    test.setTimeout(150_000);
    await installConsoleMocks(page, { rich: true });
    const screens = [...ROUTES, "/app/send?method=bank", "/app/send?method=paybill", "/app/add-funds?tab=buy"];
    for (const route of screens) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 15_000 });
      await page.waitForTimeout(150);
      expect(await page.locator("select, input[type=date]").count(), `native control on ${route}`).toBe(0);
    }
    // Inside flows and sheets too.
    await page.goto("/app/send?method=mobile");
    await page.getByTestId("country-picker").click({ timeout: 15_000 });
    await page.getByTestId("currency-picker").getByRole("option", { name: /Uganda/ }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByTestId("institution-picker")).toBeVisible();
    expect(await page.locator("select").count()).toBe(0);
    await page.goto("/app/payments");
    await page.getByTestId("open-statement").click();
    await expect(page.getByTestId("statement-from")).toBeVisible();
    expect(await page.locator("select, input[type=date]").count()).toBe(0);
  });

  test("keyboard: arrows move, Enter picks, Escape closes and returns focus", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/payments");
    const trigger = page.getByTestId("status-filter");
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const list = page.getByRole("listbox", { name: "Status" });
    await expect(list).toBeVisible();
    await expect(list.getByRole("option", { name: "All statuses" })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(list).toHaveCount(0);
    await expect(trigger).toContainText("Processing");
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("date range uses the calendar picker", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/payments");
    await page.getByTestId("open-statement").click({ timeout: 15_000 });
    await page.getByTestId("statement-from").click();
    const cal = page.getByTestId("date-picker");
    await expect(cal.getByRole("grid")).toBeVisible();
    await cal.getByRole("gridcell").filter({ hasText: /^1$/ }).first().click();
    await expect(cal).toHaveCount(0);
    await expect(page.getByTestId("statement-from")).toContainText(/ 1, |^1 | 1 /);
  });
});

test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
  });

  test("three actions: Send, Add funds, Withdraw", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/app");
    await expect(page.getByTestId("balance-amount")).toContainText("$14,860.80", { timeout: 15_000 });
    await expect(page.getByTestId("home-actions").getByRole("button")).toHaveCount(3);
    const targets: [string, RegExp][] = [
      ["send", /\/app\/send$/],
      ["add-funds", /\/app\/add-funds$/],
      ["withdraw", /\/app\/withdraw$/],
    ];
    for (const [id, url] of targets) {
      await page.goto("/app");
      const btn = page.getByTestId(`home-action-${id}`);
      expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await btn.click();
      await expect(page).toHaveURL(url);
    }
  });

  test("carousel: exactly one full-width card per view, no peek, snaps per card", async ({ page }) => {
    await page.goto("/app");
    const list = page.getByTestId("home-carousel");
    await expect(list.locator("li")).toHaveCount(3);
    const geo = await list.evaluate((ul) => {
      const r = ul.getBoundingClientRect();
      const items = Array.from(ul.children).map((li) => li.getBoundingClientRect());
      return { left: r.left, right: r.right, width: ul.clientWidth, items: items.map((i) => ({ left: i.left, width: i.width })) };
    });
    expect(Math.abs(geo.items[0].width - geo.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo.items[0].left - geo.left)).toBeLessThanOrEqual(1);
    expect(geo.items[1].left, "the next card must not peek in").toBeGreaterThanOrEqual(geo.right);

    // Dots move one card at a time and land exactly on it.
    await page.getByRole("button", { name: "Show card 2" }).click();
    await expect.poll(() => list.evaluate((ul) => ul.scrollLeft)).toBeGreaterThan(0);
    const snapped = await list.evaluate(async (ul) => {
      await new Promise((r) => setTimeout(r, 700));
      const second = ul.children[1].getBoundingClientRect();
      return Math.abs(second.left - ul.getBoundingClientRect().left);
    });
    expect(snapped).toBeLessThanOrEqual(2);
    await expect(page.getByRole("button", { name: "Show card 2" })).toHaveAttribute("aria-current", "true");

    // A partial swipe snaps to a whole card (never half of two).
    const settled = await list.evaluate(async (ul) => {
      ul.scrollBy({ left: ul.clientWidth * 0.6 });
      await new Promise((r) => setTimeout(r, 900));
      const step = ul.clientWidth + 16;
      const off = ul.scrollLeft % step;
      return Math.min(off, step - off);
    });
    expect(settled).toBeLessThanOrEqual(2);
  });

  test("currency sheet: search, flags, check on current, selection updates the balance", async ({ page }) => {
    await page.goto("/app");
    await page.getByTestId("balance-currency").click();
    const sheet = page.getByTestId("currency-picker");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("option", { name: /US Dollar/ })).toHaveAttribute("aria-selected", "true");
    await sheet.getByPlaceholder("Search").fill("nai");
    await expect(sheet.getByRole("option")).toHaveCount(1);
    await sheet.getByRole("option", { name: /Nigerian Naira/ }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId("balance-currency")).toContainText("NGN");
    await expect(page.locator("#balance-section")).toContainText("₦");
  });
});

test.describe("activity + receipts", () => {
  test("ledger statuses in the app vocabulary", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/payments");
    const rows = page.locator("[data-testid=payment-row]:visible");
    await expect(rows).toHaveCount(7, { timeout: 15_000 });
    for (const label of ["Completed", "Processing", "Refunded", "Expired"]) {
      await expect(page.locator("[data-status]:visible", { hasText: label }).first()).toBeVisible();
    }
    await pickOption(page, "status-filter", "Processing");
    await expect(rows).toHaveCount(1);
    await pickOption(page, "status-filter", "All statuses");
    await page.getByRole("radio", { name: "Incoming" }).click();
    await expect(rows).toHaveCount(3);
  });

  test("legacy feeds (no ledger) map to the same statuses", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, ledger: false });
    await page.goto("/app/payments");
    const rows = page.locator("[data-testid=payment-row]:visible");
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    await pickOption(page, "status-filter", "Processing");
    await expect(rows.first()).toBeVisible();
    await expect(page.locator("[data-status=processing]:visible").first()).toBeVisible();
  });

  test("detail renders the receipt inline with PNG and PDF download", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/payments");
    await page.getByPlaceholder("Reference, address, amount").fill("RFT-8K2Q1");
    await page.locator("[data-testid=payment-row]:visible").first().click();
    const receipt = page.getByTestId("receipt");
    await expect(receipt).toContainText("Completed");
    await expect(receipt).toContainText("KSh 645.00");
    await expect(receipt).toContainText("RFT-8K2Q1");
    await expect(receipt).toContainText("JANE WANJIRU");
    const png = page.waitForEvent("download");
    await receipt.getByTestId("receipt-download-png").click();
    expect((await png).suggestedFilename()).toMatch(/\.png$/);
    const pdf = page.waitForEvent("download");
    await receipt.getByTestId("receipt-download-pdf").click();
    const file = await pdf;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
    const head = await (await file.createReadStream()).read(8);
    expect(String(head)).toContain("%PDF-1.4");
  });
});

test.describe("send", () => {
  test.beforeEach(async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
  });

  test("one Send with five destinations", async ({ page }) => {
    await page.goto("/app/send");
    const dests = page.getByTestId("send-destinations").getByRole("radio");
    await expect(dests).toHaveCount(5);
    for (const label of ["Mobile", "Bank", "Till", "Paybill", "Wallet"]) await expect(page.getByRole("radio", { name: label })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Mobile" })).toHaveAttribute("aria-checked", "true");
  });

  test("mobile money: dynamic country list, networks, beneficiary name before amount", async ({ page }) => {
    await page.goto("/app/send?method=mobile");
    await page.getByTestId("country-picker").click({ timeout: 15_000 });
    const sheet = page.getByTestId("currency-picker");
    for (const c of ["Kenya", "Uganda", "Tanzania", "Ghana"]) await expect(sheet.getByRole("option", { name: new RegExp(c) })).toBeVisible();
    await expect(sheet.getByRole("option", { name: /Nigeria/ })).toHaveCount(0); // no mobile rail
    await sheet.getByRole("option", { name: /Tanzania/ }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByTestId("institution-picker").click();
    for (const n of ["Vodacom", "Halotel", "Airtel", "Yas"]) await expect(page.getByRole("listbox").getByRole("option", { name: new RegExp(n) })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);

    await page.getByRole("button", { name: "Edit country" }).click();
    await page.getByTestId("country-picker").click();
    await page.getByTestId("currency-picker").getByRole("option", { name: /Kenya/ }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Safaricom" }).click();
    await page.getByPlaceholder("0712 345 678").fill("0700000999");
    await expect(page.getByTestId("beneficiary")).toContainText("No account matches", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
    await page.getByPlaceholder("0712 345 678").fill("0712345678");
    await expect(page.getByTestId("beneficiary")).toContainText("Paying JANE WANJIRU", { timeout: 15_000 });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Recipient gets").fill("5000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Continue to review" }).click({ timeout: 15_000 });
    await expect(page.getByRole("region", { name: "Review and confirm" })).toContainText("JANE WANJIRU");
  });

  test("till and paybill skip the country (Kenya only) and show the business name", async ({ page }) => {
    await page.goto("/app/send?method=till");
    await page.getByPlaceholder("123456").fill("123456");
    await expect(page.getByTestId("beneficiary")).toContainText("KILIMO FRESH STORES", { timeout: 15_000 });
    await expect(page.getByTestId("section-destination-summary")).toContainText("Kenya");

    await page.goto("/app/send?method=paybill");
    await page.getByPlaceholder("400200").fill("888880");
    await page.getByPlaceholder("Account number").fill("ACC-77");
    await expect(page.getByTestId("beneficiary")).toContainText("KENYA POWER", { timeout: 15_000 });
  });

  test("Kenya bank: picker, account name from lookup, review", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "flow is covered on desktop");
    await page.route("**/v1/reference/kenya/bank-paybills", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: KENYA_BANKS_FIXTURE }) })
    );
    await page.goto("/app/send?method=bank");
    await page.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 15_000 });
    await page.getByTestId("bank-picker").click();
    await page.getByRole("combobox").fill("equ");
    await page.getByRole("listbox").getByRole("option", { name: /Equity Bank/i }).click();
    await expect(page.getByTestId("bank-picker")).toContainText("Equity Bank");
    await page.getByPlaceholder("1234567890").fill("0123456789");
    await expect(page.getByTestId("beneficiary")).toContainText("ACME SUPPLIES LTD", { timeout: 15_000 });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Recipient gets").fill("5000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Continue to review" }).click({ timeout: 15_000 });
    const review = page.getByRole("region", { name: "Review and confirm" });
    await expect(review).toContainText("ACME SUPPLIES LTD");
    await expect(review).toContainText("Equity Bank");
  });

  test("wallet: balance auto-picked; split balance → move first", async ({ page }) => {
    await page.goto("/app/send?method=wallet");
    await page.getByLabel("Wallet address").fill(ADDR);
    await page.getByLabel("Amount", { exact: true }).fill("1500");
    await expect(page.getByTestId("source-base-usdc")).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
    await page.getByLabel("Amount", { exact: true }).fill("13000");
    await expect(page.getByTestId("move-first")).toContainText("from Polygon to Base", { timeout: 15_000 });
  });

  test("withdraw: amount → balance → review", async ({ page }) => {
    await page.goto("/app/withdraw");
    await page.getByLabel("You receive").fill("2000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Continue to review" }).click({ timeout: 15_000 });
    await expect(page.getByRole("region", { name: "Review and confirm" })).toContainText("Total deducted");
  });
});

test.describe("add funds", () => {
  test("buy (NGN): quote → bank instructions with countdown → processing → completed receipt", async ({ page }) => {
    test.setTimeout(60_000);
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/add-funds");
    await expect(page.getByRole("radio", { name: "Buy" })).toHaveAttribute("aria-checked", "true", { timeout: 15_000 });
    await page.getByTestId("buy-currency").click();
    await page.getByTestId("currency-picker").getByRole("option", { name: /Nigeria/ }).click();
    await page.getByLabel("Amount").fill("5000");
    await expect(page.getByTestId("buy-quote")).toContainText("USDC", { timeout: 15_000 });
    await page.getByTestId("buy-continue").click();
    const box = page.getByTestId("deposit-instructions");
    await expect(box).toBeVisible({ timeout: 15_000 });
    for (const t of ["Moniepoint MFB", "6012345678", "PAYCREST / RIFT", "5,015", "RFT-ONR-1"]) await expect(box).toContainText(t);
    await expect(page.getByTestId("onramp-countdown")).toContainText(/\d+:\d{2} left/);
    await expect(page.locator("[data-status=processing]")).toBeVisible({ timeout: 15_000 });
    const receipt = page.getByTestId("receipt");
    await expect(receipt).toContainText("Funds added", { timeout: 20_000 });
    await expect(receipt).toContainText("USDC");
  });

  test("buy (KES): approve the prompt on your phone", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/add-funds?tab=buy");
    await page.getByLabel("Amount").fill("1000");
    await expect(page.getByTestId("buy-quote")).toContainText("USDC", { timeout: 15_000 });
    await page.getByTestId("buy-continue").click();
    await expect(page.getByTestId("onramp-prompt")).toContainText("Approve the prompt on your phone", { timeout: 15_000 });
    await expect(page.getByTestId("deposit-instructions")).toHaveCount(0);
  });

  test("buy (TZS, Pretium): phone + network, USDC on Base or USDT on Celo, no KYC, phone prompt", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, kycVerified: false });
    await page.goto("/app/add-funds?tab=buy");
    await page.getByTestId("buy-currency").click({ timeout: 15_000 });
    await page.getByTestId("currency-picker").getByRole("option", { name: /Tanzania/ }).click();
    await page.getByTestId("buy-asset").click();
    const assets = page.getByRole("listbox", { name: "Receive" }).getByRole("option");
    await expect(assets).toHaveCount(2);
    await expect(assets.nth(0)).toContainText("USDC on Base");
    await expect(assets.nth(1)).toContainText("USDT on Celo");
    await assets.nth(1).click();
    await page.getByLabel("Amount").fill("500");
    await expect(page.getByTestId("buy-quote")).toContainText("USDT", { timeout: 15_000 });
    await expect(page.getByTestId("buy-continue")).toBeDisabled(); // phone missing
    await pickOption(page, "buy-network", "Vodacom");
    await page.getByLabel("Phone number").fill("0712 345 678");
    await page.getByTestId("buy-continue").click();
    await expect(page.getByTestId("buy-range")).toContainText("TSh", { timeout: 15_000 });
    await expect(page.getByTestId("buy-continue")).toBeDisabled();
    await page.getByLabel("Amount").fill("25000");
    await expect(page.getByTestId("buy-continue")).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId("buy-continue").click();
    await expect(page.getByTestId("onramp-prompt")).toContainText("Approve the prompt on your phone", { timeout: 15_000 });
    await expect(page.getByTestId("onramp-prompt")).toContainText("Vodacom");
    await expect(page.getByTestId("kyc-sheet")).toHaveCount(0);
    const post = state.requests.filter((r) => r.method === "POST" && r.path.endsWith("/v1/onramps")).pop();
    expect(post?.body).toMatchObject({ currency: "TZS", token: "USDT", chain: "CELO", phone: "+255712345678", network: "Vodacom", fiatAmount: 25000 });
  });

  test("onramp off: no Buy, only payment link and address", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, onramp: false });
    await page.goto("/app/add-funds");
    await expect(page.getByRole("radio", { name: "Payment link" })).toHaveAttribute("aria-checked", "true", { timeout: 15_000 });
    await expect(page.getByRole("radio", { name: "Buy" })).toHaveCount(0);
    await expect(page.getByRole("radio", { name: "Address" })).toBeVisible();
  });

  test("payment link: link + QR only (no SMS or M-Pesa prompt); address tab", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/add-funds?tab=link");
    await page.getByLabel("Amount to request").fill("2400");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Description", { exact: true }).fill("Invoice #1043");
    await page.getByRole("button", { name: "Create payment link" }).click();
    const card = page.getByTestId("payment-link-card");
    await expect(card.getByRole("img", { name: "Payment link QR code" })).toBeVisible({ timeout: 15_000 });
    await expect(card.getByRole("button", { name: /Share link/ })).toBeVisible();
    await expect(page.getByText(/SMS|M-Pesa prompt/)).toHaveCount(0);

    await page.goto("/app/add-funds?tab=address");
    await expect(page.getByTestId("receive-address")).toHaveText("0x7a3F9c21B4e8D05a61c2f3E9b0d4A8C6e1F25b9D", { timeout: 15_000 });
    await expect(page.getByRole("img", { name: "Wallet address QR code" })).toBeVisible();
  });
});

test.describe("identity verification (onramp only)", () => {
  test("verified user never sees KYC", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, kycVerified: true });
    await page.goto("/app/add-funds?tab=buy");
    await page.getByLabel("Amount").fill("1000");
    await expect(page.getByTestId("buy-quote")).toContainText("USDC", { timeout: 15_000 });
    await page.getByTestId("buy-continue").click();
    await expect(page.getByTestId("onramp-order")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("kyc-sheet")).toHaveCount(0);
    expect(state.requests.filter((r) => r.method === "POST" && r.path.endsWith("/v1/onramps"))).toHaveLength(1);
  });

  test("unverified: 409 → SmileID flow in a sheet → retry succeeds", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, kycVerified: false });
    await page.goto("/app/add-funds?tab=buy");
    await page.getByLabel("Amount").fill("1000");
    await expect(page.getByTestId("buy-quote")).toContainText("USDC", { timeout: 15_000 });
    await page.getByTestId("buy-continue").click();
    await expect(page.getByTestId("kyc-sheet")).toBeVisible({ timeout: 15_000 });
    // The SmileID camera component can't run headless: finish the flow the way it reports success.
    state.kycVerified = true;
    await page.evaluate(() => window.dispatchEvent(new Event("rift:kyc-complete")));
    await expect(page.getByTestId("kyc-sheet")).toHaveCount(0);
    await expect(page.getByTestId("onramp-order")).toBeVisible({ timeout: 15_000 });
    expect(state.requests.filter((r) => r.method === "POST" && r.path.endsWith("/v1/onramps"))).toHaveLength(2);
  });

  test("no KYC anywhere else: send and withdraw are never gated", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, kycVerified: false });
    for (const path of ["/app", "/app/send", "/app/withdraw"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
      await expect(page.getByText(/verify your identity|identity verification/i)).toHaveCount(0);
    }
  });
});

test.describe("saved beneficiaries", () => {
  test("recent & saved fills the recipient; name shows before amount", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/send?method=till");
    const saved = page.getByTestId("saved-beneficiaries");
    await expect(saved).toContainText("Recent & saved", { timeout: 15_000 });
    await expect(saved.getByTestId("saved-beneficiary")).toHaveCount(1); // tills only
    await saved.getByTestId("saved-beneficiary").click();
    await expect(page.getByPlaceholder("123456")).toHaveValue("123456");
    await expect(page.getByTestId("beneficiary")).toContainText("KILIMO FRESH STORES", { timeout: 15_000 });

    await page.goto("/app/send?method=paybill");
    await page.getByTestId("saved-beneficiary").filter({ hasText: "KPLC tokens" }).click({ timeout: 15_000 });
    await expect(page.getByPlaceholder("Account number")).toHaveValue("ACC-77");
    await expect(page.getByTestId("saved-beneficiary").first()).toContainText("888880");

    await page.goto("/app/send?method=wallet");
    await page.getByTestId("saved-beneficiary").filter({ hasText: "Treasury wallet" }).click({ timeout: 15_000 });
    await expect(page.getByLabel("Wallet address")).toHaveValue(ADDR);
  });

  test("mobile numbers are masked in the list", async ({ page }) => {
    await installConsoleMocks(page, { rich: true });
    await page.goto("/app/send?method=mobile");
    await page.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 15_000 });
    const row = page.getByTestId("saved-beneficiary").filter({ hasText: "Jane (shop)" });
    await expect(row).toContainText("•••• 5678");
    await expect(row).not.toContainText("0712345678");
  });

  test("Settings: rename and delete", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true });
    await page.goto("/app/settings");
    const card = page.getByTestId("settings-beneficiaries");
    await expect(card.getByTestId("beneficiary-row")).toHaveCount(4, { timeout: 15_000 });
    await card.getByRole("button", { name: "Rename Kilimo Fresh" }).click();
    await card.getByLabel("Nickname").fill("Kilimo grocer");
    await card.getByRole("button", { name: "Save name" }).click();
    await expect(card).toContainText("Kilimo grocer");
    expect(state.requests.find((r) => r.method === "PATCH")?.body).toEqual({ label: "Kilimo grocer" });

    await card.getByRole("button", { name: "Delete KPLC tokens" }).click();
    await card.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(card.getByTestId("beneficiary-row")).toHaveCount(3);
    expect(state.requests.some((r) => r.method === "DELETE" && r.path.endsWith("/v1/beneficiaries/ben_3"))).toBe(true);
  });

  test("empty state when nothing is saved", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, beneficiaries: false });
    await page.goto("/app/settings");
    await expect(page.getByTestId("settings-beneficiaries")).toContainText("None saved yet", { timeout: 15_000 });
    await page.goto("/app/send?method=till");
    await expect(page.getByPlaceholder("123456")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("saved-beneficiaries")).toHaveCount(0);
  });
});

test.describe("settings", () => {
  test("minimal: profile, payouts, passkeys, identity status, statements", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, kycVerified: false });
    await page.goto("/app/settings");
    for (const h of ["Profile", "Payouts", "Beneficiaries", "Security", "Identity", "Statements"]) await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    await expect(page.getByRole("button", { name: /Identity verification/ })).toContainText("Not verified", { timeout: 15_000 });
    await page.getByRole("button", { name: /Identity verification/ }).click();
    await expect(page.getByTestId("kyc-sheet")).toBeVisible();
  });

  test("verified status shows Verified", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, kycVerified: true });
    await page.goto("/app/settings");
    await expect(page.getByRole("button", { name: /Identity verification/ })).toContainText("Verified", { timeout: 15_000 });
  });
});
