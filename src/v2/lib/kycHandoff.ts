/**
 * KYC handoff from the Rift phone app.
 *
 * The app opens /kyc#handoff=<code>&returnTo=rift://kyc-done in a browser
 * sheet. The code is exchanged once (POST /v1/kyc/handoffs/exchange) for a
 * 30-minute token that only the KYC endpoints accept. It is kept in
 * memory, never in localStorage: the sheet shares storage with the phone's
 * browser, and must not overwrite (or become) a real web session.
 */
import { backendBaseUrl } from "@/lib/nonCustodial";

export interface HandoffUser {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  externalId?: string | null;
}

let handoff: { token: string; user: HandoffUser; expiresAt: number } | null = null;

/** Only the app's own completion screen. Same rule as the backend. */
export const RETURN_TO_RE = /^rift:\/\/kyc-done(\?[A-Za-z0-9=&%._-]*)?$/;

export function parseHandoffHash(hash: string): { code: string; returnTo: string } | null {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const code = p.get("handoff");
  const returnTo = p.get("returnTo") || "rift://kyc-done";
  if (!code || !RETURN_TO_RE.test(returnTo)) return null;
  return { code, returnTo };
}

export async function exchangeHandoff(code: string, fetchImpl: typeof fetch = fetch): Promise<HandoffUser> {
  const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
  const res = await fetchImpl(`${backendBaseUrl()}/v1/kyc/handoffs/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(apiKey ? { "x-api-key": apiKey } : {}) },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json?.message || "This verification link has expired. Start again from the app."), { code: json?.code });
  const d = json?.data ?? json;
  handoff = { token: String(d.token), user: d.user as HandoffUser, expiresAt: Date.now() + Number(d.expiresIn ?? 1800) * 1000 };
  return handoff.user;
}

export const inHandoff = () => !!handoff && handoff.expiresAt > Date.now();
export const handoffUser = () => (inHandoff() ? handoff!.user : null);

/** The bearer for KYC calls: the handoff token when present, else the web session. */
export function kycAuthToken(): string | null {
  if (inHandoff()) return handoff!.token;
  return localStorage.getItem("token");
}

/** Tests only. */
export function _resetHandoff() {
  handoff = null;
}
