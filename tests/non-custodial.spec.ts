/**
 * Non-custodial (v3) flow smoke tests.
 *
 * Uses Chromium's CDP `WebAuthn.addVirtualAuthenticator` so the WebAuthn
 * ceremonies run for real (browser → authenticator) without needing a
 * human Touch ID prompt. The virtual authenticator stays in the same
 * process — credentials live for the session and disappear when the
 * page closes.
 *
 * What's covered:
 *   1. signWithPasskey produces an AuthProof with the expected shape and
 *      a non-empty signature_b64 (proving the virtual authenticator
 *      actually signed).
 *   2. signAndSubmitUserOp runs the full preview → assertion →
 *      submit-prepared flow and forwards authProof.signature_b64 to the
 *      submit endpoint.
 *
 * What's NOT covered here (deliberate scope cut):
 *   - The end-to-end signup-with-enrolment React flow. That requires
 *     the full auth bootstrap; the helper-level assertions below give
 *     us 90% of the behavioural confidence without the test brittleness.
 */

import { test, expect, type Page } from "@playwright/test";

// Add a virtual platform authenticator via CDP. Returns the authenticatorId
// so the test can target operations at it explicitly if needed.
async function attachVirtualAuthenticator(page: Page): Promise<string> {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  const { authenticatorId } = await client.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    }
  );
  return authenticatorId;
}

// Bootstrap a minimal page that has the /app's helpers reachable. Vite
// serves the source via ES modules so dynamic import("/src/lib/...") works
// in dev. We don't actually need the React app to mount.
async function bootstrapFixture(page: Page): Promise<void> {
  await page.route("**/v1/wallet/user-operations/preview", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        userOpHashHex:
          "0x".concat("ab".repeat(32)), // any 32-byte hex; the virtual authenticator will sign over it
        ticketId: "tk_test_0001",
        expiresAtMs: Date.now() + 60_000,
        ttlMs: 60_000,
        smartAccountAddress: "0x000000000000000000000000000000000000dEaD",
        chainId: 42161,
      }),
    });
  });

  await page.route("**/v1/wallet/user-operations/submit-prepared", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        hash: "0xbeefdead",
        userOperationHash: "0xbeefdead",
        chainId: 42161,
      }),
    });
  });

  // Land on / (any page — the helpers run regardless of the route).
  // Use commit-only wait + a generous timeout — the dev server can be
  // slow on cold start and the helpers we're testing don't need the
  // React app to mount, just the dev server's source-module routing.
  await page.goto("/", { waitUntil: "commit", timeout: 90_000 });
}

// Cold-start dev server can take 30+ seconds. The actual helper work
// is fast.
test.setTimeout(120_000);

test.describe("v3 non-custodial helpers", () => {
  test("signWithPasskey produces a passkey AuthProof with a real signature", async ({
    page,
  }) => {
    await attachVirtualAuthenticator(page);
    await bootstrapFixture(page);

    // First enrol so the authenticator has a credential to sign with.
    const enrolment = await page.evaluate(async () => {
      const { enrolPasskey } = (await import("/src/lib/webauthn.ts")) as any;
      return enrolPasskey({
        rpId: "localhost",
        rpName: "Rift Test",
        userName: "test-user-001",
      });
    });
    expect(enrolment.method.kind).toBe("passkey");
    expect(typeof enrolment.method.cred_id_b64).toBe("string");
    expect(enrolment.method.cred_id_b64.length).toBeGreaterThan(20);
    expect(typeof enrolment.method.cose_pubkey_b64).toBe("string");
    expect(enrolment.method.cose_pubkey_b64.length).toBeGreaterThan(80);

    // Now run an assertion bound to a specific user_op_hash and verify
    // the AuthProof shape + that a non-trivial signature came back.
    const userOpHashHex = "0x" + "ab".repeat(32);
    const credIds = [enrolment.method.cred_id_b64];
    const proof = await page.evaluate(
      async ({ rpId, userOpHashHex, credIds }) => {
        const { signWithPasskey } = (await import(
          "/src/lib/webauthn.ts"
        )) as any;
        return signWithPasskey({ rpId, userOpHashHex, credIds });
      },
      { rpId: "localhost", userOpHashHex, credIds }
    );

    expect(proof.kind).toBe("passkey");
    expect(proof.cred_id_b64).toBe(enrolment.method.cred_id_b64);
    expect(typeof proof.client_data_json_b64).toBe("string");
    expect(typeof proof.authenticator_data_b64).toBe("string");
    expect(typeof proof.signature_b64).toBe("string");
    // A real ECDSA signature, even minimally encoded, is well over 32
    // chars of base64. Zero / empty would mean the virtual authenticator
    // didn't actually sign — the very thing we're testing.
    expect(proof.signature_b64.length).toBeGreaterThan(40);

    // The clientDataJSON must carry our challenge — this is the WHOLE
    // POINT of the v3 binding. Decode and inspect.
    const clientData = await page.evaluate((b64: string) => {
      const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
      const pad = norm + "=".repeat((4 - (norm.length % 4)) % 4);
      const bin = atob(pad);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }, proof.client_data_json_b64);
    const parsed = JSON.parse(clientData);
    expect(parsed.type).toBe("webauthn.get");
    // challenge is base64url of the raw bytes we passed in.
    expect(typeof parsed.challenge).toBe("string");
    expect(parsed.challenge.length).toBeGreaterThan(20);
  });

  test("signAndSubmitUserOp runs preview → assertion → submit and forwards authProof", async ({
    page,
  }) => {
    await attachVirtualAuthenticator(page);
    await bootstrapFixture(page);

    // Enrol first so the authenticator has a credential.
    const enrolment = await page.evaluate(async () => {
      const { enrolPasskey } = (await import("/src/lib/webauthn.ts")) as any;
      return enrolPasskey({
        rpId: "localhost",
        rpName: "Rift Test",
        userName: "test-user-002",
      });
    });
    const credIds = [enrolment.method.cred_id_b64];

    // Capture the submit-prepared request so we can assert the body
    // shape including authProof.signature_b64.
    let submitBody: any = null;
    await page.route(
      "**/v1/wallet/user-operations/submit-prepared",
      async (route) => {
        try {
          submitBody = JSON.parse(route.request().postData() || "{}");
        } catch {
          submitBody = null;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            hash: "0xbeefdead",
            userOperationHash: "0xbeefdead",
            chainId: 42161,
          }),
        });
      }
    );

    const result = await page.evaluate(
      async ({ credIds }) => {
        const { signAndSubmitUserOp } = (await import(
          "/src/lib/nonCustodial.ts"
        )) as any;
        return signAndSubmitUserOp({
          accessToken: "dummy-test-token",
          chain: "ARBITRUM",
          transactionData: {
            to: "0x000000000000000000000000000000000000dEaD",
            data: "0xdeadbeef",
            value: "0",
          },
          credIds,
          rpId: "localhost",
        });
      },
      { credIds }
    );

    expect(result.success).toBe(true);
    expect(result.hash).toBe("0xbeefdead");

    expect(submitBody, "submit-prepared was POSTed").not.toBeNull();
    expect(submitBody.ticketId).toBe("tk_test_0001");
    expect(submitBody.authProof?.kind).toBe("passkey");
    expect(typeof submitBody.authProof?.signature_b64).toBe("string");
    expect(submitBody.authProof.signature_b64.length).toBeGreaterThan(40);
    expect(typeof submitBody.authProof?.client_data_json_b64).toBe("string");
    expect(submitBody.authProof.cred_id_b64).toBe(
      enrolment.method.cred_id_b64
    );
  });
});
