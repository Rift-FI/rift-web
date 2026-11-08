import { test, expect, type Page } from "@playwright/test";
import {
  attachVirtualAuthenticator,
  clientData,
  expectedChallenge,
  installPasskeyBackend,
  newState,
  NEW_WALLET,
  seedCredential,
  seedSession,
  statusFor,
  WALLET,
  type MockState,
  type SubmitRecord,
} from "./helpers/passkey-backend";

/**
 * Passkey-owned wallets — app E2E (spec §4, §5).
 *
 * Chrome's virtual authenticator (CDP WebAuthn domain, ctap2 / internal /
 * resident keys / UV) performs every ceremony for real; the backend is
 * mocked in tests/helpers/passkey-backend.ts. For every submit we assert
 * that the authProof's clientDataJSON.challenge is base64url(hashToSign)
 * of the ticket the mock issued, type is webauthn.get, and — for seeded
 * credentials with a known key — that the P-256 signature verifies.
 */

test.setTimeout(120_000);
test.skip(({ isMobile }) => isMobile, "flows are covered on desktop");

const EMAIL = "tester@example.com";

function expectBound(rec: SubmitRecord | undefined, credentialId?: string) {
  expect(rec, "submit recorded").toBeTruthy();
  expect(rec!.expectedHash).toMatch(/^0x[0-9a-f]{64}$/);
  expect(rec!.authProof.kind).toBe("passkey");
  const cd = clientData(rec!.authProof.client_data_json_b64);
  expect(cd.type).toBe("webauthn.get");
  expect(cd.challenge).toBe(expectedChallenge(rec!.expectedHash));
  expect(rec!.challengeOk).toBe(true);
  if (credentialId) {
    expect(rec!.authProof.cred_id_b64).toBe(credentialId);
    expect(rec!.signatureOk, "P-256 signature verifies against the seeded key").toBe(true);
  }
}

async function captureCreateOptions(page: Page) {
  await page.addInitScript(() => {
    const creds = navigator.credentials;
    const orig = creds.create.bind(creds);
    (creds as any).create = async (o: CredentialCreationOptions) => {
      const pk = o.publicKey!;
      (window as any).__createOpts = {
        algs: pk.pubKeyCredParams.map((p) => p.alg),
        residentKey: pk.authenticatorSelection?.residentKey,
        userVerification: pk.authenticatorSelection?.userVerification,
        rpId: pk.rp.id,
      };
      return orig(o);
    };
  });
}

async function otpSignUp(page: Page) {
  await page.addInitScript(() => {
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

/** Load the app shell on `path` with a passkey wallet + one seeded credential. */
async function bootWallet(page: Page, state: MockState, path = "/app") {
  const auth = await attachVirtualAuthenticator(page);
  const cred = await seedCredential(auth, state);
  await installPasskeyBackend(page, state);
  await seedSession(page);
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
  return { auth, cred };
}

// ─── onboarding ──────────────────────────────────────────────────────

test.describe("onboarding", () => {
  test("new signup → mandatory passkey setup (ES256 only, resident key, UV)", async ({ page }) => {
    await attachVirtualAuthenticator(page);
    await captureCreateOptions(page);
    const state = await installPasskeyBackend(
      page,
      newState({ walletStatus: statusFor("none"), setupMode: "native" })
    );
    await otpSignUp(page);

    const setup = page.getByTestId("passkey-setup");
    await expect(setup.getByText("Secure your wallet with a passkey")).toBeVisible({ timeout: 20_000 });
    await setup.getByRole("button", { name: "Create passkey" }).click();
    await expect(setup.getByText("Your wallet is protected")).toBeVisible({ timeout: 20_000 });

    const opts = await page.evaluate(() => (window as any).__createOpts);
    expect(opts).toEqual({ algs: [-7], residentKey: "required", userVerification: "required", rpId: "localhost" });

    expect(state.attestations).toHaveLength(1);
    const att = state.attestations[0].attestation;
    expect(Object.keys(att).sort()).toEqual(["attestation_object_b64", "client_data_json_b64", "cred_id_b64"]);
    const cd = clientData(att.client_data_json_b64);
    expect(cd.type).toBe("webauthn.create");
    // No key provisioning at signup any more.
    const signup = state.requests.find((r) => r.path.endsWith("/v1/auth/sign-up"));
    expect(signup?.body.enrolledMethods).toBeUndefined();

    await setup.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByTestId("passkey-setup")).toHaveCount(0);
    await expect(page.getByText("Your account is ready")).toBeVisible();
  });

  test("legacy login → 'same wallet, same address' migration screen → done", async ({ page }) => {
    await attachVirtualAuthenticator(page);
    const state = await installPasskeyBackend(
      page,
      newState({
        walletStatus: statusFor("legacy"),
        setupMode: "legacy",
        signUpStatus: 409,
      })
    );
    await otpSignUp(page);

    const setup = page.getByTestId("passkey-setup");
    await expect(setup.getByText("Same wallet, same address — now protected by your passkey.", { exact: false })).toBeVisible({
      timeout: 20_000,
    });
    await setup.getByRole("button", { name: "Create passkey" }).click();

    // Per-chain progress: Polygon already migrated, Base still upgrading.
    await expect(setup.getByText("Upgrading your wallet")).toBeVisible({ timeout: 20_000 });
    const progress = setup.getByRole("list", { name: "Migration progress" });
    await expect(progress.getByText("Polygon")).toBeVisible();
    await expect(progress.locator("li", { hasText: "Base" })).toContainText("Upgrading");
    await expect(progress.locator("li", { hasText: "Polygon" })).toContainText("Protected");

    // Poll of /v1/wallet/status flips Base to passkey ownership.
    await expect(setup.getByText("Your wallet is protected")).toBeVisible({ timeout: 20_000 });
    await expect(setup.getByText("Same wallet, same address — now protected by your passkey.")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("address"))).toBe(WALLET);
    expect(state.requests.some((r) => r.path.endsWith("/v1/wallet/status"))).toBe(true);
  });

  test("legacy wallet with unrecoverable key → explains the new wallet (shell gate)", async ({ page }) => {
    await attachVirtualAuthenticator(page);
    const state = await installPasskeyBackend(
      page,
      newState({ walletStatus: statusFor("legacy"), setupMode: "unrecoverable" })
    );
    await seedSession(page);
    await page.goto("/app");

    const gate = page.getByRole("dialog", { name: "Secure your wallet with a passkey" });
    await expect(gate).toBeVisible({ timeout: 20_000 });
    await gate.getByRole("button", { name: "Create passkey" }).click();
    await expect(gate.getByText("We created a new wallet for you")).toBeVisible({ timeout: 20_000 });
    await expect(gate.getByText("Previous (legacy, unrecoverable)")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("address"))).toBe(NEW_WALLET);
    await gate.getByRole("button", { name: "Continue" }).click();
    await expect(gate).toHaveCount(0);
    expect(state.attestations).toHaveLength(1);
  });
});

// ─── fund-moving flows: every one is passkey-approved ────────────────

test.describe("transactions", () => {
  test("send: /v1/transactions/preview → passkey → submit-prepared", async ({ page }) => {
    const state = newState();
    const { cred } = await bootWallet(page, state);
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(async () => {
      const m = (await import("/src/hooks/wallet/use-send-transaction.tsx")) as any;
      return m.commitTransaction({ recipient: "0x000000000000000000000000000000000000dEaD", amount: "5", token: "USDC", chain: "BASE" });
    });
    expect(res.hash).toBe("0xtxhash");
    const preview = state.requests.find((r) => r.path.endsWith("/v1/transactions/preview"));
    expect(preview?.body).toMatchObject({ chain: "BASE", token: "USDC", amount: "5" });
    // No OTP / password travels with the transfer any more.
    expect(preview?.body.otpCode).toBeUndefined();
    expectBound(state.submits.find((s) => s.path.endsWith("submit-prepared")), cred.credentialId);
  });

  test("LiFi swap: the router call is passkey-approved as a user op", async ({ page }) => {
    const state = newState();
    const { cred } = await bootWallet(page, state);
    await page.waitForLoadState("networkidle");

    // Exactly what use-lifi-transaction hands to sendChainTx for a quote's
    // transactionRequest (approval tx first, then the swap).
    const res = await page.evaluate(async () => {
      const { sendChainTx } = (await import("/src/lib/nonCustodial.ts")) as any;
      const approve = await sendChainTx("BASE", {
        to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        value: "0",
        data: "0x095ea7b3" + "1".repeat(64) + "f".repeat(64),
        gasLimit: "100000",
        chainId: 8453,
      });
      const swap = await sendChainTx("BASE", {
        to: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
        value: "0",
        data: "0x4630a0d8deadbeef",
        gasLimit: "500000",
      });
      return { approve, swap };
    });
    expect(res.swap.hash).toBe("0xtxhash");
    const previews = state.requests.filter((r) => r.path.endsWith("/v1/wallet/user-operations/preview"));
    expect(previews).toHaveLength(2);
    expect(previews[1].body).toMatchObject({
      chain: "BASE",
      transactionData: { to: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", data: "0x4630a0d8deadbeef", value: "0" },
    });
    const submits = state.submits.filter((s) => s.path.endsWith("submit-prepared"));
    expect(submits).toHaveLength(2);
    submits.forEach((s) => expectBound(s, cred.credentialId));
    expect(submits[0].expectedHash).not.toBe(submits[1].expectedHash);
  });

  test("bridge: /v1/bridge/transfers/preview → passkey → submit-prepared", async ({ page }) => {
    const state = newState();
    const { cred } = await bootWallet(page, state);
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(async () => {
      const m = (await import("/src/hooks/data/use-bridge.tsx")) as any;
      return m.bridgeV3TwoPhase({ sourceChain: "BASE", destinationChain: "ARBITRUM", token: "USDC", amount: "10" });
    });
    expect(res).toMatchObject({ success: true, transactionHash: "0xtxhash", outputAmount: "9.9" });
    expect(state.requests.some((r) => r.path.endsWith("/bridge/execute"))).toBe(false);
    expectBound(state.submits.find((s) => s.path.endsWith("submit-prepared")), cred.credentialId);
  });

  test("offramp (pay / withdraw): init → passkey → finalize", async ({ page }) => {
    const state = newState();
    const { cred } = await bootWallet(page, state);
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(async () => {
      const pay = (await import("/src/hooks/data/use-payment.tsx")) as any;
      const wd = (await import("/src/hooks/data/use-create-withdrawal-order.tsx")) as any;
      const recipient = JSON.stringify({ accountIdentifier: "0700000000", currency: "KES", type: "MOBILE" });
      const a = await pay.makePayment({ token: "USDC", amount: 10, currency: "KES", chain: "base", recipient });
      const b = await wd.createWithdrawalOrder({ token: "USDC", amount: 10, currency: "KES", chain: "base", recipient });
      return { a, b };
    });
    expect(res.a.order).toMatchObject({ id: "ord_1", transactionCode: "TX123" });
    expect(res.b.order).toMatchObject({ id: "ord_1" });
    const finals = state.submits.filter((s) => s.path.endsWith("/v1/offramps/finalize"));
    expect(finals).toHaveLength(2);
    finals.forEach((s) => expectBound(s, cred.credentialId));
    const fin = state.requests.find((r) => r.path.endsWith("/v1/offramps/finalize"));
    expect(fin?.body).toMatchObject({ orderId: "ord_1" });
  });

  test("409 PASSKEY_SETUP_REQUIRED opens the setup gate; 400 INVALID_PASSKEY_SIGNATURE is explained", async ({ page }) => {
    const state = newState();
    await bootWallet(page, state);
    await page.waitForLoadState("networkidle");

    state.failNext.set("/v1/transactions/preview", { status: 409, body: { error: "PASSKEY_SETUP_REQUIRED" } });
    const err1 = await page.evaluate(async () => {
      const m = (await import("/src/hooks/wallet/use-send-transaction.tsx")) as any;
      try {
        await m.commitTransaction({ recipient: "0xdead", amount: "1", token: "USDC", chain: "BASE" });
        return null;
      } catch (e: any) {
        return { message: e.message, code: e.code, status: e.status };
      }
    });
    expect(err1).toMatchObject({ code: "PASSKEY_SETUP_REQUIRED", status: 409 });
    await expect(page.getByRole("dialog", { name: "Secure your wallet with a passkey" })).toBeVisible();

    await page.reload();
    state.failNext.set("/v1/wallet/user-operations/submit-prepared", {
      status: 400,
      body: { error: "INVALID_PASSKEY_SIGNATURE" },
    });
    const err2 = await page.evaluate(async () => {
      const { sendChainTx } = (await import("/src/lib/nonCustodial.ts")) as any;
      try {
        await sendChainTx("BASE", { to: "0xdead", data: "0x" });
        return null;
      } catch (e: any) {
        return { message: e.message, code: e.code };
      }
    });
    expect(err2?.code).toBe("INVALID_PASSKEY_SIGNATURE");
    expect(err2?.message).toMatch(/passkey couldn't approve/);
  });
});

// ─── WalletConnect ───────────────────────────────────────────────────

test.describe("WalletConnect", () => {
  test("personal_sign and eth_sendTransaction are approved with a passkey", async ({ page }) => {
    const state = newState({
      wcRequests: [
        {
          id: 1,
          topic: "t1",
          method: "personal_sign",
          params: ["0x48656c6c6f", WALLET],
          peerName: "Uniswap",
          chainId: 8453,
          smartWalletAddress: WALLET,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          topic: "t1",
          method: "eth_sendTransaction",
          params: [{ from: WALLET, to: "0x000000000000000000000000000000000000dEaD", value: "0x0", data: "0x" }],
          peerName: "Uniswap",
          chainId: 8453,
          smartWalletAddress: WALLET,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    const { cred } = await bootWallet(page, state, "/app/walletconnect");

    for (const label of ["sign message", "send transaction"]) {
      const modal = page.locator("div.fixed", { hasText: "Transaction Request" }).last();
      await expect(modal).toContainText(`Uniswap wants to ${label}`, { timeout: 20_000 });
      await modal.getByRole("button", { name: "Approve with passkey" }).click();
      await expect(page.getByText(`Uniswap wants to ${label}`)).toHaveCount(0, { timeout: 20_000 });
    }

    const approves = state.submits.filter((s) => /walletconnect\/requests\/\d+\/approve$/.test(s.path));
    expect(approves.map((a) => a.path.match(/requests\/(\d+)/)![1])).toEqual(["1", "2"]);
    approves.forEach((a) => expectBound(a, cred.credentialId));
    // ticketId from the preview is sent back with the proof.
    const bodies = state.requests.filter((r) => /\/approve$/.test(r.path)).map((r) => r.body);
    expect(bodies.every((b) => typeof b.ticketId === "string" && b.authProof?.kind === "passkey")).toBe(true);
  });
});

// ─── approvals (spec §2d) ────────────────────────────────────────────

function approval(id: string) {
  return {
    id,
    status: "pending",
    summary: { title: "Send 25 USDC", amount: "25", token: "USDC", recipient: "0x000000000000000000000000000000000000dEaD", createdVia: "api" },
    chainId: 8453,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
  };
}

test.describe("approval requests", () => {
  test("/approve/:id → approve with passkey", async ({ page }) => {
    const state = newState({ approvals: [approval("apr_1")] });
    const { cred } = await bootWallet(page, state, "/approve/apr_1");

    await expect(page.getByRole("heading", { name: "Send 25 USDC" })).toBeVisible({ timeout: 20_000 });
    const summary = page.getByTestId("approval-summary");
    await expect(summary).toContainText("25 USDC");
    await expect(summary).toContainText("Base");
    await page.getByRole("button", { name: "Approve with passkey" }).click();
    await expect(page.getByRole("heading", { name: "Approved" })).toBeVisible({ timeout: 20_000 });

    expect(state.requests.some((r) => r.path.endsWith("/v1/approvals/apr_1/preview"))).toBe(true);
    expectBound(state.submits.find((s) => s.path.endsWith("/v1/approvals/apr_1/approve")), cred.credentialId);
    expect(state.approvals[0].status).toBe("approved");
  });

  test("/approve/:id → reject; inbox lists pending requests", async ({ page }) => {
    const state = newState({ approvals: [approval("apr_2"), approval("apr_3")] });
    await bootWallet(page, state, "/app");

    // Inbox nudge in the shell → inbox → open one → reject.
    await page.getByTestId("pending-approvals-banner").click();
    await expect(page).toHaveURL(/\/app\/approvals$/);
    await page.getByRole("button", { name: /Send 25 USDC/ }).first().click();
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByRole("heading", { name: "Rejected" })).toBeVisible({ timeout: 20_000 });
    expect(state.requests.some((r) => r.path.endsWith("/v1/approvals/apr_2/reject"))).toBe(true);
    expect(state.submits.filter((s) => s.path.includes("/v1/approvals/"))).toHaveLength(0);
  });

  test("/approve/:id while logged out goes through login first", async ({ page }) => {
    const state = newState({ approvals: [approval("apr_4")] });
    await installPasskeyBackend(page, state);
    await page.goto("/approve/apr_4");
    await expect(page).toHaveURL(/\/auth/);
    expect(await page.evaluate(() => localStorage.getItem("rift_post_login_redirect"))).toBe("/approve/apr_4");
  });
});

// ─── Settings → Security → Passkeys ──────────────────────────────────

test.describe("passkeys settings", () => {
  test("add a second passkey: new credential approved by the existing one on every deployed chain", async ({ page }) => {
    const state = newState({ deployedChains: [8453, 137], excludeExisting: false });
    const { cred } = await bootWallet(page, state, "/app/profile/security/passkeys");

    await expect(page.getByTestId("single-passkey-warning")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Add a passkey" }).click();
    await expect(page.getByText("Passkey added")).toBeVisible({ timeout: 20_000 });

    expect(state.attestations).toHaveLength(1);
    const newCredId = state.attestations[0].attestation.cred_id_b64;
    expect(newCredId).not.toBe(cred.credentialId);
    expect(state.confirmBodies).toHaveLength(1);
    expect(state.confirmBodies[0].credentialId).toBe(newCredId);
    const sigs = state.submits.filter((s) => s.path.endsWith("/v1/wallet/passkeys/confirm"));
    expect(sigs).toHaveLength(2); // one per deployed chain
    sigs.forEach((s) => expectBound(s, cred.credentialId)); // signed by the EXISTING passkey
    await expect(page.getByTestId("passkey-row")).toHaveCount(2);
    await expect(page.getByTestId("single-passkey-warning")).toHaveCount(0);
  });

  test("remove a passkey: approved by a remaining passkey", async ({ page }) => {
    const state = newState({ deployedChains: [8453] });
    const auth = await attachVirtualAuthenticator(page);
    const keep = await seedCredential(auth, state, "MacBook");
    const drop = await seedCredential(auth, state, "Old phone");
    await installPasskeyBackend(page, state);
    await seedSession(page);
    await page.goto("/app/profile/security/passkeys", { waitUntil: "domcontentloaded", timeout: 90_000 });

    await page.getByRole("button", { name: "Remove Old phone" }).click({ timeout: 20_000 });
    await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("Passkey removed")).toBeVisible({ timeout: 20_000 });

    expect(state.requests.some((r) => r.method === "DELETE" && r.path.endsWith(`/v1/wallet/passkeys/${drop.id}`))).toBe(true);
    const sigs = state.submits.filter((s) => s.path.endsWith(`/${drop.id}/confirm-removal`));
    expect(sigs).toHaveLength(1);
    expectBound(sigs[0], keep.credentialId);
    await expect(page.getByTestId("passkey-row")).toHaveCount(1);
  });

  test("the last passkey can't be removed (UI refusal + backend 409 LAST_PASSKEY)", async ({ page }) => {
    const state = newState();
    const auth = await attachVirtualAuthenticator(page);
    const only = await seedCredential(auth, state, "MacBook");
    await installPasskeyBackend(page, state);
    await seedSession(page);
    await page.goto("/app/profile/security/passkeys", { waitUntil: "domcontentloaded", timeout: 90_000 });

    await expect(page.getByTestId("single-passkey-warning")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Remove MacBook" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Can't remove your only passkey");
    await expect(dialog.getByRole("button", { name: "Remove", exact: true })).toHaveCount(0);
    await dialog.getByRole("button", { name: "OK" }).click();
    expect(state.requests.some((r) => r.method === "DELETE")).toBe(false);

    // Server is the authority: if it refuses, the user sees why.
    await seedCredential(auth, state, "Tablet");
    await page.reload();
    await expect(page.getByTestId("passkey-row")).toHaveCount(2, { timeout: 20_000 });
    state.failNext.set(`/v1/wallet/passkeys/${only.id}`, { status: 409, body: { error: "LAST_PASSKEY" } });
    await page.getByRole("button", { name: "Remove MacBook" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("You can't remove your only passkey. Add another passkey first.")).toBeVisible();
    expect(state.passkeys).toHaveLength(2);
  });
});
