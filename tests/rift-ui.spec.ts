import { test, expect, Page, Route } from "@playwright/test";

/**
 * Smoke tests that target the UI shell/layout work we just did:
 *   - desktop routes render the sidebar Shell (not the mobile centered card)
 *   - Kenya bank picker collapses to a "Change" chip after selection
 *   - long pages actually scroll (Profile)
 *
 * We don't have real user credentials for this env, so we seed localStorage
 * with dummy tokens and stub out every XHR/fetch to the backend to an empty
 * JSON response. That is enough to exercise the render paths without needing
 * a live session.
 */

const KENYA_BANKS_FIXTURE = [
  { id: "equity", name: "Equity Bank", paybill: "247247", accountHint: "Account" },
  { id: "kcb", name: "KCB Bank", paybill: "522522", accountHint: "Account" },
  { id: "ncba", name: "NCBA Bank", paybill: "880100", accountHint: "Account" },
  { id: "coop", name: "Co-operative Bank", paybill: "400200", accountHint: "Account" },
  { id: "absa", name: "ABSA Bank", paybill: "303030", accountHint: "Account" },
  { id: "im", name: "I&M Bank", paybill: "542542", accountHint: "Account" },
  { id: "stanbic", name: "Stanbic Bank", paybill: "600100", accountHint: "Account" },
  { id: "family", name: "Family Bank", paybill: "222111", accountHint: "Account" },
];

async function seedAuthAndMocks(page: Page) {
  // Stub every remote call before we navigate so nothing hits real infra.
  await page.route("**/api/**", (route) => stubResponse(route));
  await page.route("https://*.riftfi.xyz/**", (route) => stubResponse(route));
  // Sandbox builds (.env VITE_RIFT_API_BASE) point the SDK + raw fetches here.
  await page.route("https://*.riftfi.com/**", (route) => stubResponse(route));
  await page.route("https://api.fontshare.com/**", (route) => route.continue());
  await page.route("https://fonts.googleapis.com/**", (route) => route.continue());
  await page.route("https://fonts.gstatic.com/**", (route) => route.continue());

  // Seed the auth state the shell checks on mount.
  await page.addInitScript(() => {
    localStorage.setItem("token", "dummy-test-token");
    localStorage.setItem("address", "0x000000000000000000000000000000000000dead");
    localStorage.setItem("recovery_warning_dismissed", String(Date.now()));
    // Snooze the v3 "Secure your wallet" enrolment modal (non-custodial
    // builds): it covers the page and intercepts clicks. Same key the
    // modal's "later" button writes.
    localStorage.setItem(
      "rift_v3_enrolment_snooze_until",
      String(Date.now() + 24 * 60 * 60 * 1000)
    );
    // Mark the first-run demo as already completed to suppress the tutorial overlay.
    localStorage.setItem("demo_completed", "true");
    // Preselect a currency so home doesn't flicker.
    localStorage.setItem("selected_currency", "USD");
  });
}

function stubResponse(route: Route) {
  const url = route.request().url();
  // Kenya bank/paybill list — return the fixture so the Bank picker renders.
  if (/kenya-bank-paybills|reference\/kenya/.test(url)) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: KENYA_BANKS_FIXTURE }),
    });
  }
  if (/getUser|\/user/.test(url)) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "test-user",
          externalId: "test-ext-id",
          phoneNumber: "+254700000000",
          email: null,
          notificationEmail: "tester@example.com",
        },
      }),
    });
  }
  // Token balance — GET /wallet/token-balance?token=USDC&chain=BASE
  // Return a non-zero USDC-on-Base balance so Pay flow can proceed.
  // Older backends: /wallet/token-balance; SDK 1.4.x: /v1/balances/tokens.
  if (/token-balance|balances\/tokens/.test(url)) {
    const u = new URL(url);
    const token = u.searchParams.get("token");
    const chain = u.searchParams.get("chain");
    if (token === "USDC" && chain === "BASE") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [{ amount: 1000, token: "USDC", chain: "BASE" }] }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [{ amount: 0, token, chain }] }),
    });
  }
  // Exchange rate preview — any currency.
  if (/preview_exchange_rate|preview-exchange-rate/.test(url)) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        rate: 129,
        buying_rate: 129,
        selling_rate: 130,
        quoted_rate: 129,
        feeBps: 100,
        feePercentage: 1,
      }),
    });
  }
  // Everything else: empty 200. Prevents error toasts / suspension redirects.
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ orders: [], balances: [], breakdown: [], data: [], rate: 1, buying_rate: 129, selling_rate: 130, feeBps: 100, feePercentage: 1 }),
  });
}

test.describe("Rift UI shell", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthAndMocks(page);
  });

  test("desktop: sidebar shell renders on /app (not mobile card)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop-only");

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // The desktop sidebar has the "Menu" label and brand — neither exists on mobile.
    const sidebarMenu = page.locator("aside", { hasText: "Menu" });
    await expect(sidebarMenu, "desktop sidebar should be present").toBeVisible();

    // Mobile shell uses max-w-md centered card — its "Add money" pill lives in the body,
    // but we can still detect its presence via the Rift sidebar logo vs body header.
    await expect(page.locator("aside img[alt='Rift']")).toBeVisible();
  });

  test("mobile: no sidebar, uses centered card shell on /app", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile-only");

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("aside", { hasText: "Menu" })).toHaveCount(0);

    // Mobile header: "Rift" brand + currency selector.
    await expect(page.getByText("Rift", { exact: true }).first()).toBeVisible();
  });

  test("Kenya bank picker collapses after selection and shows Change button", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "flow is covered on desktop");

    await page.goto("/app/pay");
    await page.waitForLoadState("networkidle");

    // Give the app a moment to mount past the auth bootstrap.
    await expect(page.getByText("Send money across borders")).toBeVisible({ timeout: 15_000 });

    // Click through the pay flow: Kenya → Bank Transfer
    await page.getByText("Kenya", { exact: true }).first().click();

    await expect(page.getByText(/Choose payment type/i)).toBeVisible();
    await page.getByRole("button", { name: /Bank Transfer/i }).click();

    // PaySourceSelect may auto-advance (single source) or show a picker.
    // If a source row appears, pick it.
    const sourcePicker = page.getByText(/Select wallet/i);
    if (await sourcePicker.isVisible().catch(() => false)) {
      const sourceRow = page.locator("button", { hasText: /USDC/i });
      if ((await sourceRow.count()) > 0) {
        await sourceRow.first().click();
      }
    }

    // AmountInput: wait for it, enter a value and continue.
    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toBeVisible({ timeout: 10_000 });
    await amountInput.fill("500");
    const nextBtn = page.getByRole("button", { name: /^(Continue|Next)$/i }).first();
    await nextBtn.click();

    // We should be on RecipientInput now. The picker shows all bank tiles.
    const equityTile = page.getByRole("option", { name: /Equity Bank/i });
    await expect(equityTile).toBeVisible({ timeout: 10_000 });

    // There should be multiple bank tiles visible before selection.
    const tilesBefore = await page.getByRole("option").count();
    expect(tilesBefore).toBeGreaterThan(1);

    await equityTile.click();

    // After selection, the list collapses — only the selected bank + "Change" remains.
    await expect(page.getByText("Change", { exact: true })).toBeVisible();
    await expect(page.getByText(/Selected bank/i)).toBeVisible();

    // Other tiles should be gone.
    const tilesAfter = await page.getByRole("option").count();
    expect(tilesAfter).toBe(0);

    // "Change" re-opens the list.
    await page.getByText("Change", { exact: true }).click();
    await expect(page.getByRole("option", { name: /Equity Bank/i })).toBeVisible();
  });

  test("Profile page: has a scrollable region and nothing is clipped", async ({ page }) => {
    await page.goto("/app/profile");
    await page.waitForLoadState("networkidle");

    // "Account" section must be visible — it's the first settings group.
    await expect(page.getByText(/^Account$/i).first()).toBeVisible({ timeout: 10_000 });

    // Structural assertion: a container with overflow-y: auto exists in the tree.
    const hasScrollRegion = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll<HTMLElement>("div"));
      return all.some(
        (el) =>
          getComputedStyle(el).overflowY === "auto" &&
          el.clientHeight > 200
      );
    });
    expect(hasScrollRegion, "Profile should have a tall overflow-y-auto region").toBeTruthy();

    // If the content happens to overflow, make sure scrolling actually moves.
    const scrollInfo = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll<HTMLElement>("div"));
      const el = all.find(
        (el) =>
          getComputedStyle(el).overflowY === "auto" &&
          el.scrollHeight > el.clientHeight + 4 &&
          el.clientHeight > 200
      );
      if (!el) return null;
      const before = el.scrollTop;
      el.scrollTop = el.scrollHeight;
      const after = el.scrollTop;
      return { before, after, max: el.scrollHeight - el.clientHeight };
    });
    if (scrollInfo) {
      expect(
        scrollInfo.after,
        `scrollTop should move when content overflows (max=${scrollInfo.max})`
      ).toBeGreaterThan(scrollInfo.before);
    }
  });

  test("Wallet page renders without horizontal overflow", async ({ page }) => {
    await page.goto("/app/wallet");
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => {
      return {
        docWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(
      overflow.docWidth,
      "page should not overflow horizontally"
    ).toBeLessThanOrEqual(overflow.viewportWidth + 2);
  });
});
