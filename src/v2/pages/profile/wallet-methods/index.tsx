import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { FiX, FiShield, FiSmartphone, FiPlus } from "react-icons/fi";
import { getApiBase } from "@/lib/apiBase";
import { nonCustodialConfig } from "@/lib/nonCustodial";
import { isPlatformAuthenticatorAvailable } from "@/lib/webauthn";
import {
  addWalletMethod,
  type ExistingMethodChoice,
  type NewMethodKind,
} from "@/lib/addMethod";

interface EnrolledMethod {
  kind: "passkey" | "oidc";
  iss?: string;
  label?: string;
}

interface WalletMethodsResponse {
  version: "v1" | "v2" | "v3" | "legacy-aes" | null;
  ownerAddress: string | null;
  lastUpdatedAt: string | null;
  enrolled: EnrolledMethod[];
}

async function fetchWalletMethods(): Promise<WalletMethodsResponse | null> {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
  const res = await fetch(`${getApiBase()}/wallet/methods`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as WalletMethodsResponse;
}

/**
 * Signing methods page.
 *
 * Shows the current v3 envelope's enrolled methods (projected from the
 * User row) and lets the user add another method for multi-device /
 * recovery use.
 *
 * The add flow is:
 *   1. Backend issues a 32-byte challenge (POST /wallet/methods/challenge)
 *   2. User authorises with an EXISTING method (chosen inline).
 *   3. User enrols the NEW method (Touch ID create OR Google popup).
 *   4. Backend calls the enclave /reseal-v3 op which appends + reseals.
 *
 * If the wallet has only one existing method we don't show a chooser —
 * that method IS the authorising one. If it has two or more we prompt
 * the user which to use so they can, for example, "add a passkey using
 * my Google auth".
 */
export default function WalletMethods() {
  const navigate = useNavigate();
  const [data, setData] = useState<WalletMethodsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [passkeyCapable, setPasskeyCapable] = useState(false);
  const [busyAdd, setBusyAdd] = useState<NewMethodKind | null>(null);
  const [pickerFor, setPickerFor] = useState<NewMethodKind | null>(null);

  const refresh = async () => {
    const methods = await fetchWalletMethods();
    setData(methods);
  };

  useEffect(() => {
    (async () => {
      const [methods, capable] = await Promise.all([
        fetchWalletMethods(),
        isPlatformAuthenticatorAvailable().catch(() => false),
      ]);
      setData(methods);
      setPasskeyCapable(capable);
      setLoading(false);
    })();
  }, []);

  const nc = nonCustodialConfig();
  if (!nc.enabled) {
    return (
      <div className="p-6 text-center text-text-subtle">
        Wallet methods are only available on the non-custodial sandbox build.
      </div>
    );
  }

  const enrolled = data?.enrolled ?? [];
  const hasPasskey = enrolled.some((m) => m.kind === "passkey");
  const hasGoogle = enrolled.some(
    (m) => m.kind === "oidc" && (!m.iss || m.iss.includes("google"))
  );

  /**
   * Run the add flow using the user's chosen existing method + the
   * target new method. Ordering matters — most browsers won't let you
   * fire navigator.credentials twice back-to-back without a fresh user
   * gesture, so the second prompt sometimes needs the user to tap
   * again. We surface a mid-flow toast so it doesn't look stuck.
   */
  const runAdd = async (
    existing: ExistingMethodChoice,
    newKind: NewMethodKind
  ) => {
    if (busyAdd) return;
    setBusyAdd(newKind);
    try {
      await addWalletMethod({
        existing,
        newKind,
        userLabel: data?.ownerAddress ?? "rift-user",
      });
      toast.success(
        newKind === "passkey"
          ? "This device's passkey added"
          : "Google account linked"
      );
      await refresh();
    } catch (e: any) {
      const msg = e?.message || String(e);
      // NotAllowed on WebAuthn = user cancelled the biometric prompt.
      // Not really an error worth toasting as red.
      if (msg.includes("NotAllowed")) {
        toast.info("Cancelled");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusyAdd(null);
    }
  };

  /** Decide whether we need to ASK the user which existing method to sign with. */
  const startAdd = (newKind: NewMethodKind) => {
    const options: ExistingMethodChoice[] = [];
    if (hasPasskey) options.push("passkey");
    if (hasGoogle) options.push("google");

    if (options.length === 0) {
      toast.error("No existing method on file — cannot add recovery.");
      return;
    }
    if (options.length === 1) {
      runAdd(options[0], newKind);
      return;
    }
    setPickerFor(newKind);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full flex flex-col bg-app-background"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/60 bg-app-background">
        <h2 className="text-lg font-semibold text-text-default">
          Signing methods
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="p-2 -mr-2 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Close"
        >
          <FiX className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {loading && (
          <div className="text-center text-text-subtle py-10">Loading…</div>
        )}

        {!loading && data && (
          <>
            {/* Status card — envelope version only, no address noise.
                 The address is a technical detail the user doesn't need
                 to see on the Settings screen. */}
            <div className="rounded-2xl bg-surface p-4 mb-5 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                  <FiShield className="w-4 h-4 text-accent-primary" />
                </div>
                <p className="text-[13px] font-semibold text-text-default">
                  Envelope version: {data.version ?? "unknown"}
                </p>
              </div>
              {data.version !== "v3" && (
                <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 mt-3">
                  Wallet isn't on v3 yet. Complete the setup gate to enable
                  device signing.
                </p>
              )}
            </div>

            {/* Enrolled */}
            <h3 className="text-[12px] font-semibold text-text-subtle uppercase tracking-wider mb-2 px-1">
              Enrolled
            </h3>
            {enrolled.length === 0 ? (
              <div className="text-[13px] text-text-subtle px-1 mb-5">
                No methods detected. Sign in to trigger the setup gate.
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border border-border/60 bg-app-background overflow-hidden">
                {enrolled.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-b-0"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      {m.kind === "passkey" ? (
                        <FiSmartphone className="w-4 h-4 text-gray-700" />
                      ) : (
                        <GoogleGlyph />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text-default">
                        {m.kind === "passkey"
                          ? "Touch ID / Face ID"
                          : m.iss?.includes("apple")
                          ? "Apple ID"
                          : "Google"}
                      </p>
                      <p className="text-[11px] text-text-subtle truncate">
                        {m.label || m.iss || ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add recovery method — only shown on v3 wallets. */}
            {data.version === "v3" && (
              <>
                <h3 className="text-[12px] font-semibold text-text-subtle uppercase tracking-wider mb-2 px-1">
                  Add recovery method
                </h3>
                <p className="text-[12px] text-text-subtle px-1 mb-3 leading-snug">
                  Any enrolled method can sign transactions. Add another so
                  you can still access your wallet if you lose one.
                </p>
                <div className="flex flex-col gap-2">
                  {passkeyCapable && !hasPasskey && (
                    <AddButton
                      icon={<FiSmartphone className="w-4 h-4" />}
                      label="Enable Touch ID / Face ID on this device"
                      busy={busyAdd === "passkey"}
                      onClick={() => startAdd("passkey")}
                    />
                  )}
                  {passkeyCapable && hasPasskey && (
                    <AddButton
                      icon={<FiPlus className="w-4 h-4" />}
                      label="Add another device's passkey"
                      busy={busyAdd === "passkey"}
                      onClick={() => startAdd("passkey")}
                    />
                  )}
                  {!hasGoogle && (
                    <AddButton
                      icon={<GoogleGlyph />}
                      label="Link a Google account"
                      busy={busyAdd === "google"}
                      onClick={() => startAdd("google")}
                    />
                  )}
                </div>
              </>
            )}

            <p className="text-center text-[11px] text-text-subtle/70 mt-6 leading-snug">
              Rift cannot sign transactions for you. Any of your enrolled
              methods can — never share your device or Google account
              credentials.
            </p>
          </>
        )}
      </div>

      {/* Which existing method to authorise with — shown only when both
          are enrolled. */}
      {pickerFor && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-[18px] font-semibold text-text-default leading-tight">
                Confirm the change
              </h2>
              <p className="text-[13px] text-text-subtle mt-1.5 leading-snug">
                Adding a method to your wallet needs approval from a method
                you already have.
              </p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  const nk = pickerFor;
                  setPickerFor(null);
                  runAdd("passkey", nk);
                }}
                className="w-full py-3 rounded-2xl bg-accent-primary text-white text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                <FiSmartphone className="w-4 h-4" />
                Approve with Touch ID / Face ID
              </button>
              <button
                onClick={() => {
                  const nk = pickerFor;
                  setPickerFor(null);
                  runAdd("google", nk);
                }}
                className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                <GoogleGlyph />
                Approve with Google
              </button>
              <button
                onClick={() => setPickerFor(null)}
                className="w-full py-2 mt-1 text-[12px] font-medium text-text-subtle hover:text-text-default"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function AddButton({
  icon,
  label,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center gap-3 px-4 disabled:opacity-60"
    >
      {icon}
      <span className="flex-1 text-left">{busy ? "Working…" : label}</span>
    </button>
  );
}

const GoogleGlyph = () => (
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
);
