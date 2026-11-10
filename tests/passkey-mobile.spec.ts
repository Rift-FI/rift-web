import { test, expect, type Page } from "@playwright/test";
import {
  attachVirtualAuthenticator,
  installPasskeyBackend,
  newState,
  statusFor,
} from "./helpers/passkey-backend";

/**
 * Mobile passkey setup. Android Chrome reports document.hasFocus() === false
 * right after the user switches back from the email/SMS app to paste the
 * code, even when they then tap "Create passkey". The app used to refuse
 * on that signal alone ("Face ID / Touch ID needs this browser tab in the
 * foreground"), so nobody could sign up on a phone. These tests pin the
 * fix: the ceremony always runs, and only a real browser focus rejection
 * produces the hint.
 */

test.setTimeout(120_000);
test.use({
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

const EMAIL = "mobile@example.com";

async function signUpWithUnfocusedDocument(page: Page) {
  await page.addInitScript(() => {
    // What Android Chrome reports after an app switch.
    Document.prototype.hasFocus = () => false;
    if (sessionStorage.getItem("__cleared")) return;
    sessionStorage.setItem("__cleared", "1");
    localStorage.clear();
    localStorage.setItem("demo_completed", "true");
  });
  await page.goto("/auth");
  await page.getByText("Open an account").click();
  await page.getByText("Email Address", { exact: true }).first().click();
  await page.getByPlaceholder("your-email@example.com").fill(EMAIL);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Verification Code" })).toBeVisible({ timeout: 20_000 });
  await page.locator("input[data-input-otp]").fill("1234");
}

test("signup on a phone creates the passkey even when hasFocus() is false", async ({ page }) => {
  await attachVirtualAuthenticator(page);
  const state = await installPasskeyBackend(page, newState({ walletStatus: statusFor("none"), setupMode: "native" }));
  await signUpWithUnfocusedDocument(page);

  const setup = page.getByTestId("passkey-setup");
  await expect(setup.getByText("Secure your wallet with a passkey")).toBeVisible({ timeout: 20_000 });
  await setup.getByRole("button", { name: "Create passkey" }).tap();
  // The second (possession) prompt may need its own tap on a phone.
  const confirm = page.getByRole("button", { name: /Confirm your passkey/i });
  await expect(setup.getByText("Your wallet is protected").or(confirm)).toBeVisible({ timeout: 20_000 });
  if (await confirm.isVisible()) await confirm.tap();
  await expect(setup.getByText("Your wallet is protected")).toBeVisible({ timeout: 20_000 });

  await expect(page.getByText(/needs this browser tab in the foreground/)).toHaveCount(0);
  expect(state.attestations).toHaveLength(1);
});

test("a real browser focus rejection shows the actionable hint", async ({ page }) => {
  await attachVirtualAuthenticator(page);
  await installPasskeyBackend(page, newState({ walletStatus: statusFor("none"), setupMode: "native" }));
  await page.addInitScript(() => {
    navigator.credentials.create = async () => {
      throw new DOMException("The document is not focused.", "NotAllowedError");
    };
  });
  await signUpWithUnfocusedDocument(page);

  const setup = page.getByTestId("passkey-setup");
  await expect(setup.getByText("Secure your wallet with a passkey")).toBeVisible({ timeout: 20_000 });
  await setup.getByRole("button", { name: "Create passkey" }).tap();
  await expect(page.getByText(/needs this browser tab in the foreground/)).toBeVisible({ timeout: 20_000 });
});
