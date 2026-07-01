import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { FiX, FiChevronRight, FiShield, FiSmartphone } from "react-icons/fi";
import { getApiBase } from "@/lib/apiBase";
import { nonCustodialConfig } from "@/lib/nonCustodial";
import { isPlatformAuthenticatorAvailable } from "@/lib/webauthn";

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
  canAddPasskey: boolean;
  canLinkGoogle: boolean;
  canLinkApple: boolean;
  note?: string;
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
 * Wallet methods page.
 *
 * Read-only view of what the current v3 envelope carries + hints for
 * how to add more. Add-buttons currently POST to /wallet/methods which
 * returns 501 until the enclave reseal op ships — the UI surfaces that
 * with a clear "Coming soon" toast so users understand the state.
 *
 * Once the enclave op lands:
 *   - "Enable Touch ID on this device" → calls navigator.credentials
 *     .create() and POSTs { newMethod: passkey, authProof: <existing> }
 *   - "Link Google" → runs the Google OIDC flow, decodes iss+sub,
 *     POSTs { newMethod: oidc, authProof: <existing> }
 */
export default function WalletMethods() {
  const navigate = useNavigate();
  const [data, setData] = useState<WalletMethodsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [passkeyCapable, setPasskeyCapable] = useState(false);

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

  const onAddMethod = async (kind: "passkey" | "google" | "apple") => {
    // We call the stub so the toast shows the exact backend error text
    // — that way when the enclave op lands the same UI flips to
    // functional without a rewrite.
    const token = localStorage.getItem("token");
    if (!token) return;
    const apiKey = import.meta.env.VITE_SDK_API_KEY as string | undefined;
    try {
      const res = await fetch(`${getApiBase()}/wallet/methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          newMethod: { kind: kind === "passkey" ? "passkey" : "oidc" },
          authProof: { kind: "passkey" },
        }),
      });
      const json = await res.json();
      if (res.status === 501) {
        toast.info(
          json?.hint ||
            "Adding methods needs an enclave update — sign transactions with Google as a fallback for now."
        );
      } else if (!res.ok) {
        toast.error(json?.error || "Add method failed");
      } else {
        toast.success("Method added");
      }
    } catch (e: any) {
      toast.error(e?.message || "Add method failed");
    }
  };

  const nc = nonCustodialConfig();
  if (!nc.enabled) {
    return (
      <div className="p-6 text-center text-text-subtle">
        Wallet methods are only available on the non-custodial sandbox build.
      </div>
    );
  }

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
            {/* Status card */}
            <div className="rounded-2xl bg-surface p-4 mb-5 border border-border/60">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                  <FiShield className="w-4 h-4 text-accent-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-text-default">
                    Envelope version: {data.version ?? "unknown"}
                  </p>
                  <p className="text-[11px] text-text-subtle break-all">
                    {data.ownerAddress ?? "—"}
                  </p>
                </div>
              </div>
              {data.version !== "v3" && (
                <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 mt-2">
                  Wallet isn't on v3 yet. Complete the setup gate to enable
                  device signing.
                </p>
              )}
            </div>

            {/* Enrolled */}
            <h3 className="text-[12px] font-semibold text-text-subtle uppercase tracking-wider mb-2 px-1">
              Enrolled
            </h3>
            {data.enrolled.length === 0 ? (
              <div className="text-[13px] text-text-subtle px-1 mb-5">
                No methods detected. Sign in to trigger the setup gate.
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border border-border/60 bg-app-background overflow-hidden">
                {data.enrolled.map((m, idx) => (
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

            {/* Add */}
            <h3 className="text-[12px] font-semibold text-text-subtle uppercase tracking-wider mb-2 px-1">
              Add recovery method
            </h3>
            <p className="text-[12px] text-text-subtle px-1 mb-3 leading-snug">
              Add another device or account so you can sign transactions if
              you lose one. All enrolled methods can approve transactions.
            </p>
            <div className="flex flex-col gap-2">
              {passkeyCapable && data.canAddPasskey && (
                <button
                  onClick={() => onAddMethod("passkey")}
                  className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center justify-between px-4"
                >
                  <span className="flex items-center gap-2">
                    <FiSmartphone className="w-4 h-4" />
                    Enable Touch ID / Face ID on this device
                  </span>
                  <FiChevronRight className="w-4 h-4 text-text-subtle" />
                </button>
              )}
              {data.canLinkGoogle && (
                <button
                  onClick={() => onAddMethod("google")}
                  className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center justify-between px-4"
                >
                  <span className="flex items-center gap-2">
                    <GoogleGlyph />
                    Link a Google account
                  </span>
                  <FiChevronRight className="w-4 h-4 text-text-subtle" />
                </button>
              )}
              {data.canLinkApple && (
                <button
                  onClick={() => onAddMethod("apple")}
                  className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center justify-between px-4"
                >
                  <span className="flex items-center gap-2">
                    <AppleGlyph />
                    Link an Apple ID
                  </span>
                  <FiChevronRight className="w-4 h-4 text-text-subtle" />
                </button>
              )}
            </div>

            <p className="text-center text-[11px] text-text-subtle/70 mt-6 leading-snug">
              Rift cannot sign transactions for you. Any of your enrolled
              methods can — never share your device or Google account
              credentials.
            </p>
          </>
        )}
      </div>
    </motion.div>
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

const AppleGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden fill="currentColor">
    <path d="M15.53 10.83c-.02-2.24 1.83-3.32 1.91-3.37-1.04-1.52-2.66-1.73-3.24-1.75-1.37-.14-2.7.81-3.4.81-.71 0-1.79-.79-2.95-.77-1.51.02-2.92.88-3.7 2.24-1.59 2.75-.4 6.81 1.13 9.04.75 1.09 1.63 2.31 2.79 2.27 1.12-.05 1.55-.72 2.9-.72 1.35 0 1.73.72 2.91.7 1.21-.02 1.97-1.1 2.7-2.2.85-1.26 1.2-2.49 1.22-2.55-.03-.01-2.35-.9-2.37-3.7zm-2.24-6.79c.6-.74 1.02-1.75.9-2.77-.87.04-1.94.6-2.57 1.32-.56.64-1.06 1.68-.93 2.68.98.08 1.98-.5 2.6-1.23z" />
  </svg>
);
