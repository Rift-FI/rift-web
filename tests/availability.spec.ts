import { test, expect } from "@playwright/test";
import { installConsoleMocks } from "./helpers/console-mocks";

// When Rift is short on liquidity for a corridor, the app says so
// ("temporarily unavailable, back soon") instead of hiding it or failing later.
const countries = [
  { country: "KE", currency: "KES", phoneCode: "+254", rails: { mobile: ["Safaricom", "Airtel"], bank: true, till: true, paybill: true }, offrampActive: true, onrampActive: false, onrampStatus: "paused", offrampStatus: "available", onrampProvider: "pretium" },
  { country: "TZ", currency: "TZS", phoneCode: "+255", rails: { mobile: ["Vodacom", "Halotel", "Airtel", "Yas / Tigo"], bank: false, till: false, paybill: false }, offrampActive: false, onrampActive: false, onrampStatus: "paused", offrampStatus: "paused", onrampProvider: "pretium" },
  { country: "UG", currency: "UGX", phoneCode: "+256", rails: { mobile: ["MTN", "Airtel"], bank: false, till: false, paybill: false }, offrampActive: true, onrampActive: true, onrampStatus: "available", offrampStatus: "available", onrampProvider: "pretium" },
];

test("paused buy corridors are announced on Add funds", async ({ page }) => {
  await installConsoleMocks(page, { rich: true });
  await page.route(/\/v1\/payouts\/countries(\?.*)?$/, (route) => route.fulfill({ json: countries }));
  await page.goto("/app/add-funds?tab=buy");
  await expect(page.getByTestId("buy-paused-note")).toContainText("Buying with KES, TZS is temporarily unavailable. Service will be back soon.");
});

test("everything paused: Buy still explains instead of disappearing", async ({ page }) => {
  await installConsoleMocks(page, { rich: true });
  await page.route(/\/v1\/payouts\/countries(\?.*)?$/, (route) => route.fulfill({ json: countries.map((c) => ({ ...c, onrampActive: false, onrampStatus: "paused" })) }));
  await page.goto("/app/add-funds?tab=buy");
  await expect(page.getByTestId("buy-paused-note")).toContainText("temporarily unavailable");
});
