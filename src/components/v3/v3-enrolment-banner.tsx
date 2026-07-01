import { useEffect, useState } from "react";
import { toast } from "sonner";
import { enrolPasskey, isPlatformAuthenticatorAvailable } from "@/lib/webauthn";
import {
  nonCustodialConfig,
  backendBaseUrl,
  getV3Status,
} from "@/lib/nonCustodial";

/**
 * Post-OAuth v3 setup modal — mounted in the shell, active when the last
 * sign-in flagged `rift_v3_enrolment_pending`.
 *
 * Why a blocking modal (not a dismissible banner)?
 *   - Google / Apple sign-in returns via a popup. When the popup closes,
 *     the opener does NOT hold transient user activation, so calling
 *     navigator.credentials.create() from inside the mutation would
 *     silently fail with NotAllowedError.
 *   - To force v3-from-the-start we defer enrolment to this modal, which
 *     lives on /app and gets fresh activation the moment the user clicks
 *     "Enable". The modal blocks the underlying UI until enrolment
 *     succeeds (or the user really opts out via "Skip for now").
 *
 * OTP / password sign-ins never set the pending flag — they enrol inline
 * with the login mutation because there is no popup to steal activation.
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

      const token = localStorage.getItem("token");
      if (!token) return;

      // Another device / session may have finished the enrolment while
      // this tab was closed — clear the flag if the envelope already
      // reached v3.
      const status = await getV3Status(token);
      if (cancelled) return;
      if (status?.version === "v3") {
        localStorage.removeItem("rift_v3_enrolment_pending");
        return;
      }

      // Platform can't do WebAuthn — nothing this modal can offer.
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
      const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
      const res = await fetch(`${base}/wallet/migrate-to-v3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(apiKey ? { "x-api-key": apiKey } : {}),
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
      if (msg.includes("NotAllowed")) {
        toast.info("Enrolment cancelled");
      } else {
        toast.error(`Could not enable device signing: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const onSkip = () => {
    // Escape hatch — user gets a v1 custodial wallet until next login.
    // Next `maybeMigrateToV3` on OTP/password login will re-nudge; next
    // Google/Apple sign-in will set the flag again.
    localStorage.removeItem("rift_v3_enrolment_pending");
    setPending(null);
    toast.info("Skipped — you can enable device signing later in Settings.");
  };

  if (!pending) return null;

  const providerLabel =
    pending === "apple" ? "Apple ID" : pending === "google" ? "Google" : "OAuth";

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
            Finish setting up your wallet
          </h2>
          <p className="text-[13px] text-text-subtle mt-1.5 leading-snug">
            You signed in with {providerLabel}. To send crypto without a
            server-held key, enable device signing — Rift will ask for Touch ID
            / Face ID on every transaction.
          </p>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={onEnable}
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-accent-primary text-white text-[14px] font-semibold disabled:opacity-60"
          >
            {busy ? "Enabling…" : "Enable device signing"}
          </button>
          <button
            onClick={onSkip}
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-transparent text-text-subtle text-[13px] font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
