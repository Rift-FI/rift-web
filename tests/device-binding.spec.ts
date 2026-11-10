import { test, expect, Page } from "@playwright/test";
import { createHash, createPublicKey, verify } from "node:crypto";
import { installConsoleMocks, type MockState } from "./helpers/console-mocks";

/**
 * Device binding (DEVICE-BINDING-CONTRACT): device key, X-Rift-Device
 * header, the "Approve this device" panel, OTP cooling-off, Settings →
 * Devices and the emailed cancel link. Backend mocked.
 */

const HEADER_RE = /^dev_this\.(\d{10})\.([A-Za-z0-9_-]+)$/;

function verifyDeviceHeader(state: MockState, r: MockState["requests"][number]) {
  const header = r.headers["x-rift-device"];
  expect(header, `${r.method} ${r.path} carries X-Rift-Device`).toMatch(HEADER_RE);
  const [id, ts, sig] = header.split(".");
  expect(Math.abs(Date.now() / 1000 - Number(ts))).toBeLessThan(120);
  const bodyHash = createHash("sha256").update(r.raw || "").digest("hex");
  const message = `rift-device-v1\n${id}\n${ts}\n${r.method}\n${r.path}\n${bodyHash}`;
  const key = createPublicKey({ key: Buffer.from(state.device.publicKey!, "base64"), format: "der", type: "spki" });
  expect(verify("sha256", Buffer.from(message), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(sig, "base64url")), "signature verifies against the registered SPKI").toBe(true);
}

async function noOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

const skipAutoPanel = (page: Page) => page.addInitScript(() => sessionStorage.setItem("rift_device_panel_seen", "1"));

test.describe("device key + header", () => {
  test("a non-extractable P-256 key is created and every authenticated request is signed with it", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, device: "trusted" });
    await page.goto("/app");
    await expect.poll(() => state.device.publicKey, { timeout: 15_000 }).toBeTruthy();

    const key = await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((res, rej) => {
        const r = indexedDB.open("rift-device");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      const all: any[] = await new Promise((res) => {
        const r = db.transaction("keys").objectStore("keys").getAll();
        r.onsuccess = () => res(r.result);
      });
      const pair = all[0] as CryptoKeyPair;
      let exportable = true;
      try {
        await crypto.subtle.exportKey("pkcs8", pair.privateKey);
      } catch {
        exportable = false;
      }
      const spki = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey))));
      return { count: all.length, extractable: pair.privateKey.extractable, exportable, curve: (pair.privateKey.algorithm as EcKeyAlgorithm).namedCurve, usages: pair.privateKey.usages, spki };
    });
    expect(key).toMatchObject({ count: 1, extractable: false, exportable: false, curve: "P-256", usages: ["sign"] });
    expect(key.spki).toBe(state.device.publicKey);

    const reg = state.requests.find((r) => r.method === "POST" && r.path.endsWith("/v1/devices"));
    expect(reg?.body).toMatchObject({ publicKey: key.spki });
    expect(reg?.body.label).toMatch(/ on /);

    // Requests after registration carry a valid proof.
    await page.goto("/app/payments");
    await expect(page.locator("[data-testid=payment-row]:visible").first()).toBeVisible({ timeout: 15_000 });
    const signed = state.requests.filter((r) => r.headers["x-rift-device"] && r.path.endsWith("/v1/ledger"));
    expect(signed.length).toBeGreaterThan(0);
    verifyDeviceHeader(state, signed[signed.length - 1]);

    // Same key after a reload (kept in IndexedDB, not regenerated).
    const before = state.device.publicKey;
    await page.reload();
    await expect.poll(() => state.requests.filter((r) => r.method === "POST" && r.path.endsWith("/v1/devices")).length, { timeout: 15_000 }).toBeGreaterThan(1);
    expect(state.device.publicKey).toBe(before);
  });

  test("POST bodies are hashed into the proof", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, device: "trusted" });
    await page.goto("/app/settings");
    await expect.poll(() => state.device.publicKey, { timeout: 15_000 }).toBeTruthy();
    const card = page.getByTestId("settings-beneficiaries");
    await card.getByRole("button", { name: "Rename Kilimo Fresh" }).click({ timeout: 15_000 });
    await card.getByLabel("Nickname").fill("Kilimo grocer");
    await card.getByRole("button", { name: "Save name" }).click();
    await expect(card).toContainText("Kilimo grocer");
    const patch = state.requests.find((r) => r.method === "PATCH");
    expect(patch?.raw).toBe(JSON.stringify({ label: "Kilimo grocer" }));
    verifyDeviceHeader(state, patch!);
  });

  test("backend without device endpoints: no header, no panel, everything works", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, device: "none" });
    await page.goto("/app");
    await expect(page.getByTestId("balance-amount")).toContainText("$", { timeout: 15_000 });
    await page.waitForTimeout(800);
    expect(state.requests.some((r) => r.headers["x-rift-device"])).toBe(false);
    await expect(page.getByTestId("device-panel")).toHaveCount(0);
    await expect(page.getByTestId("device-strip")).toHaveCount(0);
  });
});

test.describe("approve this device", () => {
  test("pending: calm panel once per session, dismissible; balance and activity stay visible", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, device: "pending", deviceEnforced: true });
    await page.goto("/app");
    const panel = page.getByTestId("device-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByRole("heading", { name: "Approve this device" })).toBeVisible();
    await expect(panel.getByTestId("approve-elsewhere")).toContainText("Settings → Devices");
    await expect(panel.getByRole("alert")).toHaveCount(0);
    expect(await noOverflow(page)).toBe(true);
    await panel.getByRole("button", { name: "Close" }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.getByTestId("device-strip")).toContainText("Approve this device to send money");
    await expect(page.getByTestId("balance-amount")).toContainText("$14,860.80");
    await page.goto("/app/payments");
    await expect(page.locator("[data-testid=payment-row]:visible").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("device-panel")).toHaveCount(0); // not again this session
    await page.getByTestId("device-strip").click();
    await expect(page.getByTestId("device-panel")).toBeVisible();
  });

  test("approval from the other device is picked up while the panel is open", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, device: "pending", deviceEnforced: true });
    await page.goto("/app");
    const panel = page.getByTestId("device-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    state.device.status = "trusted";
    await expect(panel.getByRole("heading", { name: "This device is approved" })).toBeVisible({ timeout: 15_000 });
    await panel.getByTestId("device-approved-continue").click();
    await expect(page.getByTestId("device-strip")).toHaveCount(0);
  });

  test("no other device: OTP → 24h waiting period with a countdown", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, device: "pending", deviceEnforced: true });
    await page.goto("/app");
    const panel = page.getByTestId("device-panel");
    await panel.getByTestId("device-lost").click({ timeout: 15_000 });
    await expect(panel).toContainText("t***@example.com", { timeout: 15_000 });
    await panel.getByTestId("device-otp").fill("000000");
    await panel.getByTestId("device-otp-verify").click();
    await expect(panel.getByRole("status").filter({ hasText: "didn't work" })).toBeVisible();
    await expect(panel.getByRole("alert")).toHaveCount(0);
    await panel.getByTestId("device-otp").fill("123456");
    await panel.getByTestId("device-otp-verify").click();
    await expect(panel.getByTestId("device-countdown")).toHaveText(/^2[34]:\d{2}:\d{2}$/, { timeout: 15_000 });
    await expect(panel).toContainText("can move money after");
    const start = state.requests.find((r) => r.path.endsWith("/recover/start"))!;
    verifyDeviceHeader(state, start);
    expect(state.requests.filter((r) => r.path.endsWith("/recover/verify")).map((r) => r.body.otpCode)).toEqual(["000000", "123456"]);
    await panel.getByRole("button", { name: "Done" }).click();
    await expect(page.getByTestId("device-strip")).toContainText(/can send money in 2[34]h/);
  });

  test("DEVICE_NOT_TRUSTED on a money action: the panel, not a red error", async ({ page }) => {
    await skipAutoPanel(page);
    const state = await installConsoleMocks(page, { rich: true, device: "pending", deviceEnforced: true });
    await page.goto("/app/add-funds?tab=buy");
    await page.getByLabel("Amount").fill("1000");
    await expect(page.getByTestId("buy-quote")).toContainText("USDC", { timeout: 15_000 });
    await page.getByTestId("buy-continue").click();
    await expect(page.getByTestId("device-panel")).toBeVisible({ timeout: 15_000 });
    expect(state.requests.some((r) => r.method === "POST" && r.path.endsWith("/v1/onramps"))).toBe(true);
    await page.getByTestId("device-panel").getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("buy-panel").getByRole("alert")).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast][data-type=error]")).toHaveCount(0);
    // Statement (another gated action) behaves the same.
    await page.goto("/app/payments");
    await page.getByTestId("open-statement").click({ timeout: 15_000 });
    await page.getByTestId("statement-submit").click();
    await expect(page.getByTestId("device-panel")).toBeVisible({ timeout: 15_000 });
  });

  test("cooling off: the panel shows the time left", async ({ page }) => {
    await installConsoleMocks(page, { rich: true, device: "cooling_off", deviceEnforced: true });
    await page.goto("/app");
    const panel = page.getByTestId("device-panel");
    await expect(panel.getByTestId("device-countdown")).toHaveText(/^2[23]:\d{2}:\d{2}$/, { timeout: 15_000 });
  });
});

test.describe("cancel link", () => {
  test("blocks the new device from the email link (no sign-in)", async ({ page }) => {
    const state = await installConsoleMocks(page, { device: "trusted" });
    await page.goto("/devices/cancel?d=dev_new&t=tok_ok");
    const card = page.getByTestId("device-cancel");
    await expect(card.getByRole("heading", { name: "Block this new device?" })).toBeVisible();
    await card.getByTestId("device-cancel-confirm").click();
    await expect(card.getByRole("heading", { name: "Device blocked" })).toBeVisible();
    const req = state.requests.find((r) => r.path.endsWith("/v1/devices/dev_new/recover/cancel"));
    expect(req?.body).toEqual({ token: "tok_ok" });
    expect(req?.headers.authorization).toBeUndefined();
    expect(await noOverflow(page)).toBe(true);
  });

  test("expired or incomplete links say so", async ({ page }) => {
    await installConsoleMocks(page, { device: "trusted" });
    await page.goto("/devices/cancel?d=dev_new&t=bad");
    await page.getByTestId("device-cancel-confirm").click();
    await expect(page.getByTestId("device-cancel")).toContainText("expired or was already used");
    await page.goto("/devices/cancel");
    await expect(page.getByRole("heading", { name: "Link not valid" })).toBeVisible();
  });
});

test.describe("settings → devices", () => {
  test("list with this-device marker; remove with confirm; last trusted device can't go", async ({ page }) => {
    const state = await installConsoleMocks(page, { rich: true, device: "trusted" });
    state.otherDevices.push({ id: "dev_tab", label: "Chrome on Android", platform: "android", status: "cooling_off", createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), coolingOffUntil: new Date(Date.now() + 5 * 3600_000).toISOString() });
    await page.goto("/app/settings");
    await page.getByRole("button", { name: /Devices/ }).click();
    await expect(page).toHaveURL(/\/app\/settings\/devices$/);
    const rows = page.getByTestId("device-row");
    await expect(rows).toHaveCount(3, { timeout: 15_000 });
    await expect(rows.filter({ has: page.getByTestId("this-device") })).toHaveCount(1);
    await expect(rows.filter({ hasText: "Chrome on Android" }).getByTestId("device-row-countdown")).toHaveText(/Can move money in [45]:\d{2}:\d{2}/);
    expect(await noOverflow(page)).toBe(true);

    await rows.filter({ hasText: "Safari on Mac" }).getByRole("button", { name: "Remove Safari on Mac" }).click();
    await rows.filter({ hasText: "Safari on Mac" }).getByTestId("confirm-remove-device").click();
    await expect(rows).toHaveCount(2);

    const mine = rows.filter({ has: page.getByTestId("this-device") });
    await mine.getByRole("button", { name: /^Remove / }).click();
    await mine.getByTestId("confirm-remove-device").click();
    await expect(mine.getByRole("status")).toContainText("only trusted device");
    expect(state.requests.filter((r) => r.method === "DELETE").map((r) => r.path.split("/").pop())).toEqual(["dev_mac", "dev_this"]);
  });

  test("a pending current device shows the approve callout", async ({ page }) => {
    await skipAutoPanel(page);
    await installConsoleMocks(page, { rich: true, device: "pending", deviceEnforced: true });
    await page.goto("/app/settings/devices");
    await page.getByTestId("this-device-callout").click({ timeout: 15_000 });
    await expect(page.getByTestId("device-panel")).toBeVisible();
    // A pending device can't approve others.
    await expect(page.getByTestId("approve-device")).toHaveCount(0);
  });
});
