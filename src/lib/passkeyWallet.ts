/**
 * Passkey & wallet endpoints (spec §2c) and approval requests (§2d).
 *
 *   GET    /v1/wallet/status
 *   POST   /v1/wallet/passkeys/options        → registration options
 *   POST   /v1/wallet/passkeys                → setup / migrate / add
 *   POST   /v1/wallet/passkeys/confirm        → add: existing-passkey sigs
 *   GET    /v1/wallet/passkeys
 *   DELETE /v1/wallet/passkeys/:id            → removal tickets
 *   POST   /v1/wallet/passkeys/:id/confirm-removal
 *   GET    /v1/approvals?status=pending | /v1/approvals/:id
 *   POST   /v1/approvals/:id/preview | approve | reject
 */

import { enrolPasskey } from "./webauthn";
import { nonCustodialConfig, riftRequest, signTicket, requireTicket } from "./nonCustodial";
import {
  normaliseChainStatus,
  normaliseSubmit,
  normaliseTicket,
  parseWalletStatus,
  rpIdFitsHost,
  signerCredentialsFor,
  type ChainMigration,
  type NormalisedTicket,
  type WalletStatus,
} from "./passkeyUtils";
import { friendlyWebAuthnError } from "./passkeyUtils";

// ─── wallet status ───────────────────────────────────────────────────

let cachedStatus: WalletStatus | null = null;

/** Login responses carry `walletStatus`; stash it so the gate opens instantly. */
export function primeWalletStatus(raw: unknown): WalletStatus | null {
  const s = parseWalletStatus(raw);
  if (s) cachedStatus = s;
  return s;
}

export function getCachedWalletStatus(): WalletStatus | null {
  return cachedStatus;
}

export function clearWalletStatusCache(): void {
  cachedStatus = null;
}

export async function fetchWalletStatus(): Promise<WalletStatus | null> {
  if (!localStorage.getItem("token")) return null;
  try {
    const { data } = await riftRequest<unknown>("GET", "/v1/wallet/status");
    const s = parseWalletStatus(data);
    if (s) cachedStatus = s;
    return s;
  } catch {
    return cachedStatus;
  }
}

// ─── passkeys ────────────────────────────────────────────────────────

export interface PasskeyRecord {
  id: string;
  credentialId: string;
  label?: string | null;
  signerAddress?: string | null;
  signerKind?: "shared" | "proxy" | string;
  createdAt?: string;
  lastUsedAt?: string | null;
  status?: "pending" | "active" | "removed" | string;
}

export async function listPasskeys(): Promise<PasskeyRecord[]> {
  const { data } = await riftRequest<unknown>("GET", "/v1/wallet/passkeys");
  const d = data as any;
  const list = Array.isArray(d) ? d : d?.passkeys ?? d?.data ?? [];
  return (Array.isArray(list) ? list : []).filter(
    (p: PasskeyRecord) => p && typeof p.id === "string" && p.status !== "removed"
  );
}

interface RegistrationOptions {
  challenge: string;
  rp: { id?: string; name?: string };
  user: { id?: string; name?: string; displayName?: string };
  excludeCredentials?: Array<string | { id: string }>;
}

export type SetupResult =
  | { status: "active"; walletAddress: string }
  | { status: "migrated" | "migrating"; walletAddress: string; chains: ChainMigration[] }
  | { status: "new_wallet"; walletAddress: string; previousAddress?: string }
  | { status: "pending_signature"; tickets: NormalisedTicket[]; credIdB64: string };

/** options → navigator.credentials.create → POST /v1/wallet/passkeys */
async function registerPasskey(label?: string): Promise<{ raw: any; credIdB64: string }> {
  const { data: options } = await riftRequest<RegistrationOptions>(
    "POST",
    "/v1/wallet/passkeys/options",
    {}
  );
  if (!options?.challenge) throw new Error("Passkey options returned no challenge");
  const cfg = nonCustodialConfig();
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  // Prefer the server's rp.id when the browser will accept it here.
  const rpId = options.rp?.id && rpIdFitsHost(host, options.rp.id) ? options.rp.id : cfg.passkeyRpId;
  const userName =
    options.user?.name ||
    localStorage.getItem("email") ||
    localStorage.getItem("phoneNumber") ||
    "Rift wallet";
  let enrolled;
  try {
    enrolled = await enrolPasskey({
      rpId,
      rpName: options.rp?.name || cfg.passkeyRpName,
      userName,
      userDisplayName: options.user?.displayName,
      userId: options.user?.id,
      challenge: options.challenge,
      excludeCredIds: (options.excludeCredentials ?? [])
        .map((c) => (typeof c === "string" ? c : c?.id))
        .filter((c): c is string => !!c),
    });
  } catch (e) {
    throw new Error(friendlyWebAuthnError(e));
  }
  const { data } = await riftRequest<any>("POST", "/v1/wallet/passkeys", {
    attestation: enrolled.attestation,
    ...(label ? { label } : {}),
  });
  return { raw: data?.data && !data.status ? data.data : data, credIdB64: enrolled.credIdB64 };
}

function defaultLabel(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad/.test(ua)) return "iPhone / iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "This device";
}

/**
 * First passkey (new wallet, legacy migration, unrecoverable legacy) or an
 * additional one when the wallet is already passkey-owned.
 */
export async function setupPasskey(label = defaultLabel()): Promise<SetupResult> {
  const { raw, credIdB64 } = await registerPasskey(label);
  const status = String(raw?.status ?? "");
  if (status === "pending_signature") {
    const tickets = (Array.isArray(raw.tickets) ? raw.tickets : [])
      .map(normaliseTicket)
      .filter((t: NormalisedTicket | null): t is NormalisedTicket => !!t);
    return { status: "pending_signature", tickets, credIdB64 };
  }
  if (status === "migrated" || status === "migrating") {
    const chains: ChainMigration[] = (Array.isArray(raw.chains) ? raw.chains : []).map((c: any) => ({
      chainId: Number(c.chainId),
      status: normaliseChainStatus(c.status),
      ...(c.txHash ? { txHash: c.txHash } : {}),
      ...(c.error ? { error: c.error } : {}),
    }));
    if (raw.walletAddress) localStorage.setItem("address", raw.walletAddress);
    return { status, walletAddress: raw.walletAddress, chains };
  }
  if (status === "new_wallet") {
    if (raw.walletAddress) localStorage.setItem("address", raw.walletAddress);
    return { status, walletAddress: raw.walletAddress, previousAddress: raw.previousAddress };
  }
  if (raw?.walletAddress) localStorage.setItem("address", raw.walletAddress);
  return { status: "active", walletAddress: raw?.walletAddress ?? "" };
}

/**
 * Add another passkey to an active wallet: register the new credential,
 * then approve the add-owner op on every deployed chain with an EXISTING
 * passkey. The credential becomes active only after all chains confirm.
 */
export async function addPasskey(opts: {
  label?: string;
  existing: PasskeyRecord[];
  onStep?: (step: "register" | "approve" | "confirm", detail?: { index: number; total: number }) => void;
}): Promise<{ credentialId: string }> {
  opts.onStep?.("register");
  const res = await setupPasskey(opts.label || defaultLabel());
  if (res.status !== "pending_signature") {
    // Backend activated it directly (e.g. nothing deployed yet).
    return { credentialId: "" };
  }
  const signatures = [];
  for (let i = 0; i < res.tickets.length; i++) {
    const t = res.tickets[i];
    opts.onStep?.("approve", { index: i, total: res.tickets.length });
    const authProof = await signTicket({
      hashToSign: t.hashToSign,
      allowCredentials: signerCredentialsFor(opts.existing, res.credIdB64, t.allowCredentials),
    });
    signatures.push({ ticketId: t.ticketId, authProof });
  }
  opts.onStep?.("confirm");
  await riftRequest("POST", "/v1/wallet/passkeys/confirm", {
    credentialId: res.credIdB64,
    signatures,
  });
  return { credentialId: res.credIdB64 };
}

/** Remove a passkey: removal tickets signed by a remaining passkey. */
export async function removePasskey(target: PasskeyRecord, all: PasskeyRecord[]): Promise<void> {
  const active = all.filter((p) => !p.status || p.status === "active");
  if (active.length <= 1) {
    throw new Error("You can't remove your only passkey. Add another passkey first.");
  }
  const { data } = await riftRequest<any>("DELETE", `/v1/wallet/passkeys/${encodeURIComponent(target.id)}`);
  const raw = data?.data && !data.tickets ? data.data : data;
  const tickets: NormalisedTicket[] = (Array.isArray(raw?.tickets) ? raw.tickets : [])
    .map(normaliseTicket)
    .filter((t: NormalisedTicket | null): t is NormalisedTicket => !!t);
  const signatures = [];
  for (const t of tickets) {
    const authProof = await signTicket({
      hashToSign: t.hashToSign,
      allowCredentials: signerCredentialsFor(all, target.credentialId, t.allowCredentials),
    });
    signatures.push({ ticketId: t.ticketId, authProof });
  }
  await riftRequest("POST", `/v1/wallet/passkeys/${encodeURIComponent(target.id)}/confirm-removal`, {
    signatures,
  });
}

// ─── approvals ───────────────────────────────────────────────────────

export interface Approval {
  id: string;
  status: "pending" | "approved" | "rejected" | "expired" | "failed" | string;
  summary?: Record<string, unknown> | null;
  chainId?: number | null;
  createdAt?: string;
  expiresAt?: string;
  result?: { transactionHash?: string; userOpHash?: string } | null;
}

function unwrap<T>(data: any, key: string): T {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (data[key] !== undefined) return data[key] as T;
    if (data.data !== undefined && !data.id) return data.data as T;
  }
  return data as T;
}

export async function getApproval(id: string): Promise<Approval> {
  const { data } = await riftRequest<any>("GET", `/v1/approvals/${encodeURIComponent(id)}`);
  return unwrap<Approval>(data, "approval");
}

export async function listPendingApprovals(): Promise<Approval[]> {
  if (!localStorage.getItem("token")) return [];
  const { data } = await riftRequest<any>("GET", "/v1/approvals?status=pending");
  const list = Array.isArray(data) ? data : data?.approvals ?? data?.data ?? [];
  return (Array.isArray(list) ? list : []).filter(
    (a: Approval) => a && typeof a.id === "string" && a.status === "pending"
  );
}

/** preview → passkey → approve. Fresh ticket built server-side from the stored intent. */
export async function approveApproval(
  id: string,
  hooks: { onPromptStart?: () => void; onPromptDone?: () => void } = {}
): Promise<{ transactionHash?: string; userOpHash?: string; hash: string }> {
  const enc = encodeURIComponent(id);
  const { data: preview } = await riftRequest<unknown>("POST", `/v1/approvals/${enc}/preview`, {});
  const ticket = requireTicket(preview, "Approval");
  const authProof = await signTicket(ticket, hooks);
  const { data } = await riftRequest<any>("POST", `/v1/approvals/${enc}/approve`, {
    ticketId: ticket.ticketId,
    authProof,
  });
  const result = data?.result ?? data;
  return normaliseSubmit(result);
}

export async function rejectApproval(id: string): Promise<void> {
  await riftRequest("POST", `/v1/approvals/${encodeURIComponent(id)}/reject`, {});
}
