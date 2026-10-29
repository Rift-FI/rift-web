import { test, expect, type Page, type Route } from "@playwright/test";
import {
  computeBoundResealChallengeHex,
  type BoundResealMethod,
} from "../src/lib/boundReseal";

/**
 * Bound reseal challenge (enclave README "Bound reseal challenge").
 *
 * 1. Pure helper: the two contract test vectors (runs in Node, no browser).
 * 2. Add-method flow in the browser with a CDP virtual authenticator:
 *    the consent assertion's clientDataJSON.challenge must be the bound
 *    challenge when the backend returns `ownerAddress`, and the raw server
 *    nonce (legacy) when it doesn't.
 */

const OWNER = "00112233445566778899aabbccddeeff00112233";
const NONCE = "ab".repeat(32);

test.describe("bound reseal: contract vectors", () => {
  test("OIDC vector", async () => {
    const hex = await computeBoundResealChallengeHex(OWNER, NONCE, {
      kind: "oidc",
      iss: "https://accounts.google.com",
      sub: "1234567890",
    });
    expect(hex).toBe("377f6d645f6d470848bad62021c2c318e7da4ad82139f00f05b18a6ac43355cb");
  });

  test("Passkey vector", async () => {
    // cred_id = 01020304, cose = a50102 (base64 of the raw bytes)
    const hex = await computeBoundResealChallengeHex(OWNER, NONCE, {
      kind: "passkey",
      cred_id_b64: "AQIDBA==",
      cose_pubkey_b64: "pQEC",
    });
    expect(hex).toBe("5b812e4547e39fba673c5e3b9f30a68f0e454c89e8ba179e240afc0365c4dadd");
  });

  test("0x prefix / uppercase owner and extra OIDC fields don't change the result", async () => {
    const hex = await computeBoundResealChallengeHex("0x" + OWNER.toUpperCase(), NONCE, {
      kind: "oidc",
      iss: "https://accounts.google.com",
      sub: "1234567890",
      email: "x@example.com",
    } as BoundResealMethod);
    expect(hex).toBe("377f6d645f6d470848bad62021c2c318e7da4ad82139f00f05b18a6ac43355cb");
  });

  test("rejects malformed inputs", async () => {
    await expect(
      computeBoundResealChallengeHex("0x1234", NONCE, { kind: "oidc", iss: "a", sub: "b" })
    ).rejects.toThrow(/ownerAddress/);
    await expect(
      computeBoundResealChallengeHex(OWNER, NONCE, {
        kind: "passkey",
        cred_id_b64: "AQID-A__", // base64url is not what the enclave accepts
        cose_pubkey_b64: "pQEC",
      })
    ).rejects.toThrow(/base64/);
  });
});

// ─── browser flow ────────────────────────────────────────────────────

async function attachVirtualAuthenticator(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

function b64ToBase64Url(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hexToBase64Url(hex: string): string {
  return b64ToBase64Url(Buffer.from(hex, "hex").toString("base64"));
}

interface PostedAddMethod {
  authProof: { kind: string; cred_id_b64: string; client_data_json_b64: string };
  newMethod: BoundResealMethod & { cred_id_b64?: string };
}

type WebauthnModule = typeof import("../src/lib/webauthn");
// addMethod.ts uses the "@/..." alias, so describe just what we call.
interface AddMethodModule {
  runAddMethodFlow(args: Record<string, unknown>): Promise<{ boundChallenge: boolean }>;
  resolveConsentChallengeHex(
    challenge: { challengeHex: string; ownerAddress?: string | null },
    newMethod: BoundResealMethod
  ): Promise<{ challengeHex: string; bound: boolean }>;
}

async function stubAddMethodEndpoints(
  page: Page,
  ownerAddress: string | undefined
): Promise<{ posted: () => PostedAddMethod | null }> {
  let postedBody: PostedAddMethod | null = null;
  const cors = { "access-control-allow-origin": "*" };
  const fulfillJson = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(body) });

  await page.route("**/wallet/methods/challenge", (route) =>
    fulfillJson(route, {
      challengeHex: NONCE,
      ttlMs: 300_000,
      expiresAtMs: Date.now() + 300_000,
      ...(ownerAddress !== undefined ? { ownerAddress } : {}),
    })
  );
  await page.route("**/wallet/methods", (route) => {
    if (route.request().method() !== "POST") return fulfillJson(route, { enrolled: [] });
    postedBody = JSON.parse(route.request().postData() || "{}");
    return fulfillJson(route, { ok: true, ownerAddress: ownerAddress ?? "0x0", addedKind: "passkey" });
  });
  return { posted: () => postedBody };
}

function decodeClientDataChallenge(clientDataB64: string): string {
  const json = JSON.parse(Buffer.from(clientDataB64, "base64").toString("utf8"));
  expect(json.type).toBe("webauthn.get");
  return json.challenge as string;
}

test.describe("bound reseal: add-method flow", () => {
  test.setTimeout(120_000);
  test.skip(({ isMobile }) => isMobile, "browser flow is covered on desktop");

  for (const variant of ["bound", "legacy"] as const) {
    test(`passkey consent signs the ${variant} challenge`, async ({ page }) => {
      await attachVirtualAuthenticator(page);
      const owner = variant === "bound" ? "0x" + OWNER : undefined;
      const stub = await stubAddMethodEndpoints(page, owner);
      const warnings: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "warning") warnings.push(m.text());
      });
      await page.goto("/", { waitUntil: "commit", timeout: 90_000 });

      const result = await page.evaluate(async () => {
        const { enrolPasskey } = (await import("/src/lib/webauthn.ts")) as WebauthnModule;
        const { runAddMethodFlow } = (await import("/src/lib/addMethod.ts")) as AddMethodModule;
        // The wallet's existing passkey.
        const existing = await enrolPasskey({ rpId: "localhost", rpName: "Rift Test", userName: "existing" });
        const res = await runAddMethodFlow({
          existing: "passkey",
          newKind: "passkey",
          userLabel: "new-device",
          rpId: "localhost",
          rpName: "Rift Test",
          existingPasskeyCredIds:
            existing.method.kind === "passkey" ? [existing.method.cred_id_b64] : [],
        });
        const m = existing.method;
        return {
          existingCredId: m.kind === "passkey" ? m.cred_id_b64 : "",
          boundChallenge: res.boundChallenge,
        };
      });

      const posted = stub.posted();
      expect(posted, "POST /wallet/methods was sent").not.toBeNull();
      const body = posted as PostedAddMethod;
      expect(body.newMethod.kind).toBe("passkey");
      // Consent came from the EXISTING credential, never the one just created.
      expect(body.authProof.kind).toBe("passkey");
      expect(body.authProof.cred_id_b64).toBe(result.existingCredId);
      expect(body.newMethod.cred_id_b64).not.toBe(result.existingCredId);

      const challenge = decodeClientDataChallenge(body.authProof.client_data_json_b64);
      if (variant === "bound") {
        const expected = await computeBoundResealChallengeHex(OWNER, NONCE, body.newMethod);
        expect(result.boundChallenge).toBe(true);
        expect(challenge).toBe(hexToBase64Url(expected));
        expect(challenge).not.toBe(hexToBase64Url(NONCE));
      } else {
        expect(result.boundChallenge).toBe(false);
        expect(challenge).toBe(hexToBase64Url(NONCE));
        expect(warnings.some((w) => /no valid ownerAddress/.test(w))).toBe(true);
      }
    });
  }

  test("OIDC consent nonce is the lowercase-hex bound challenge", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit", timeout: 90_000 });
    const out = await page.evaluate(
      async ({ owner, nonce }) => {
        const { resolveConsentChallengeHex } = (await import(
          "/src/lib/addMethod.ts"
        )) as AddMethodModule;
        return resolveConsentChallengeHex(
          { challengeHex: nonce.toUpperCase(), ownerAddress: "0x" + owner },
          { kind: "oidc", iss: "https://accounts.google.com", sub: "1234567890" }
        );
      },
      { owner: OWNER, nonce: NONCE }
    );
    expect(out).toEqual({
      challengeHex: "377f6d645f6d470848bad62021c2c318e7da4ad82139f00f05b18a6ac43355cb",
      bound: true,
    });
  });
});
