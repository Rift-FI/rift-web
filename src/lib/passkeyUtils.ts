/**
 * Pure helpers for passkey-owned wallets (spec "Rift passkey-owned
 * wallets" §2). No DOM, no `import.meta.env`, no fetch — everything here
 * runs unchanged in Node so tests/passkey-utils.spec.ts can exercise it
 * without a browser.
 */

// ─── byte encodings ──────────────────────────────────────────────────

export function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function bytesToB64url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Accepts both standard base64 and base64url, padded or not. */
export function b64ToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm + "=".repeat((4 - (norm.length % 4)) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("odd-length hex");
  if (!/^[0-9a-fA-F]*$/.test(h)) throw new Error("invalid hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = "0x";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

/**
 * The hash a passkey signs MUST be exactly 32 bytes (SafeOp EIP-712 hash
 * or SafeMessage hash). Refuse anything else before prompting the user —
 * a short / long challenge would produce a signature the Safe rejects.
 */
export function hashToChallenge(hashHex: string): Uint8Array {
  const bytes = hexToBytes(hashHex);
  if (bytes.length !== 32) {
    throw new Error(`hashToSign must be 32 bytes, got ${bytes.length}`);
  }
  return bytes;
}

// ─── clientDataJSON ──────────────────────────────────────────────────

export interface ClientData {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
}

export function decodeClientDataJSON(clientDataJsonB64: string): ClientData {
  const bytes = b64ToBytes(clientDataJsonB64);
  return JSON.parse(new TextDecoder().decode(bytes)) as ClientData;
}

/** True when an assertion's clientDataJSON.challenge is `hashHex`. */
export function challengeMatchesHash(clientDataJsonB64: string, hashHex: string): boolean {
  try {
    const cd = decodeClientDataJSON(clientDataJsonB64);
    return cd.challenge === bytesToB64url(hexToBytes(hashHex));
  } catch {
    return false;
  }
}

// ─── preview / ticket normalisation (spec §2b) ───────────────────────

export interface NormalisedTicket {
  ticketId: string;
  hashToSign: string;
  chainId?: number;
  allowCredentials: string[];
  expiresAt?: string | number;
  summary?: unknown;
}

type Bag = Record<string, unknown>;
const asBag = (v: unknown): Bag =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Bag) : {};
const firstString = (...vals: unknown[]): string | undefined => {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return undefined;
};

/**
 * Previews come in three historical spellings — `hashToSign` (new
 * contract), `userOpHashHex` (v3 previews), `hash_to_sign` (WalletConnect)
 * — and are sometimes nested under `data`. Read whichever is present.
 * Returns null when there is no ticket or no hash.
 */
export function normaliseTicket(raw: unknown): NormalisedTicket | null {
  const top = asBag(raw);
  const data = asBag(top.data);
  const src = Object.keys(data).length && !top.ticketId && !top.hashToSign ? { ...top, ...data } : top;
  const ticketId = firstString(src.ticketId, src.ticket_id);
  const hashToSign = firstString(src.hashToSign, src.userOpHashHex, src.hash_to_sign);
  if (!ticketId || !hashToSign) return null;
  const chainRaw = src.chainId ?? src.chain_id;
  const allow = Array.isArray(src.allowCredentials) ? src.allowCredentials : [];
  return {
    ticketId,
    hashToSign,
    ...(typeof chainRaw === "number" ? { chainId: chainRaw } : {}),
    allowCredentials: allow
      .map((c) => (typeof c === "string" ? c : firstString(asBag(c).id, asBag(c).cred_id_b64)))
      .filter((c): c is string => !!c),
    ...(src.expiresAt !== undefined ? { expiresAt: src.expiresAt as string | number } : {}),
    ...(src.summary !== undefined ? { summary: src.summary } : {}),
  };
}

/**
 * Submit responses: new contract `{ userOpHash, transactionHash, status }`,
 * older `{ success, hash, userOperationHash }`. The tx hash shown to users
 * prefers the on-chain transaction hash.
 */
export function normaliseSubmit(raw: unknown): {
  hash: string;
  transactionHash?: string;
  userOpHash?: string;
  status?: string;
} {
  const top = asBag(raw);
  const src = top.data && !top.transactionHash && !top.hash ? { ...top, ...asBag(top.data) } : top;
  const transactionHash = firstString(src.transactionHash, src.txHash);
  const userOpHash = firstString(src.userOpHash, src.userOperationHash);
  const hash = transactionHash || firstString(src.hash) || userOpHash || "";
  return {
    hash,
    ...(transactionHash ? { transactionHash } : {}),
    ...(userOpHash ? { userOpHash } : {}),
    ...(typeof src.status === "string" ? { status: src.status } : {}),
  };
}

// ─── backend error codes (spec §2b-2d) ───────────────────────────────

export type PasskeyErrorCode =
  | "PASSKEY_SETUP_REQUIRED"
  | "PASSKEY_REQUIRED"
  | "INVALID_PASSKEY_SIGNATURE"
  | "LAST_PASSKEY"
  | "PASSKEY_UNSUPPORTED_ON_CHAIN"
  | "MIGRATION_NEEDS_GAS"
  | "APPROVAL_REQUIRED"
  | "REPLACED_BY_PASSKEY_WALLETS"
  | "EOA_SIGNING_REMOVED";

const KNOWN_CODES: PasskeyErrorCode[] = [
  "PASSKEY_SETUP_REQUIRED",
  "PASSKEY_REQUIRED",
  "INVALID_PASSKEY_SIGNATURE",
  "LAST_PASSKEY",
  "PASSKEY_UNSUPPORTED_ON_CHAIN",
  "MIGRATION_NEEDS_GAS",
  "APPROVAL_REQUIRED",
  "REPLACED_BY_PASSKEY_WALLETS",
  "EOA_SIGNING_REMOVED",
];

/** Pull a known passkey error code out of a response body. */
export function passkeyErrorCode(body: unknown): PasskeyErrorCode | undefined {
  const b = asBag(body);
  for (const v of [b.error, b.code, b.status, asBag(b.data).error]) {
    if (typeof v === "string" && (KNOWN_CODES as string[]).includes(v)) {
      return v as PasskeyErrorCode;
    }
  }
  return undefined;
}

export function friendlyPasskeyError(code: PasskeyErrorCode | undefined): string | undefined {
  switch (code) {
    case "PASSKEY_SETUP_REQUIRED":
      return "Secure your wallet with a passkey before making transactions.";
    case "PASSKEY_REQUIRED":
      return "This action must be approved with a passkey.";
    case "INVALID_PASSKEY_SIGNATURE":
      return "That passkey couldn't approve this request. Try again with a passkey registered to this wallet.";
    case "LAST_PASSKEY":
      return "You can't remove your only passkey. Add another passkey first.";
    case "PASSKEY_UNSUPPORTED_ON_CHAIN":
      return "Passkeys aren't available on this network yet.";
    case "MIGRATION_NEEDS_GAS":
      return "This network needs a little gas before your wallet can be upgraded.";
    case "APPROVAL_REQUIRED":
      return "This request is waiting for your approval.";
    case "REPLACED_BY_PASSKEY_WALLETS":
      return "This feature was replaced by passkeys. Update the app and try again.";
    case "EOA_SIGNING_REMOVED":
      return "Raw transaction signing is no longer supported.";
    default:
      return undefined;
  }
}

/** Map a WebAuthn DOMException / Error to user copy. */
export function friendlyWebAuthnError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? "";
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  if (name === "NotAllowedError" || /NotAllowed|timed out|not allowed/i.test(msg)) {
    return "Passkey prompt was cancelled or timed out.";
  }
  if (name === "InvalidStateError" || /InvalidState|already registered/i.test(msg)) {
    return "This passkey is already registered to your wallet.";
  }
  if (name === "NotSupportedError" || /not supported/i.test(msg)) {
    return "This device or browser doesn't support passkeys.";
  }
  if (name === "SecurityError") {
    return "Passkeys aren't allowed on this domain.";
  }
  return msg || "Passkey request failed.";
}

// ─── RP id ───────────────────────────────────────────────────────────

/**
 * The WebAuthn RP id must be the current host or a registrable suffix
 * of it. Use the configured id when it fits the host (app.riftfi.com →
 * "riftfi.com"), else the host itself (localhost, preview deploys).
 */
export function resolveRpId(hostname: string, configured?: string): string {
  const host = (hostname || "localhost").toLowerCase();
  const cfg = (configured || "").toLowerCase().trim();
  if (cfg && (host === cfg || host.endsWith("." + cfg))) return cfg;
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return host;
  return cfg ? host : host.split(".").slice(-2).join(".");
}

export function rpIdFitsHost(hostname: string, rpId: string): boolean {
  const host = (hostname || "").toLowerCase();
  const id = (rpId || "").toLowerCase();
  return !!id && (host === id || host.endsWith("." + id));
}

// ─── wallet status (spec §2c) ────────────────────────────────────────

export type WalletMode = "none" | "legacy" | "passkey";
export type ChainOwnerMode = "legacy_eoa" | "passkey" | "undeployed";

export interface WalletChainStatus {
  chainId: number;
  deployed: boolean;
  ownerMode: ChainOwnerMode;
}

export interface WalletStatus {
  mode: WalletMode;
  walletAddress: string | null;
  previousAddress?: string | null;
  passkeyCount: number;
  chains: WalletChainStatus[];
  needsPasskeySetup: boolean;
}

/** Validate an unknown payload as WalletStatus; null when it isn't one. */
export function parseWalletStatus(raw: unknown): WalletStatus | null {
  const top = asBag(raw);
  const b = top.walletStatus ? asBag(top.walletStatus) : top.data && !top.mode ? asBag(top.data) : top;
  if (typeof b.needsPasskeySetup !== "boolean" && typeof b.mode !== "string") return null;
  const mode = (["none", "legacy", "passkey"] as const).includes(b.mode as WalletMode)
    ? (b.mode as WalletMode)
    : "none";
  const chains = Array.isArray(b.chains)
    ? b.chains
        .map(asBag)
        .filter((c) => typeof c.chainId === "number")
        .map((c) => ({
          chainId: c.chainId as number,
          deployed: c.deployed === true,
          ownerMode: (["legacy_eoa", "passkey", "undeployed"] as const).includes(
            c.ownerMode as ChainOwnerMode
          )
            ? (c.ownerMode as ChainOwnerMode)
            : "undeployed",
        }))
    : [];
  return {
    mode,
    walletAddress: typeof b.walletAddress === "string" ? b.walletAddress : null,
    previousAddress: typeof b.previousAddress === "string" ? b.previousAddress : null,
    passkeyCount: typeof b.passkeyCount === "number" ? b.passkeyCount : 0,
    chains,
    needsPasskeySetup: b.needsPasskeySetup === true,
  };
}

// ─── migration progress (spec §1c / §2c) ─────────────────────────────

export type ChainMigrationStatus = "pending" | "migrating" | "migrated" | "failed" | "skipped";

export interface ChainMigration {
  chainId: number;
  status: ChainMigrationStatus;
  txHash?: string;
  error?: string;
}

export function normaliseChainStatus(s: unknown): ChainMigrationStatus {
  const v = String(s ?? "").toLowerCase();
  if (["migrated", "done", "passkey", "success", "confirmed", "active"].includes(v)) return "migrated";
  if (["failed", "error", "migration_needs_gas"].includes(v)) return "failed";
  if (["skipped", "undeployed", "unsupported", "passkey_unsupported_on_chain"].includes(v)) return "skipped";
  if (["migrating", "submitted", "in_progress", "processing"].includes(v)) return "migrating";
  return "pending";
}

/** Merge a /wallet/status poll into the migration list returned at setup. */
export function mergeMigrationWithStatus(
  chains: ChainMigration[],
  status: WalletStatus | null
): ChainMigration[] {
  if (!status) return chains;
  return chains.map((c) => {
    if (c.status === "migrated" || c.status === "failed" || c.status === "skipped") return c;
    const s = status.chains.find((x) => x.chainId === c.chainId);
    if (s?.ownerMode === "passkey") return { ...c, status: "migrated" };
    return c;
  });
}

export function migrationProgress(chains: ChainMigration[]): {
  done: number;
  total: number;
  complete: boolean;
  failed: number;
} {
  const relevant = chains.filter((c) => c.status !== "skipped");
  const done = relevant.filter((c) => c.status === "migrated").length;
  const failed = relevant.filter((c) => c.status === "failed").length;
  return { done, total: relevant.length, failed, complete: done + failed === relevant.length };
}

export const CHAIN_LABELS: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  137: "Polygon",
  42220: "Celo",
  42161: "Arbitrum",
  43114: "Avalanche",
  56: "BNB Chain",
  80094: "Berachain",
  1135: "Lisk",
};

export function chainLabel(chainId: number | undefined | null): string {
  if (chainId === undefined || chainId === null) return "—";
  return CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
}

// ─── approvals (spec §2d) ────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "failed";

export function isApprovalActionable(status: string | undefined, expiresAt?: string | number, now = Date.now()): boolean {
  if (status !== "pending") return false;
  if (expiresAt === undefined || expiresAt === null || expiresAt === "") return true;
  const t = typeof expiresAt === "number" ? expiresAt : Date.parse(expiresAt);
  return !Number.isFinite(t) || t > now;
}

/**
 * Approval summaries are free-form JSON from the backend. Flatten the
 * common fields into label/value rows for the approval screen; unknown
 * primitive keys pass through humanised so nothing is hidden from the
 * user who is about to sign.
 */
export function summaryRows(summary: unknown): Array<{ label: string; value: string }> {
  const s = asBag(summary);
  const rows: Array<{ label: string; value: string }> = [];
  const used = new Set<string>(["title", "description"]);
  const take = (key: string, label: string, fmt?: (v: unknown) => string) => {
    const v = s[key];
    if (v === undefined || v === null || v === "") return;
    used.add(key);
    rows.push({ label, value: fmt ? fmt(v) : String(v) });
  };
  if (s.amount !== undefined && s.token !== undefined) {
    used.add("amount");
    used.add("token");
    rows.push({ label: "Amount", value: `${s.amount} ${s.token}` });
  } else {
    take("amount", "Amount");
    take("token", "Token");
  }
  take("recipient", "To");
  take("to", "To");
  take("chain", "Network");
  take("chainId", "Network", (v) => chainLabel(Number(v)));
  take("currency", "Currency");
  take("fiatAmount", "You receive");
  take("project", "Requested by");
  take("projectName", "Requested by");
  take("createdVia", "Requested via");
  for (const [k, v] of Object.entries(s)) {
    if (used.has(k)) continue;
    if (v === null || v === undefined || typeof v === "object") continue;
    rows.push({ label: humanise(k), value: String(v) });
  }
  return rows;
}

function humanise(key: string): string {
  const spaced = key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function summaryTitle(summary: unknown, fallback = "Approve request"): string {
  const s = asBag(summary);
  return firstString(s.title, s.description, s.opType, s.op_type) ?? fallback;
}

/**
 * Pick the credentials allowed to sign an add/remove ticket. Server
 * hints win; otherwise every active passkey except `excludeCredId` (the
 * one being added / removed); falling back to all active when that
 * leaves nothing.
 */
export function signerCredentialsFor(
  passkeys: Array<{ credentialId: string; status?: string }>,
  excludeCredId?: string,
  serverHint?: string[]
): string[] {
  if (serverHint && serverHint.length) return serverHint;
  const active = passkeys.filter((p) => !p.status || p.status === "active").map((p) => p.credentialId);
  const others = active.filter((id) => !sameCredId(id, excludeCredId));
  return others.length ? others : active;
}

/** Compare credential ids regardless of b64 / b64url spelling. */
export function sameCredId(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const n = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  return n(a) === n(b);
}
