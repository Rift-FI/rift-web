import { createHash, createPublicKey, generateKeyPairSync, verify, type KeyObject } from "node:crypto";
import type { CDPSession, Page, Route } from "@playwright/test";

/**
 * Mocked Rift backend for the passkey-wallet E2E tests.
 *
 * Implements the wire contract of the passkey spec (§2b-2d) in memory:
 * every preview issues a ticket with a fresh 32-byte hash; every submit
 * records the authProof and checks that clientDataJSON.challenge is
 * base64url(hashToSign) and type is webauthn.get. When the signing
 * credential was seeded via `seedCredential` (known private key) the
 * P-256 signature is verified too, exactly as the backend does
 * (authenticatorData || sha256(clientDataJSON)).
 */

export const WALLET = "0x1111111111111111111111111111111111111111";
export const NEW_WALLET = "0x2222222222222222222222222222222222222222";
const ORIGINS = [/^https:\/\/sandbox\.riftfi\.com\//, /^https:\/\/[a-z.]*riftfi\.xyz\//];

export interface SubmitRecord {
  path: string;
  ticketId: string;
  expectedHash: string;
  authProof: any;
  challengeOk: boolean;
  typeOk: boolean;
  /** true / false when the signer's public key is known, null otherwise */
  signatureOk: boolean | null;
}

export interface Ticket {
  ticketId: string;
  hashToSign: string;
  chainId: number;
  purpose: string;
}

export interface PasskeyRow {
  id: string;
  credentialId: string;
  label: string;
  signerAddress: string;
  signerKind: "shared" | "proxy";
  createdAt: string;
  lastUsedAt: string | null;
  status: "pending" | "active";
}

export interface Approval {
  id: string;
  status: string;
  summary: Record<string, unknown>;
  chainId: number;
  createdAt: string;
  expiresAt: string;
  result?: { transactionHash: string; userOpHash: string };
}

export interface MockState {
  walletStatus: any;
  /** what POST /v1/wallet/passkeys does for a first passkey */
  setupMode: "native" | "legacy" | "unrecoverable";
  passkeys: PasskeyRow[];
  approvals: Approval[];
  wcRequests: any[];
  tickets: Map<string, Ticket>;
  submits: SubmitRecord[];
  requests: Array<{ method: string; path: string; body: any }>;
  attestations: any[];
  confirmBodies: any[];
  removalBodies: any[];
  publicKeys: Map<string, KeyObject>;
  /** force a status + error body on the next matching path */
  failNext: Map<string, { status: number; body: any }>;
  migrationPolls: number;
  signIn: { walletStatus?: any };
  signUpStatus: number;
  deployedChains: number[];
  /**
   * Send existing passkeys as excludeCredentials. The single virtual
   * authenticator holds every test credential, so a test that simulates
   * "register on another device" turns this off (a real second device
   * doesn't hold the excluded credential).
   */
  excludeExisting: boolean;
  /** challenges issued by /v1/wallet/passkeys/options (single-use) */
  optionsChallenges: string[];
  possessionChecks: PossessionCheck[];
}

export interface PossessionCheck {
  /** possession.client_data_json challenge == an unused options challenge */
  challengeOk: boolean;
  typeOk: boolean;
  /** possession.cred_id_b64 == attestation credential id (and authData's) */
  credIdOk: boolean;
  /** P-256 signature verifies against the COSE key in the attestationObject */
  signatureOk: boolean;
}

let counter = 0;
function hashFor(seed: string): string {
  return "0x" + createHash("sha256").update(`${seed}:${counter++}`).digest("hex");
}

export function statusFor(mode: "none" | "legacy" | "passkey", overrides: Record<string, unknown> = {}) {
  return {
    mode,
    walletAddress: mode === "none" ? null : WALLET,
    passkeyCount: mode === "passkey" ? 1 : 0,
    chains:
      mode === "legacy"
        ? [
            { chainId: 8453, deployed: true, ownerMode: "legacy_eoa" },
            { chainId: 137, deployed: true, ownerMode: "legacy_eoa" },
          ]
        : mode === "passkey"
          ? [{ chainId: 8453, deployed: true, ownerMode: "passkey" }]
          : [],
    needsPasskeySetup: mode !== "passkey",
    ...overrides,
  };
}

export function newState(partial: Partial<MockState> = {}): MockState {
  return {
    walletStatus: statusFor("passkey"),
    setupMode: "native",
    passkeys: [],
    approvals: [],
    wcRequests: [],
    tickets: new Map(),
    submits: [],
    requests: [],
    attestations: [],
    confirmBodies: [],
    removalBodies: [],
    publicKeys: new Map(),
    failNext: new Map(),
    migrationPolls: 0,
    signIn: {},
    signUpStatus: 201,
    deployedChains: [8453, 137],
    excludeExisting: true,
    optionsChallenges: [],
    possessionChecks: [],
    ...partial,
  };
}

const b64url = (hex: string) => Buffer.from(hex.replace(/^0x/, ""), "hex").toString("base64url");

/** DER-encoded ECDSA (authenticator output) → verify over authData || sha256(cdj). */
function verifyAssertion(pub: KeyObject, proof: any): boolean {
  const authData = Buffer.from(proof.authenticator_data_b64, "base64");
  const cdj = Buffer.from(proof.client_data_json_b64, "base64");
  const signed = Buffer.concat([authData, createHash("sha256").update(cdj).digest()]);
  return verify("sha256", signed, { key: pub, dsaEncoding: "der" }, Buffer.from(proof.signature_b64, "base64"));
}

function normCred(id: string): string {
  return Buffer.from(id.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("base64");
}

function checkProof(state: MockState, path: string, ticketId: string, authProof: any): SubmitRecord {
  const t = state.tickets.get(ticketId);
  const expectedHash = t?.hashToSign ?? "";
  let challengeOk = false;
  let typeOk = false;
  try {
    const cd = JSON.parse(Buffer.from(authProof.client_data_json_b64, "base64").toString("utf8"));
    challengeOk = !!expectedHash && cd.challenge === b64url(expectedHash);
    typeOk = cd.type === "webauthn.get";
  } catch {
    /* leave false */
  }
  const pub = authProof?.cred_id_b64 ? state.publicKeys.get(normCred(authProof.cred_id_b64)) : undefined;
  const rec: SubmitRecord = {
    path,
    ticketId,
    expectedHash,
    authProof,
    challengeOk,
    typeOk,
    signatureOk: pub ? verifyAssertion(pub, authProof) : null,
  };
  state.submits.push(rec);
  return rec;
}

// ─── registration: attestationObject (CBOR) + possession ──────────────

/** Minimal CBOR decoder — enough for attestationObject and COSE keys. */
export function cborDecode(buf: Buffer): any {
  let i = 0;
  const readLen = (info: number): number => {
    if (info < 24) return info;
    if (info === 24) return buf[i++];
    if (info === 25) { const v = buf.readUInt16BE(i); i += 2; return v; }
    if (info === 26) { const v = buf.readUInt32BE(i); i += 4; return v; }
    throw new Error("cbor: unsupported length");
  };
  const item = (): any => {
    const b = buf[i++];
    const major = b >> 5;
    const info = b & 0x1f;
    switch (major) {
      case 0: return readLen(info);
      case 1: return -1 - readLen(info);
      case 2: { const n = readLen(info); const v = buf.subarray(i, i + n); i += n; return Buffer.from(v); }
      case 3: { const n = readLen(info); const v = buf.toString("utf8", i, i + n); i += n; return v; }
      case 4: { const n = readLen(info); return Array.from({ length: n }, () => item()); }
      case 5: {
        const n = readLen(info);
        const m = new Map<any, any>();
        for (let k = 0; k < n; k++) { const key = item(); m.set(key, item()); }
        return m;
      }
      case 7: if (info === 20) return false; if (info === 21) return true; if (info === 22) return null;
      // falls through
      default: throw new Error(`cbor: unsupported major ${major}`);
    }
  };
  return item();
}

/** attestationObject → { credentialId, publicKey } from authData's attested credential data. */
export function parseAttestationObject(b64: string): { credentialId: Buffer; publicKey: KeyObject; alg: number } {
  const att = cborDecode(Buffer.from(b64, "base64")) as Map<string, any>;
  const authData: Buffer = att.get("authData");
  let o = 32 + 1 + 4; // rpIdHash, flags, signCount
  if (!(authData[32] & 0x40)) throw new Error("no attested credential data");
  o += 16; // aaguid
  const len = authData.readUInt16BE(o);
  o += 2;
  const credentialId = authData.subarray(o, o + len);
  o += len;
  const cose = cborDecode(authData.subarray(o)) as Map<number, any>;
  if (cose.get(1) !== 2 || cose.get(-1) !== 1) throw new Error("not an EC2 P-256 COSE key");
  const publicKey = createPublicKey({
    key: { kty: "EC", crv: "P-256", x: cose.get(-2).toString("base64url"), y: cose.get(-3).toString("base64url") },
    format: "jwk",
  });
  return { credentialId: Buffer.from(credentialId), publicKey, alg: cose.get(3) };
}

function checkPossession(state: MockState, attestation: any, possession: any): PossessionCheck {
  let challengeOk = false;
  let typeOk = false;
  let credIdOk = false;
  let signatureOk = false;
  try {
    const cd = JSON.parse(Buffer.from(possession.client_data_json_b64, "base64").toString("utf8"));
    const idx = state.optionsChallenges.indexOf(cd.challenge);
    challengeOk = idx >= 0;
    if (challengeOk) state.optionsChallenges.splice(idx, 1); // single use
    typeOk = cd.type === "webauthn.get";
    const parsed = parseAttestationObject(attestation.attestation_object_b64);
    credIdOk =
      normCred(possession.cred_id_b64) === normCred(attestation.cred_id_b64) &&
      parsed.credentialId.toString("base64") === normCred(attestation.cred_id_b64);
    signatureOk = parsed.alg === -7 && verifyAssertion(parsed.publicKey, possession);
    // Later signatures by this credential are verified with the same key.
    if (signatureOk) state.publicKeys.set(normCred(attestation.cred_id_b64), parsed.publicKey);
  } catch {
    /* leave false */
  }
  return { challengeOk, typeOk, credIdOk, signatureOk };
}

function issue(state: MockState, purpose: string, chainId = 8453): Ticket {
  const t: Ticket = { ticketId: `tk_${purpose}_${counter}`, hashToSign: hashFor(purpose), chainId, purpose };
  state.tickets.set(t.ticketId, t);
  return t;
}

function allowCreds(state: MockState): string[] {
  return state.passkeys.filter((p) => p.status === "active").map((p) => p.credentialId);
}

function previewBody(state: MockState, purpose: string, extra: Record<string, unknown> = {}) {
  const t = issue(state, purpose);
  return {
    success: true,
    ticketId: t.ticketId,
    hashToSign: t.hashToSign,
    userOpHashHex: t.hashToSign,
    chainId: t.chainId,
    allowCredentials: allowCreds(state),
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    summary: { purpose },
    ...extra,
  };
}

/** Install the mock on `page`. Returns the mutable state for assertions. */
export async function installPasskeyBackend(page: Page, state: MockState): Promise<MockState> {
  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    });

  const handler = async (route: Route) => {
    const req = route.request();
    const method = req.method();
    if (method === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        },
      });
    }
    const url = new URL(req.url());
    const path = url.pathname;
    let body: any = {};
    try {
      body = JSON.parse(req.postData() || "{}");
    } catch {
      body = {};
    }
    state.requests.push({ method, path, body });

    for (const [k, v] of state.failNext) {
      if (path.endsWith(k)) {
        state.failNext.delete(k);
        return json(route, v.status, v.body);
      }
    }

    // ── auth ────────────────────────────────────────────────────────
    if (path.endsWith("/v1/one-time-codes")) return json(route, 200, { success: true });
    if (path.endsWith("/v1/auth/sign-up")) {
      return state.signUpStatus === 409
        ? json(route, 409, { message: "User already exists" })
        : json(route, 201, { userId: "user-1", message: "created" });
    }
    if (path.endsWith("/v1/auth/sign-in")) {
      return json(route, 200, {
        accessToken: "test-access-token",
        address: state.walletStatus?.walletAddress ?? "",
        walletStatus: state.signIn.walletStatus ?? state.walletStatus,
      });
    }

    // ── wallet status & passkeys (spec §2c) ─────────────────────────
    if (path.endsWith("/v1/wallet/status")) {
      if (state.setupMode === "legacy" && state.walletStatus?.mode === "passkey") {
        // Migration on Base lands after the first poll.
        state.migrationPolls++;
        if (state.migrationPolls >= 1) {
          state.walletStatus.chains = state.walletStatus.chains.map((c: any) => ({ ...c, ownerMode: "passkey" }));
        }
      }
      return json(route, 200, state.walletStatus);
    }
    if (path.endsWith("/v1/wallet/passkeys/options")) {
      const challenge = Buffer.from(createHash("sha256").update(`opt${counter++}`).digest()).toString("base64url");
      state.optionsChallenges.push(challenge);
      return json(route, 200, {
        challenge,
        rp: { id: "localhost", name: "Rift Test" },
        user: { id: Buffer.from("user-1").toString("base64url"), name: "tester@example.com" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        excludeCredentials: state.excludeExisting
          ? state.passkeys.map((p) => ({ type: "public-key", id: p.credentialId }))
          : [],
      });
    }
    if (path.endsWith("/v1/wallet/passkeys/confirm")) {
      state.confirmBodies.push(body);
      for (const s of body.signatures ?? []) checkProof(state, path, s.ticketId, s.authProof);
      const pk = state.passkeys.find((p) => normCred(p.credentialId) === normCred(body.credentialId ?? ""));
      if (pk) pk.status = "active";
      return json(route, 200, { status: "active" });
    }
    const removal = path.match(/\/v1\/wallet\/passkeys\/([^/]+)\/confirm-removal$/);
    if (removal) {
      state.removalBodies.push(body);
      for (const s of body.signatures ?? []) checkProof(state, path, s.ticketId, s.authProof);
      state.passkeys = state.passkeys.filter((p) => p.id !== removal[1]);
      return json(route, 200, { status: "removed" });
    }
    const del = path.match(/\/v1\/wallet\/passkeys\/([^/]+)$/);
    if (del && method === "DELETE") {
      if (state.passkeys.filter((p) => p.status === "active").length <= 1) {
        return json(route, 409, { error: "LAST_PASSKEY" });
      }
      const tickets = state.deployedChains.map((c) => {
        const t = issue(state, `remove_${c}`, c);
        return { chainId: c, ticketId: t.ticketId, hashToSign: t.hashToSign };
      });
      return json(route, 200, { tickets });
    }
    if (path.endsWith("/v1/wallet/passkeys") && method === "GET") {
      return json(route, 200, state.passkeys);
    }
    if (path.endsWith("/v1/wallet/passkeys") && method === "POST") {
      state.attestations.push(body);
      if (!body.possession) return json(route, 400, { error: "PASSKEY_POSSESSION_REQUIRED" });
      const check = checkPossession(state, body.attestation, body.possession);
      state.possessionChecks.push(check);
      if (!check.challengeOk || !check.typeOk || !check.credIdOk || !check.signatureOk) {
        return json(route, 400, { error: "INVALID_PASSKEY_SIGNATURE" });
      }
      const credId = body.attestation?.cred_id_b64 as string;
      const alreadyActive = state.walletStatus?.mode === "passkey" && state.passkeys.length > 0;
      const row: PasskeyRow = {
        id: `pk_${state.passkeys.length + 1}`,
        credentialId: credId,
        label: body.label ?? "Passkey",
        signerAddress: "0x" + "3".repeat(40),
        signerKind: state.passkeys.length ? "proxy" : "shared",
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        status: alreadyActive ? "pending" : "active",
      };
      state.passkeys.push(row);
      if (alreadyActive) {
        const tickets = state.deployedChains.map((c) => {
          const t = issue(state, `add_${c}`, c);
          return { chainId: c, ticketId: t.ticketId, hashToSign: t.hashToSign };
        });
        return json(route, 200, { status: "pending_signature", tickets });
      }
      if (state.setupMode === "legacy") {
        state.walletStatus = statusFor("passkey", {
          passkeyCount: 1,
          chains: [
            { chainId: 8453, deployed: true, ownerMode: "legacy_eoa" },
            { chainId: 137, deployed: true, ownerMode: "passkey" },
          ],
        });
        return json(route, 200, {
          walletAddress: WALLET,
          status: "migrating",
          chains: [
            { chainId: 8453, status: "migrating" },
            { chainId: 137, status: "migrated", txHash: "0xmig137" },
          ],
        });
      }
      if (state.setupMode === "unrecoverable") {
        state.walletStatus = statusFor("passkey", { walletAddress: NEW_WALLET, previousAddress: WALLET });
        return json(route, 200, { walletAddress: NEW_WALLET, previousAddress: WALLET, status: "new_wallet" });
      }
      state.walletStatus = statusFor("passkey");
      return json(route, 200, { walletAddress: WALLET, status: "active" });
    }

    // ── two-phase previews / submits (spec §2b) ─────────────────────
    if (path.endsWith("/v1/transactions/preview")) return json(route, 200, previewBody(state, "spend"));
    if (path.endsWith("/v1/wallet/user-operations/preview")) return json(route, 200, previewBody(state, "userop"));
    if (path.endsWith("/v1/bridge/transfers/preview")) {
      return json(route, 200, previewBody(state, "bridge", { bridge: { outputAmount: "9.9", fee: "0.1" } }));
    }
    if (path.endsWith("/v1/wallet/user-operations/submit-prepared")) {
      checkProof(state, path, body.ticketId, body.authProof);
      return json(route, 200, { userOpHash: "0xuserop", transactionHash: "0xtxhash", status: "success" });
    }
    if (path.endsWith("/v1/offramps/init")) {
      const p = previewBody(state, "offramp");
      return json(route, 200, {
        success: true,
        data: { ...p, orderId: "ord_1", provider: "pretium", fiatAmount: 1290, exchangeRate: 129 },
      });
    }
    if (path.endsWith("/v1/offramps/finalize")) {
      checkProof(state, path, body.ticketId, body.authProof);
      return json(route, 200, {
        success: true,
        data: { orderId: body.orderId, txHash: "0xofframp", transactionCode: "TX123", status: "processing", fiatAmount: 1290, currency: "KES" },
      });
    }

    // ── WalletConnect ────────────────────────────────────────────────
    if (path.endsWith("/walletconnect/sessions")) return json(route, 200, { data: { sessions: [] } });
    if (path.endsWith("/walletconnect/requests")) {
      return json(route, 200, { data: { requests: state.wcRequests } });
    }
    const wcPreview = path.match(/\/walletconnect\/requests\/(\d+)\/preview$/);
    if (wcPreview) {
      const r = state.wcRequests.find((x) => String(x.id) === wcPreview[1]);
      const t = issue(state, `wc_${r?.method}`);
      return json(route, 200, {
        success: true,
        data: { method: r?.method, hash_to_sign: t.hashToSign, ticket_id: t.ticketId, requires_auth_proof: true, chain_id: 8453 },
      });
    }
    const wcApprove = path.match(/\/walletconnect\/requests\/(\d+)\/approve$/);
    if (wcApprove) {
      checkProof(state, path, body.ticketId, body.authProof);
      const r = state.wcRequests.find((x) => String(x.id) === wcApprove[1]);
      state.wcRequests = state.wcRequests.filter((x) => String(x.id) !== wcApprove[1]);
      return json(route, 200, {
        success: true,
        data: { result: r?.method === "personal_sign" ? "0x" + "5".repeat(130) : "0xwctxhash00" },
      });
    }

    // ── approvals (spec §2d) ─────────────────────────────────────────
    if (path.endsWith("/v1/approvals") && method === "GET") {
      const status = url.searchParams.get("status");
      return json(route, 200, state.approvals.filter((a) => !status || a.status === status));
    }
    const ap = path.match(/\/v1\/approvals\/([^/]+)(?:\/(preview|approve|reject))?$/);
    if (ap) {
      const a = state.approvals.find((x) => x.id === ap[1]);
      if (!a) return json(route, 404, { error: "NOT_FOUND" });
      if (!ap[2]) return json(route, 200, a);
      if (ap[2] === "preview") return json(route, 200, previewBody(state, `approval_${a.id}`, { summary: a.summary }));
      if (ap[2] === "approve") {
        const rec = checkProof(state, path, body.ticketId, body.authProof);
        if (!rec.challengeOk) return json(route, 400, { error: "INVALID_PASSKEY_SIGNATURE" });
        a.status = "approved";
        a.result = { transactionHash: "0xapprovedtx", userOpHash: "0xapproveduo" };
        return json(route, 200, { id: a.id, status: "approved", result: a.result });
      }
      a.status = "rejected";
      return json(route, 200, { id: a.id, status: "rejected" });
    }

    // ── misc app data ────────────────────────────────────────────────
    // Balances: 100 USDC on Base so the console's send form can proceed.
    if (path.endsWith("/v1/balances/tokens")) {
      const amount = url.searchParams.get("token") === "USDC" && url.searchParams.get("chain") === "BASE" ? 100 : 0;
      return json(route, 200, { data: [{ amount, token: url.searchParams.get("token"), chain: url.searchParams.get("chain") }] });
    }
    if (/preview_exchange_rate|preview-exchange-rate|\/v1\/rates\/quote$/.test(path)) {
      return json(route, 200, { rate: 129, buying_rate: 129, selling_rate: 130, feeBps: 100, feePercentage: 1 });
    }
    if (path.endsWith("/v1/transactions/fee-estimate")) {
      return json(route, 200, { gasFeeInToken: "0.01", sendAmount: String(body.amount ?? url.searchParams.get("amount") ?? "0"), totalNeeded: "5.01", tokenBalance: "100", sufficient: true, deficit: "0", token: "USDC", chain: "BASE" });
    }
    if (/\/user(\/|$)|\/me$|getUser/.test(path)) {
      return json(route, 200, {
        user: {
          id: "user-1",
          email: "tester@example.com",
          notificationEmail: "tester@example.com",
          externalId: null,
          phoneNumber: null,
          address: "0x000000000000000000000000000000000000bEEF",
          paymentAccount: JSON.stringify({ institution: "Safaricom", accountIdentifier: "0700000000", accountName: "Test User", currency: "KES", type: "MOBILE" }),
        },
      });
    }
    return json(route, 200, { data: [], orders: [], balances: [], breakdown: [] });
  };

  for (const o of ORIGINS) await page.route(o, handler);
  await page.route("**/api/**", handler);
  await page.route("https://accounts.google.com/**", (r) => r.abort());
  await page.route("https://appleid.cdn-apple.com/**", (r) => r.abort());
  await page.route("https://*.posthog.com/**", (r) => r.fulfill({ status: 200, body: "{}" }));
  return state;
}

/** Seed the app's session so the authenticated shell mounts. */
export async function seedSession(page: Page, opts: { address?: string } = {}) {
  await page.addInitScript((address) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.setItem("token", "test-access-token");
    localStorage.setItem("address", address);
    localStorage.setItem("recovery_warning_dismissed", String(Date.now()));
    localStorage.setItem("demo_completed", "true");
    localStorage.setItem("selected_currency", "USD");
  }, opts.address ?? WALLET);
}

// ─── virtual authenticator ───────────────────────────────────────────

export interface VirtualAuth {
  client: CDPSession;
  authenticatorId: string;
}

export async function attachVirtualAuthenticator(page: Page): Promise<VirtualAuth> {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  const { authenticatorId } = await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return { client, authenticatorId };
}

/**
 * Put a passkey with a KNOWN private key into the virtual authenticator
 * and register it as an active passkey on the mocked wallet, so tests
 * can verify the P-256 signature like the backend does.
 */
export async function seedCredential(
  auth: VirtualAuth,
  state: MockState,
  label = "MacBook"
): Promise<PasskeyRow> {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const credBytes = createHash("sha256").update(`cred${counter++}`).digest().subarray(0, 16);
  const credentialId = credBytes.toString("base64");
  await auth.client.send("WebAuthn.addCredential", {
    authenticatorId: auth.authenticatorId,
    credential: {
      credentialId,
      isResidentCredential: true,
      rpId: "localhost",
      privateKey: privateKey.export({ format: "der", type: "pkcs8" }).toString("base64"),
      // Distinct handle per credential: a resident key with the same
      // (rpId, user.id) would replace the seeded one in the authenticator.
      userHandle: Buffer.from(`seed-${counter}`).toString("base64"),
      signCount: 0,
    },
  });
  state.publicKeys.set(credentialId, createPublicKey(publicKey.export({ format: "pem", type: "spki" })));
  const row: PasskeyRow = {
    id: `pk_seed_${state.passkeys.length + 1}`,
    credentialId,
    label,
    signerAddress: "0x" + "4".repeat(40),
    signerKind: state.passkeys.length ? "proxy" : "shared",
    createdAt: "2026-11-01T10:00:00.000Z",
    lastUsedAt: null,
    status: "active",
  };
  state.passkeys.push(row);
  return row;
}

/** Decode a base64 clientDataJSON in Node. */
export function clientData(b64: string): { type: string; challenge: string; origin: string } {
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

export function expectedChallenge(hashHex: string): string {
  return b64url(hashHex);
}
