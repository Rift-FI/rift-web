import { test, expect } from "@playwright/test";
import {
  b64ToBytes,
  bytesToB64,
  bytesToB64url,
  bytesToHex,
  challengeMatchesHash,
  friendlyPasskeyError,
  friendlyWebAuthnError,
  hashToChallenge,
  hexToBytes,
  isApprovalActionable,
  isGestureRefusal,
  isRegistrationRetryable,
  mergeMigrationWithStatus,
  migrationProgress,
  normaliseChainStatus,
  normaliseSubmit,
  normaliseTicket,
  parseWalletStatus,
  passkeyErrorCode,
  resolveRpId,
  rpIdFitsHost,
  sameCredId,
  signerCredentialsFor,
  summaryRows,
  summaryTitle,
} from "../src/lib/passkeyUtils";

/**
 * Unit tests for the pure passkey-wallet helpers (Node, no browser).
 */

const HASH = "0x" + "ab".repeat(32);

test.describe("passkeyUtils: encodings", () => {
  test("hex / base64 / base64url round-trips", () => {
    const bytes = hexToBytes("0x00ff10fb");
    expect(Array.from(bytes)).toEqual([0, 255, 16, 251]);
    expect(bytesToHex(bytes)).toBe("0x00ff10fb");
    expect(bytesToB64(bytes)).toBe("AP8Q+w==");
    expect(bytesToB64url(bytes)).toBe("AP8Q-w");
    expect(Array.from(b64ToBytes("AP8Q-w"))).toEqual([0, 255, 16, 251]);
    expect(Array.from(b64ToBytes("AP8Q+w=="))).toEqual([0, 255, 16, 251]);
  });

  test("hexToBytes rejects malformed hex", () => {
    expect(() => hexToBytes("0x123")).toThrow(/odd-length/);
    expect(() => hexToBytes("0xzz")).toThrow(/invalid hex/);
  });

  test("hashToChallenge requires exactly 32 bytes", () => {
    expect(hashToChallenge(HASH).length).toBe(32);
    expect(() => hashToChallenge("0x" + "ab".repeat(31))).toThrow(/32 bytes/);
    expect(() => hashToChallenge("0x" + "ab".repeat(33))).toThrow(/32 bytes/);
  });

  test("challengeMatchesHash decodes clientDataJSON", () => {
    const challenge = Buffer.from("ab".repeat(32), "hex").toString("base64url");
    const cd = Buffer.from(
      JSON.stringify({ type: "webauthn.get", challenge, origin: "http://localhost:5173" })
    ).toString("base64");
    expect(challengeMatchesHash(cd, HASH)).toBe(true);
    expect(challengeMatchesHash(cd, "0x" + "cd".repeat(32))).toBe(false);
    expect(challengeMatchesHash("not-json", HASH)).toBe(false);
  });

  test("sameCredId ignores b64 vs b64url spelling", () => {
    expect(sameCredId("AP8Q+w==", "AP8Q-w")).toBe(true);
    expect(sameCredId("AP8Q+w==", "AP8Q-x")).toBe(false);
    expect(sameCredId(undefined, "a")).toBe(false);
  });
});

test.describe("passkeyUtils: wire normalisation", () => {
  test("normaliseTicket reads every historical spelling", () => {
    expect(normaliseTicket({ ticketId: "t1", hashToSign: HASH, chainId: 8453, allowCredentials: ["A"] })).toEqual({
      ticketId: "t1",
      hashToSign: HASH,
      chainId: 8453,
      allowCredentials: ["A"],
    });
    expect(normaliseTicket({ success: true, ticketId: "t2", userOpHashHex: HASH })?.hashToSign).toBe(HASH);
    expect(normaliseTicket({ success: true, data: { ticket_id: "t3", hash_to_sign: HASH } })?.ticketId).toBe("t3");
    expect(
      normaliseTicket({ ticketId: "t4", hashToSign: HASH, allowCredentials: [{ id: "X" }, { type: "public-key" }] })
        ?.allowCredentials
    ).toEqual(["X"]);
    expect(normaliseTicket({ ticketId: "t5" })).toBeNull();
    expect(normaliseTicket(null)).toBeNull();
  });

  test("normaliseSubmit prefers the transaction hash", () => {
    expect(normaliseSubmit({ userOpHash: "0xuo", transactionHash: "0xtx", status: "success" })).toEqual({
      hash: "0xtx",
      transactionHash: "0xtx",
      userOpHash: "0xuo",
      status: "success",
    });
    expect(normaliseSubmit({ success: true, hash: "0xh", userOperationHash: "0xuo" }).hash).toBe("0xh");
    expect(normaliseSubmit({ userOpHash: "0xuo" }).hash).toBe("0xuo");
  });

  test("passkeyErrorCode + friendly copy", () => {
    expect(passkeyErrorCode({ error: "PASSKEY_SETUP_REQUIRED" })).toBe("PASSKEY_SETUP_REQUIRED");
    expect(passkeyErrorCode({ code: "INVALID_PASSKEY_SIGNATURE" })).toBe("INVALID_PASSKEY_SIGNATURE");
    expect(passkeyErrorCode({ status: "APPROVAL_REQUIRED" })).toBe("APPROVAL_REQUIRED");
    expect(passkeyErrorCode({ error: "something else" })).toBeUndefined();
    expect(friendlyPasskeyError("LAST_PASSKEY")).toMatch(/only passkey/);
    expect(friendlyPasskeyError("PASSKEY_REQUIRED")).toMatch(/passkey/);
    expect(friendlyPasskeyError(undefined)).toBeUndefined();
  });

  test("registration retry + gesture refusal classification", () => {
    expect(isRegistrationRetryable("PASSKEY_POSSESSION_REQUIRED")).toBe(true);
    expect(isRegistrationRetryable("INVALID_PASSKEY_SIGNATURE")).toBe(true);
    expect(isRegistrationRetryable("LAST_PASSKEY")).toBe(false);
    expect(isRegistrationRetryable(undefined)).toBe(false);
    expect(passkeyErrorCode({ error: "PASSKEY_POSSESSION_REQUIRED" })).toBe("PASSKEY_POSSESSION_REQUIRED");
    expect(friendlyPasskeyError("PASSKEY_POSSESSION_REQUIRED")).toMatch(/try again/);
    expect(isGestureRefusal({ name: "NotAllowedError" })).toBe(true);
    expect(isGestureRefusal(new Error("x"))).toBe(false);
  });

  test("friendlyWebAuthnError maps DOMException names", () => {
    expect(friendlyWebAuthnError({ name: "NotAllowedError", message: "x" })).toMatch(/cancelled/);
    expect(friendlyWebAuthnError({ name: "InvalidStateError" })).toMatch(/already registered/);
    expect(friendlyWebAuthnError(new Error("boom"))).toBe("boom");
  });
});

test.describe("passkeyUtils: RP id", () => {
  test("uses the configured id only when it fits the host", () => {
    expect(resolveRpId("app.riftfi.com", "riftfi.com")).toBe("riftfi.com");
    expect(resolveRpId("riftfi.com", "riftfi.com")).toBe("riftfi.com");
    expect(resolveRpId("localhost", "riftfi.com")).toBe("localhost");
    expect(resolveRpId("preview.vercel.app", "riftfi.com")).toBe("preview.vercel.app");
    expect(resolveRpId("app.sandbox.riftfi.com", undefined)).toBe("riftfi.com");
    expect(resolveRpId("127.0.0.1", undefined)).toBe("127.0.0.1");
  });

  test("rpIdFitsHost", () => {
    expect(rpIdFitsHost("app.riftfi.com", "riftfi.com")).toBe(true);
    expect(rpIdFitsHost("evilriftfi.com", "riftfi.com")).toBe(false);
    expect(rpIdFitsHost("localhost", "")).toBe(false);
  });
});

test.describe("passkeyUtils: wallet status + migration", () => {
  test("parseWalletStatus accepts bare and wrapped payloads", () => {
    const raw = {
      mode: "legacy",
      walletAddress: "0xabc",
      passkeyCount: 0,
      chains: [{ chainId: 8453, deployed: true, ownerMode: "legacy_eoa" }, { chainId: "bad" }],
      needsPasskeySetup: true,
    };
    const s = parseWalletStatus(raw)!;
    expect(s.mode).toBe("legacy");
    expect(s.chains).toEqual([{ chainId: 8453, deployed: true, ownerMode: "legacy_eoa" }]);
    expect(s.needsPasskeySetup).toBe(true);
    expect(parseWalletStatus({ walletStatus: raw })?.walletAddress).toBe("0xabc");
    expect(parseWalletStatus({ data: raw })?.walletAddress).toBe("0xabc");
    // Generic stub bodies are not a wallet status.
    expect(parseWalletStatus({ data: [], orders: [] })).toBeNull();
    expect(parseWalletStatus(undefined)).toBeNull();
  });

  test("chain migration status normalisation + progress", () => {
    expect(normaliseChainStatus("migrated")).toBe("migrated");
    expect(normaliseChainStatus("submitted")).toBe("migrating");
    expect(normaliseChainStatus("MIGRATION_NEEDS_GAS")).toBe("failed");
    expect(normaliseChainStatus("undeployed")).toBe("skipped");
    expect(normaliseChainStatus(undefined)).toBe("pending");

    const chains = [
      { chainId: 8453, status: "migrating" as const },
      { chainId: 137, status: "migrated" as const },
      { chainId: 80094, status: "skipped" as const },
    ];
    expect(migrationProgress(chains)).toEqual({ done: 1, total: 2, failed: 0, complete: false });
    const merged = mergeMigrationWithStatus(chains, {
      mode: "passkey",
      walletAddress: "0xabc",
      passkeyCount: 1,
      needsPasskeySetup: false,
      chains: [{ chainId: 8453, deployed: true, ownerMode: "passkey" }],
    });
    expect(merged[0].status).toBe("migrated");
    expect(migrationProgress(merged).complete).toBe(true);
    expect(mergeMigrationWithStatus(chains, null)).toBe(chains);
  });
});

test.describe("passkeyUtils: approvals + signer selection", () => {
  test("isApprovalActionable", () => {
    const now = Date.parse("2026-11-08T12:00:00Z");
    expect(isApprovalActionable("pending", "2026-11-08T12:30:00Z", now)).toBe(true);
    expect(isApprovalActionable("pending", "2026-11-08T11:30:00Z", now)).toBe(false);
    expect(isApprovalActionable("pending", undefined, now)).toBe(true);
    expect(isApprovalActionable("approved", "2026-11-08T12:30:00Z", now)).toBe(false);
  });

  test("summaryRows / summaryTitle", () => {
    const rows = summaryRows({
      title: "Send 5 USDC",
      amount: "5",
      token: "USDC",
      recipient: "0xdead",
      chainId: 8453,
      createdVia: "api",
      nested: { x: 1 },
    });
    expect(rows).toEqual([
      { label: "Amount", value: "5 USDC" },
      { label: "To", value: "0xdead" },
      { label: "Network", value: "Base" },
      { label: "Requested via", value: "api" },
    ]);
    expect(summaryTitle({ title: "Send 5 USDC" })).toBe("Send 5 USDC");
    expect(summaryTitle({ opType: "swap" })).toBe("swap");
    expect(summaryTitle(null)).toBe("Approve request");
  });

  test("signerCredentialsFor excludes the passkey being added / removed", () => {
    const pks = [
      { credentialId: "A", status: "active" },
      { credentialId: "B", status: "active" },
      { credentialId: "C", status: "removed" },
    ];
    expect(signerCredentialsFor(pks, "B")).toEqual(["A"]);
    expect(signerCredentialsFor(pks, "Z")).toEqual(["A", "B"]);
    expect(signerCredentialsFor([{ credentialId: "A" }], "A")).toEqual(["A"]);
    expect(signerCredentialsFor(pks, "B", ["S"])).toEqual(["S"]);
  });
});
