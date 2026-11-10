/**
 * Device binding: every device gets its own non-extractable P-256 key
 * (WebCrypto, kept in IndexedDB, never synced). Money actions carry
 *   X-Rift-Device: <deviceId>.<unixSeconds>.<sigB64url>
 * signed over
 *   "rift-device-v1\n" + deviceId + "\n" + ts + "\n" + METHOD + "\n" + pathWithQuery + "\n" + hex(sha256(body))
 * so the server can tell this device from the user's other ones even though
 * passkeys sync between them.
 */
import { getApiBase } from "@/lib/apiBase";

export const DEVICE_HEADER = "X-Rift-Device";
export const DEVICE_NOT_TRUSTED_EVENT = "rift:device-not-trusted";
export const DEVICE_STATE_EVENT = "rift:device-state";
/** Copy used for a blocked money action; toasts with it are dropped. */
export const DEVICE_MESSAGE = "Approve this device to move money from it.";

export type DeviceStatus = "trusted" | "pending" | "cooling_off" | "revoked" | "unknown";

export interface DeviceState {
  id?: string;
  status?: DeviceStatus;
  coolingOffUntil?: string;
}

/* ── user scoping ─────────────────────────────────────────────────── */

function b64urlDecode(s: string) {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

/** Stable per-user key: the JWT subject, else the wallet address. */
export function deviceUserKey(): string {
  try {
    const token = localStorage.getItem("token") || "";
    const payload = JSON.parse(b64urlDecode(token.split(".")[1] || ""));
    const id = payload.userId ?? payload.sub ?? payload.id ?? payload.uid;
    if (id) return String(id);
  } catch {
    /* not a JWT */
  }
  return (localStorage.getItem("address") || "default").toLowerCase();
}

const stateKey = () => `rift_device:${deviceUserKey()}`;

export function readDeviceState(): DeviceState {
  try {
    return JSON.parse(localStorage.getItem(stateKey()) || "{}") as DeviceState;
  } catch {
    return {};
  }
}

export function writeDeviceState(next: DeviceState) {
  try {
    localStorage.setItem(stateKey(), JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new CustomEvent(DEVICE_STATE_EVENT, { detail: next }));
}

/* ── key storage (IndexedDB) ──────────────────────────────────────── */

const DB = "rift-device";
const STORE = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

const keyCache = new Map<string, Promise<CryptoKeyPair>>();

/** This device's key pair for the signed-in user; created on first use. */
export function getDeviceKey(userKey = deviceUserKey()): Promise<CryptoKeyPair> {
  let p = keyCache.get(userKey);
  if (!p) {
    p = (async () => {
      const existing = await idb<CryptoKeyPair | undefined>("readonly", (s) => s.get(userKey)).catch(() => undefined);
      if (existing?.privateKey && existing?.publicKey) return existing;
      const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
      await idb("readwrite", (s) => s.put(pair, userKey));
      return pair;
    })();
    p.catch(() => keyCache.delete(userKey));
    keyCache.set(userKey, p);
  }
  return p;
}

/** Throw away this device's key (after the device was removed). */
export async function resetDeviceKey(userKey = deviceUserKey()) {
  keyCache.delete(userKey);
  await idb("readwrite", (s) => s.delete(userKey)).catch(() => undefined);
  writeDeviceState({});
}

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64url = (buf: ArrayBuffer) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

export async function devicePublicKeySpki(): Promise<string> {
  const { publicKey } = await getDeviceKey();
  return b64(await crypto.subtle.exportKey("spki", publicKey));
}

/* ── proof header ─────────────────────────────────────────────────── */

async function bodyBytes(body: BodyInit | null | undefined): Promise<Uint8Array> {
  if (body == null) return new Uint8Array();
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (ArrayBuffer.isView(body)) return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
  if (body instanceof URLSearchParams) return new TextEncoder().encode(body.toString());
  return new Uint8Array();
}

export function deviceSigningString(deviceId: string, ts: number, method: string, pathWithQuery: string, bodySha256Hex: string) {
  return `rift-device-v1\n${deviceId}\n${ts}\n${method.toUpperCase()}\n${pathWithQuery}\n${bodySha256Hex}`;
}

export async function deviceProof(deviceId: string, method: string, url: string, body?: BodyInit | null): Promise<string> {
  const { privateKey } = await getDeviceKey();
  const u = new URL(url, window.location.origin);
  const ts = Math.floor(Date.now() / 1000);
  const digest = hex(await crypto.subtle.digest("SHA-256", await bodyBytes(body)));
  const msg = new TextEncoder().encode(deviceSigningString(deviceId, ts, method, u.pathname + u.search, digest));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, msg);
  return `${deviceId}.${ts}.${b64url(sig)}`;
}

/* ── the one fetch every authenticated backend call goes through ──── */

let lastBlockAt = 0;
/** True for ~3s after the server refused a money action from this device. */
export const recentlyBlocked = () => Date.now() - lastBlockAt < 3000;

export function isDeviceBlock(e: unknown): boolean {
  const err = e as { code?: string; error?: string; response?: { data?: { error?: string } } } | null;
  return err?.code === "DEVICE_NOT_TRUSTED" || err?.response?.data?.error === "DEVICE_NOT_TRUSTED" || recentlyBlocked();
}

function hasAuth(headers: HeadersInit | undefined) {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has("authorization");
  if (Array.isArray(headers)) return headers.some(([k]) => k.toLowerCase() === "authorization");
  return Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
}

function withHeader(headers: HeadersInit | undefined, value: string): HeadersInit {
  if (headers instanceof Headers) {
    const h = new Headers(headers);
    h.set(DEVICE_HEADER, value);
    return h;
  }
  if (Array.isArray(headers)) return [...headers, [DEVICE_HEADER, value]];
  return { ...(headers || {}), [DEVICE_HEADER]: value };
}

async function inspect(res: Response) {
  if (res.status !== 403 && res.status !== 401) return;
  const json = await res
    .clone()
    .json()
    .catch(() => null);
  const code = json?.error ?? json?.code ?? json?.data?.error;
  if (code === "DEVICE_NOT_TRUSTED" || code === "DEVICE_PROOF_INVALID") {
    lastBlockAt = Date.now();
    const status: DeviceStatus = code === "DEVICE_PROOF_INVALID" ? "unknown" : json?.deviceStatus ?? json?.data?.deviceStatus ?? "unknown";
    const coolingOffUntil = json?.coolingOffUntil ?? json?.data?.coolingOffUntil;
    const prev = readDeviceState();
    if (code === "DEVICE_NOT_TRUSTED") writeDeviceState({ ...prev, status, coolingOffUntil: coolingOffUntil ?? prev.coolingOffUntil });
    window.dispatchEvent(new CustomEvent(DEVICE_NOT_TRUSTED_EVENT, { detail: { status, coolingOffUntil, code } }));
  }
}

/**
 * fetch() for the Rift backend: adds X-Rift-Device to authenticated
 * requests once this device is registered, and raises the "Approve this
 * device" panel when the server refuses one.
 */
export async function signedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = input;
  const isBackend = url.startsWith(getApiBase()) || url.startsWith("/api/");
  let next = init;
  if (isBackend && hasAuth(init.headers)) {
    const { id } = readDeviceState();
    if (id) {
      try {
        next = { ...init, headers: withHeader(init.headers, await deviceProof(id, init.method || "GET", url, init.body)) };
      } catch {
        /* no WebCrypto / IndexedDB: send without proof */
      }
    }
  }
  const res = await fetch(url, next);
  if (isBackend) await inspect(res);
  return res;
}

/* ── registration ─────────────────────────────────────────────────── */

export function deviceLabel(ua = navigator.userAgent): { label: string; platform: string } {
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X|Macintosh/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : /Linux/.test(ua)
              ? "Linux"
              : "this device";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const platform = /iPhone|iPad/.test(ua) ? "ios" : /Android/.test(ua) ? "android" : /Mac/.test(ua) ? "macos" : /Windows/.test(ua) ? "windows" : "web";
  return { label: `${browser} on ${os}`, platform };
}

let registering: Promise<DeviceState | null> | null = null;

/** Make sure this device has a key and is known to the server. */
export function registerDevice(authHeaders: () => Record<string, string>): Promise<DeviceState | null> {
  if (registering) return registering;
  registering = (async () => {
    try {
      if (!localStorage.getItem("token") || typeof crypto?.subtle === "undefined" || typeof indexedDB === "undefined") return null;
      const publicKey = await devicePublicKeySpki();
      const { label, platform } = deviceLabel();
      const res = await signedFetch(`${getApiBase()}/v1/devices`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ publicKey, label, platform }),
        cache: "no-store",
      });
      if (!res.ok) return null; // endpoint not deployed yet: carry on without binding
      const json = await res.json().catch(() => ({}));
      const d = json?.data ?? json;
      if (!d?.id) return null;
      const next: DeviceState = { id: String(d.id), status: (d.status as DeviceStatus) ?? "unknown", coolingOffUntil: d.coolingOffUntil ?? undefined };
      writeDeviceState(next);
      return next;
    } catch {
      return null;
    } finally {
      registering = null;
    }
  })();
  return registering;
}
