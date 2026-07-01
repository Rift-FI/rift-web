import { useEffect, useState } from "react";
import { toast } from "sonner";
import { enrolPasskey, isPlatformAuthenticatorAvailable } from "@/lib/webauthn";
import {
  nonCustodialConfig,
  backendBaseUrl,
  getV3Status,
} from "@/lib/nonCustodial";

/**
 * Sandbox-only banner shown when the last sign-in deferred passkey
 * enrolment.
 *
 * Why deferred? Google/Apple OAuth returns via a popup. When the popup
 * closes, the opener does NOT have a fresh transient user activation, so
 * calling navigator.credentials.create() directly from the login mutation
 * fails silently with NotAllowedError.
 *
 * This banner gives the user a button they can click — that click is the
 * fresh activation the browser needs. `use-google-auth` / `use-apple-auth`
 * set localStorage.rift_v3_enrolment_pending when their in-line migration
 * skipped for that reason.
 */
export default function V3EnrolmentBanner() {
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const nc = nonCustodialConfig();
    if (!nc.enabled) return;

    let cancelled = false;

    (async () => {
      const flag = localStorage.getItem("rift_v3_enrolment_pending");
      if (!flag) return;

      // Second-chance safety: if the user is already v3 (e.g. another
      // device or session finished the enrolment), just clear the flag
      // and don't nag.
      const token = localStorage.getItem("token");
      if (!token) return;
      const status = await getV3Status(token);
      if (cancelled) return;
      if (status?.version === "v3") {
        localStorage.removeItem("rift_v3_enrolment_pending");
        return;
      }
      // Also skip if the platform can't do WebAuthn at all.
      const supported = await isPlatformAuthenticatorAvailable();
      if (cancelled) return;
      if (!supported) {
        localStorage.removeItem("rift_v3_enrolment_pending");
        return;
      }
      setPending(flag);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onEnable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const nc = nonCustodialConfig();
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not signed in");

      const { method } = await enrolPasskey({
        rpId: nc.passkeyRpId,
        rpName: nc.passkeyRpName,
        userName: "rift-user",
      });

      const base = backendBaseUrl();
      const res = await fetch(`${base}/wallet/migrate-to-v3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enrolledMethods: [method] }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`migrate-to-v3 ${res.status}: ${body}`);
      }

      localStorage.removeItem("rift_v3_enrolment_pending");
      setPending(null);
      toast.success("Device signing enabled");
    } catch (e: any) {
      const msg = e?.message || String(e);
      // NotAllowedError = user cancelled the prompt. Don't treat as a
      // hard failure — leave the flag so we prompt again on next visit.
      if (msg.includes("NotAllowed")) {
        toast.info("Enrolment cancelled");
      } else {
        toast.error(`Could not enable device signing: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = () => {
    localStorage.removeItem("rift_v3_enrolment_pending");
    setPending(null);
  };

  if (!pending) return null;

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-amber-900 leading-tight">
          Enable device signing
        </p>
        <p className="text-[12px] text-amber-800/90 mt-0.5 leading-snug">
          Approve on-chain transactions with Touch ID / Face ID.
        </p>
      </div>
      <button
        onClick={onEnable}
        disabled={busy}
        className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-[12px] font-semibold disabled:opacity-60"
      >
        {busy ? "Enabling…" : "Enable"}
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 px-2 text-amber-900/70 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
