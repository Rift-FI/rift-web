/**
 * Bound reseal challenge (enclave contract; see
 * rift-signer-enclave/README.md "Bound reseal challenge").
 *
 * When adding an auth method to an existing v3 wallet, the consent proof
 * from an already-enrolled method must be over
 *
 *   challenge = SHA-256( "rift-reseal-v1" || 0x00
 *                        || owner_address (20 raw bytes, EOA)
 *                        || server_nonce  (32 raw bytes = challengeHex)
 *                        || canonical(new_method) )
 *
 *   canonical OIDC    = 0x01 || u32be(len iss) || iss || u32be(len sub) || sub
 *   canonical Passkey = 0x02 || u32be(len cred_id) || cred_id || u32be(len cose) || cose
 *
 * cred_id / cose are the base64-DECODED bytes of cred_id_b64 /
 * cose_pubkey_b64 (standard, padded alphabet: what the enclave accepts).
 *
 * Passkey consent: WebAuthn `challenge` = the 32 raw bytes.
 * OIDC consent:    id_token `nonce`     = lowercase hex of the 32 bytes.
 *
 * Pure and dependency-free (Web Crypto only) so it runs in the browser
 * and in Node for tests (tests/bound-reseal.spec.ts holds the vectors).
 */

export type BoundResealMethod =
  | { kind: "oidc"; iss: string; sub: string }
  | { kind: "passkey"; cred_id_b64: string; cose_pubkey_b64: string };

const DOMAIN_TAG = "rift-reseal-v1";
const TAG_OIDC = 0x01;
const TAG_PASSKEY = 0x02;

export function hexToBytesExact(value: string, bytes: number, field: string): Uint8Array {
  const hex = value.startsWith("0x") || value.startsWith("0X") ? value.slice(2) : value;
  if (hex.length !== bytes * 2 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`${field} must be ${bytes} bytes of hex`);
  }
  const out = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

/** Strict standard-alphabet, padded base64 decode (matches the enclave). */
export function decodeStdBase64(value: string, field: string): Uint8Array {
  if (typeof value !== "string" || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error(`${field} must be standard padded base64`);
  }
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function u32be(n: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n, false);
  return out;
}

function lv(bytes: Uint8Array): Uint8Array {
  return concat([u32be(bytes.length), bytes]);
}

/** canonical(new_method) per the contract above. Extra fields (e.g. OIDC `email`) are ignored. */
export function canonicalMethodBytes(m: BoundResealMethod): Uint8Array {
  if (m.kind === "oidc") {
    if (!m.iss || !m.sub) throw new Error("OIDC method needs iss and sub");
    const enc = new TextEncoder();
    return concat([Uint8Array.of(TAG_OIDC), lv(enc.encode(m.iss)), lv(enc.encode(m.sub))]);
  }
  if (m.kind === "passkey") {
    const credId = decodeStdBase64(m.cred_id_b64, "cred_id_b64");
    if (credId.length === 0) throw new Error("cred_id_b64 cannot be empty");
    const cose = decodeStdBase64(m.cose_pubkey_b64, "cose_pubkey_b64");
    return concat([Uint8Array.of(TAG_PASSKEY), lv(credId), lv(cose)]);
  }
  throw new Error('method kind must be "oidc" or "passkey"');
}

/** The exact bytes that get hashed (exposed for tests / debugging). */
export function boundResealPreimage(
  ownerAddressHex: string,
  serverNonceHex: string,
  newMethod: BoundResealMethod
): Uint8Array {
  const owner = hexToBytesExact(ownerAddressHex, 20, "ownerAddress");
  const nonce = hexToBytesExact(serverNonceHex, 32, "serverNonce");
  return concat([
    new TextEncoder().encode(DOMAIN_TAG),
    Uint8Array.of(0x00),
    owner,
    nonce,
    canonicalMethodBytes(newMethod),
  ]);
}

/** The 32-byte bound challenge (use directly as the WebAuthn challenge). */
export async function computeBoundResealChallenge(
  ownerAddressHex: string,
  serverNonceHex: string,
  newMethod: BoundResealMethod
): Promise<Uint8Array> {
  const preimage = boundResealPreimage(ownerAddressHex, serverNonceHex, newMethod);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", preimage);
  return new Uint8Array(digest);
}

/** Lowercase hex of the bound challenge (use as the OIDC nonce). */
export async function computeBoundResealChallengeHex(
  ownerAddressHex: string,
  serverNonceHex: string,
  newMethod: BoundResealMethod
): Promise<string> {
  return bytesToHex(await computeBoundResealChallenge(ownerAddressHex, serverNonceHex, newMethod));
}
