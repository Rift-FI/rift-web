import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { FiX, FiShield, FiSmartphone } from "react-icons/fi";
import { getApiBase } from "@/lib/apiBase";
import { nonCustodialConfig } from "@/lib/nonCustodial";

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
 * Signing methods page — read-only.
 *
 * Shows the envelope version + the methods enrolled inside the sealed
 * v3 CBOR (projected from the User row — see backend
 * walletMethodsController.ts for scope caveats).
 *
 * No add / remove buttons. Adding a method to an existing v3 envelope
 * requires an enclave reseal op that hasn't shipped. Rather than dangle
 * a "Coming soon" toast the user hits and bounces off of, we surface
 * only what actually works: the current enrolments and their labels.
 * When the enclave reseal op ships, the add UI will land in the same
 * push as the working backend endpoint.
 */
export default function WalletMethods() {
  const navigate = useNavigate();
  const [data, setData] = useState<WalletMethodsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const methods = await fetchWalletMethods();
      setData(methods);
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
