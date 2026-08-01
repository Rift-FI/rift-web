import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSmartphone } from "react-icons/fi";
import { registerMethodChooser } from "@/lib/nonCustodial";

export type ChooserMethod = "passkey" | "google";

interface EnrolledOption {
  kind: "passkey" | "oidc";
  iss?: string;
  label?: string;
}

interface PendingChoice {
  options: EnrolledOption[];
  resolve: (choice: ChooserMethod) => void;
  reject: (err: Error) => void;
}

/**
 * MethodChooserProvider
 *
 * Mounts once at shell level and registers a global "ask the user which
 * method to sign with" hook via registerMethodChooser(). resolveAuthProof
 * in nonCustodial.ts invokes that hook whenever an "auto"-mode signing
 * attempt has more than one enrolled method — the modal blocks, the user
 * picks, and the promise resolves with "passkey" | "google".
 *
 * Design: the provider is decoupled from the signing code. The library
 * doesn't import React; the UI registers a callback with the library at
 * mount time. This keeps `nonCustodial.ts` clean of React deps and makes
 * the chooser modal easy to swap without rewriting the signing code.
 *
 * When the user has ONE method enrolled, resolveAuthProof never asks —
 * it uses that method silently, so this modal doesn't fire.
 */
export default function MethodChooserProvider() {
  const [pending, setPending] = useState<PendingChoice | null>(null);

  useEffect(() => {
    registerMethodChooser((options) => {
      return new Promise<ChooserMethod>((resolve, reject) => {
        // Normalise: prefer the raw kinds. If neither passkey nor a
        // google-flavoured OIDC exists, no choice to make.
        const hasPasskey = options.some((o) => o.kind === "passkey");
        const hasGoogle = options.some(
          (o) => o.kind === "oidc" && (!o.iss || o.iss.includes("google"))
        );
        if (hasPasskey && hasGoogle) {
          setPending({ options, resolve, reject });
        } else if (hasPasskey) {
          resolve("passkey");
        } else {
          resolve("google");
        }
      });
    });
    return () => registerMethodChooser(null);
  }, []);

  const pick = (choice: ChooserMethod) => {
    if (!pending) return;
    pending.resolve(choice);
    setPending(null);
  };

  const cancel = () => {
    if (!pending) return;
    pending.reject(new Error("MethodChooser cancelled by user"));
    setPending(null);
  };

  const googleLabel = pending?.options.find(
    (o) => o.kind === "oidc" && (!o.iss || o.iss.includes("google"))
  )?.label;

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // z-[9999] to sit above any Radix/vaul Drawer overlay that
          // might otherwise capture the pointer-down event (vaul's
          // focus-trap treats clicks "outside" its Content as
          // interact-outside and can eat them before they reach the
          // buttons below — which the user reported as
          // "modal is visible but nothing happens when I click").
          // pointer-events-auto is set explicitly so the modal always
          // accepts pointer input even when a parent turned them off
          // for a stacking-context ancestor.
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4">
              <h2 className="text-[18px] font-semibold text-text-default leading-tight">
                Choose signing method
              </h2>
              <p className="text-[13px] text-text-subtle mt-1.5 leading-snug">
                Approve this transaction with your device sensor or with your
                Google account.
              </p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={() => pick("passkey")}
                className="w-full py-3 rounded-2xl bg-accent-primary text-white text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                <FiSmartphone className="w-4 h-4" />
                Touch ID / Face ID
              </button>
              <button
                onClick={() => pick("google")}
                className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-text-default text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                <GoogleGlyph />
                {googleLabel ? `Google — ${googleLabel}` : "Continue with Google"}
              </button>
              <button
                onClick={cancel}
                className="w-full py-2 mt-1 text-[12px] font-medium text-text-subtle hover:text-text-default"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
