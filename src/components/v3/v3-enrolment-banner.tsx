import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  enrolPasskey,
  isPlatformAuthenticatorAvailable,
  signWithOidc,
  type EnrolledMethod,
} from "@/lib/webauthn";
import {
  nonCustodialConfig,
  backendBaseUrl,
  getV3Status,
  decodeOidcMethodFromIdToken,
} from "@/lib/nonCustodial";
import { GOOGLE_CLIENT_ID } from "@/constants";

/**
 * v3 Setup Gate — the last-mile enrolment UI.
 *
 * Mounted in the shell. On every load it probes /wallet/v3-status; if
 * the envelope isn't yet v3, it blocks the app with an adaptive modal
 * that lets the user complete migration with one click.
 *
 * Non-dismissible — v3 is mandatory. The user can either:
 *   1. Enable Touch ID / Face ID (passkey), or
 *   2. Continue with Google (OIDC enrolment)
 *
 * Both call POST /wallet/migrate-to-v3 with the resolved method. Passkey
 * option is hidden when the platform authenticator is unavailable, so
 * users on non-WebAuthn devices are funnelled straight to Google.
 *
 * The click provides fresh transient user activation that lets us call
 * navigator.credentials.create — the whole reason we defer OAuth-signup
 * enrolment to this gate instead of firing it inside the mutation.
 */
export default function V3EnrolmentBanner() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [passkeyCapable, setPasskeyCapable] = useState(false);
  const [busy, setBusy] = useState<"passkey" | "google" | null>(null);

  useEffect(() => {
    const nc = nonCustodialConfig();
    if (!nc.enabled) return;

    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const status = await getV3Status(token);
      if (cancelled) return;
      if (status?.version === "v3") {
        localStorage.removeItem("rift_v3_enrolment_pending");
        return;
      }
      // Any non-v3 envelope — gate stays open until we upgrade.
      const supported = await isPlatformAuthenticatorAvailable();
      if (cancelled) return;
      setPasskeyCapable(supported);
      setNeedsSetup(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const runMigrate = async (methods: EnrolledMethod[]) => {
    const nc = nonCustodialConfig();
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not signed in");
    if (methods.length === 0) throw new Error("No enrolment method resolved");

    const base = backendBaseUrl();
    const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
    const res = await fetch(`${base}/wallet/migrate-to-v3`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify({ enrolledMethods: methods }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`migrate-to-v3 ${res.status}: ${body}`);
    }
    void nc;
  };

  const enableWithPasskey = async () => {
    if (busy) return;
    setBusy("passkey");
    try {
      const nc = nonCustodialConfig();
      const { method } = await enrolPasskey({
        rpId: nc.passkeyRpId,
        rpName: nc.passkeyRpName,
        userName: "rift-user",
      });
      await runMigrate([method]);
      localStorage.removeItem("rift_v3_enrolment_pending");
      setNeedsSetup(false);
      toast.success("Device signing enabled");
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("NotAllowed")) {
        toast.info("Enrolment cancelled");
      } else {
        toast.error(`Passkey enrolment failed: ${msg}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const enableWithGoogle = async () => {
    if (busy) return;
    setBusy("google");
    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error("Google not configured (VITE_GOOGLE_CLIENT_ID missing)");
      }
      // Get a Google id_token to use as the OIDC enrolment identity.
      // We use signWithOidc with a random nonce — the enclave enrolment
      // path doesn't require nonce=user_op_hash (that's the signing path).
      // We reuse the helper just to get an id_token with any nonce.
      const enrolmentNonce = crypto.randomUUID().replace(/-/g, "");
      const proof = await signWithOidc({
        clientId: GOOGLE_CLIENT_ID,
        userOpHashHex: enrolmentNonce,
      });
      if (proof.kind !== "oidc" || !proof.id_token) {
        throw new Error("Google returned no id_token");
      }
      const oidcMethod = decodeOidcMethodFromIdToken(
        proof.id_token,
        "https://accounts.google.com"
      );
      if (!oidcMethod) {
        throw new Error("Failed to parse Google id_token");
      }
      await runMigrate([oidcMethod]);
      localStorage.removeItem("rift_v3_enrolment_pending");
      setNeedsSetup(false);
      toast.success("Google sign-in enrolled");
    } catch (e: any) {
      const msg = e?.message || String(e);
      toast.error(`Google enrolment failed: ${msg}`);
    } finally {
      setBusy(null);
    }
  };

  if (!needsSetup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-accent-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-text-default leading-tight">
            Secure your wallet
          </h2>
          <p className="text-[13px] text-text-subtle mt-1.5 leading-snug">
            {passkeyCapable
              ? "Choose how you'd like to sign transactions. Touch ID / Face ID is fastest — Google is a good backup if you switch devices."
              : "This device can't use Touch ID / Face ID. Connect Google to sign transactions and recover your wallet on other devices."}
          </p>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-2">
          {passkeyCapable && (
            <button
              onClick={enableWithPasskey}
              disabled={!!busy}
              className="w-full py-3 rounded-2xl bg-accent-primary text-white text-[14px] font-semibold disabled:opacity-60"
            >
              {busy === "passkey" ? "Enabling…" : "Use Touch ID / Face ID"}
            </button>
          )}
          <button
            onClick={enableWithGoogle}
            disabled={!!busy}
            className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy === "google" ? (
              "Connecting…"
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden>
                  <path
                    d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.896.6-2.04.954-3.386.954-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20z"
                    fill="#34A853"
                  />
                  <path
                    d="M4.405 11.9A6.001 6.001 0 0 1 4.09 10c0-.66.114-1.301.315-1.9V5.51H1.064A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.341-2.59z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.96.99 12.696 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.192 5.736 7.396 3.977 10 3.977z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-text-subtle/70 mt-2 leading-snug">
            v3 wallets require at least one method. Rift can't sign for you.
          </p>
        </div>
      </div>
    </div>
  );
}
