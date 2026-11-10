import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import { installConsoleMocks } from "./helpers/console-mocks";

/**
 * Device binding screenshots, light + dark. Run with:
 *   RIFT_SCREENSHOTS=1 RIFT_SCREENSHOT_DIR=<dir> npx playwright test device-screenshots
 */
const ENABLED = !!process.env.RIFT_SCREENSHOTS;
const OUT = process.env.RIFT_SCREENSHOT_DIR || "test-results/screens";

async function shot(page: Page, name: string, project: string, theme: string) {
  await page.addStyleTag({ content: "#eruda{display:none!important}" }).catch(() => undefined);
  await page.waitForTimeout(600);
  const size = project === "desktop" ? "1440x900" : "390x844";
  await page.screenshot({ path: path.join(OUT, `${name}-${theme}-${size}.png`) });
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`device screenshots (${theme})`, () => {
    test.skip(!ENABLED, "set RIFT_SCREENSHOTS=1 to capture screenshots");
    test.setTimeout(180_000);
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("rift_theme", t), theme);
    });

    test("pending device flow", async ({ page }, info) => {
      const p = info.project.name;
      await installConsoleMocks(page, { rich: true, device: "pending", deviceEnforced: true });
      await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 90_000 });
      const panel = page.getByTestId("device-panel");
      await expect(panel).toBeVisible({ timeout: 20_000 });
      await shot(page, "01-approve-this-device", p, theme);
      await panel.getByTestId("device-lost").click();
      await expect(panel).toContainText("t***@example.com", { timeout: 20_000 });
      await panel.getByTestId("device-otp").fill("123456");
      await shot(page, "02-otp", p, theme);
      await panel.getByTestId("device-otp-verify").click();
      await expect(panel.getByTestId("device-countdown")).toBeVisible({ timeout: 20_000 });
      await shot(page, "03-waiting-period", p, theme);
      await panel.getByRole("button", { name: "Done" }).click();
      await expect(page.getByTestId("device-strip")).toBeVisible();
      await shot(page, "04-home-waiting-strip", p, theme);
    });

    test("settings devices + cancel page", async ({ page }, info) => {
      const p = info.project.name;
      const state = await installConsoleMocks(page, { rich: true, device: "trusted" });
      state.otherDevices.push({ id: "dev_tab", label: "Chrome on Android", platform: "android", status: "cooling_off", createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), coolingOffUntil: new Date(Date.now() + 18 * 3600_000).toISOString() });
      state.otherDevices.push({ id: "dev_ipad", label: "Safari on iPad", platform: "ios", status: "pending", createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString() });
      await page.goto("/app/settings/devices", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByTestId("device-row")).toHaveCount(4, { timeout: 20_000 });
      await shot(page, "05-settings-devices", p, theme);
      await page.getByTestId("device-row").filter({ hasText: "Safari on Mac" }).getByRole("button", { name: "Remove Safari on Mac" }).click();
      await shot(page, "06-remove-confirm", p, theme);

      await page.goto("/devices/cancel?d=dev_tab&t=tok_ok");
      await expect(page.getByTestId("device-cancel")).toBeVisible();
      await shot(page, "07-cancel-link", p, theme);
      await page.getByTestId("device-cancel-confirm").click();
      await expect(page.getByRole("heading", { name: "Device blocked" })).toBeVisible();
      await shot(page, "08-cancel-done", p, theme);
    });
  });
}
