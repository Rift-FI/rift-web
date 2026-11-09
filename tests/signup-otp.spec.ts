import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * OTP-first email sign-up (backend contract: signup requires `otpCode`
 * when REQUIRE_SIGNUP_OTP=true; the same code is then reused for login
 * through a one-time proof).
 *
 * Expected network sequence from the onboarding UI:
 *   POST /v1/one-time-codes  { email }
 *   POST /v1/auth/sign-up    { email, otpCode }
 *   POST /v1/auth/sign-in    { email, otpCode }   (same code)
 *
 * All backend hosts are stubbed; nothing reaches real infra.
 */

const EMAIL = "new-user@example.com";
const CODE = "1234";
const LOCKED_MESSAGE =
  "Too many failed verification attempts. Please wait and request a new code.";

interface Captured {
  path: string;
  body: Record<string, unknown>;
}

type SignupBehaviour = "created" | "exists" | "locked";

async function stubBackend(page: Page, signup: SignupBehaviour): Promise<Captured[]> {
  const calls: Captured[] = [];
  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    });

  const handler = async (route: Route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        },
      });
    }
    const path = new URL(req.url()).pathname;
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(req.postData() || "{}");
    } catch {
      body = {};
    }
    if (req.method() === "POST") calls.push({ path, body });

    if (path.endsWith("/v1/one-time-codes")) {
      return json(route, 200, { success: true, message: "OTP sent" });
    }
    if (path.endsWith("/v1/auth/sign-up")) {
      if (signup === "exists") {
        return json(route, 409, { message: "User already exists" });
      }
      if (signup === "locked") {
        return json(route, 429, { message: LOCKED_MESSAGE, requiresOTP: true });
      }
      return json(route, 201, { userId: "user-new-1", message: "created" });
    }
    if (path.endsWith("/v1/auth/sign-in")) {
      return json(route, 200, {
        accessToken: "test-access-token",
        address: "0x000000000000000000000000000000000000dEaD",
      });
    }
    if (path.endsWith("/wallet/v3-status")) {
      return json(route, 200, { version: "v3" });
    }
    if (/\/user|\/me/.test(path)) {
      return json(route, 200, {
        user: { id: "user-new-1", email: EMAIL, externalId: null, phoneNumber: null },
      });
    }
    return json(route, 200, { data: [], orders: [], balances: [] });
  };

  await page.route("https://sandbox.riftfi.com/**", handler);
  await page.route("https://*.riftfi.xyz/**", handler);
  await page.route("**/api/**", handler);
  // Third-party sign-in widgets aren't under test; keep them offline.
  await page.route("https://accounts.google.com/**", (r) => r.abort());
  await page.route("https://appleid.cdn-apple.com/**", (r) => r.abort());

  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("demo_completed", "true");
  });
  return calls;
}

async function signUpWithEmail(page: Page) {
  await page.goto("/auth");
  await page.getByText("Open an account").click();
  await page.getByText("Email Address", { exact: true }).first().click();
  await page.getByPlaceholder("your-email@example.com").fill(EMAIL);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Verification Code" })).toBeVisible({ timeout: 15_000 });
  // The OTP widget is a single hidden input; filling 4 digits auto-submits.
  await page.locator("input[data-input-otp]").fill(CODE);
}

const paths = (calls: Captured[]) =>
  calls
    .map((c) => c.path)
    .filter((p) => /one-time-codes|auth\/sign-(up|in)/.test(p));

test.setTimeout(90_000);

test.describe("OTP-first sign-up", () => {
  test.skip(({ isMobile }) => isMobile, "flow is covered on desktop");

  test("new user: send OTP → sign-up with otpCode → login with the same code", async ({ page }) => {
    const calls = await stubBackend(page, "created");
    await signUpWithEmail(page);

    await expect
      .poll(() => paths(calls), { timeout: 20_000 })
      .toEqual(["/v1/one-time-codes", "/v1/auth/sign-up", "/v1/auth/sign-in"]);

    const send = calls.find((c) => c.path.endsWith("/v1/one-time-codes"))!;
    const signup = calls.find((c) => c.path.endsWith("/v1/auth/sign-up"))!;
    const login = calls.find((c) => c.path.endsWith("/v1/auth/sign-in"))!;
    expect(send.body).toMatchObject({ email: EMAIL });
    expect(signup.body).toMatchObject({ email: EMAIL, otpCode: CODE });
    expect(login.body).toMatchObject({ email: EMAIL, otpCode: CODE });

    // Left the code step: the account-created screen took over.
    await expect(page.getByRole("heading", { name: "Verification Code" })).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBe(
      "test-access-token"
    );
  });

  test("existing user (409 on sign-up) still logs in with the same code", async ({ page }) => {
    const calls = await stubBackend(page, "exists");
    await signUpWithEmail(page);

    await expect
      .poll(() => paths(calls), { timeout: 20_000 })
      .toEqual(["/v1/one-time-codes", "/v1/auth/sign-up", "/v1/auth/sign-in"]);
    const login = calls.find((c) => c.path.endsWith("/v1/auth/sign-in"))!;
    expect(login.body).toMatchObject({ email: EMAIL, otpCode: CODE });
    await expect(page.getByRole("heading", { name: "Verification Code" })).toHaveCount(0, { timeout: 15_000 });
  });

  test("OTP lockout (429) shows the lockout message and does not log in", async ({ page }) => {
    const calls = await stubBackend(page, "locked");
    await signUpWithEmail(page);

    await expect(page.getByText(LOCKED_MESSAGE)).toBeVisible({ timeout: 15_000 });
    expect(paths(calls)).toEqual(["/v1/one-time-codes", "/v1/auth/sign-up"]);
    // Still on the code step so the user can request a new code.
    await expect(page.getByRole("heading", { name: "Verification Code" })).toBeVisible();
  });
});
