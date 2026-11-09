import { useCallback, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import ActionButton from "@/components/ui/action-button";

/**
 * Bridges lib/passkeyWallet's `confirmGesture` hook to a button: when the
 * browser refuses the second WebAuthn prompt (possession proof) for lack
 * of a fresh user gesture, the flow pauses until the user taps
 * "Confirm your passkey" — one extra tap, never more.
 */
export function useGestureConfirm() {
  const [waiting, setWaiting] = useState(false);
  const pending = useRef<{ resolve: () => void; reject: (e: Error) => void } | null>(null);

  const confirmGesture = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        pending.current = { resolve, reject };
        setWaiting(true);
      }),
    []
  );
  const confirm = () => {
    setWaiting(false);
    pending.current?.resolve();
    pending.current = null;
  };
  const cancel = () => {
    setWaiting(false);
    pending.current?.reject(new Error("Passkey setup was cancelled."));
    pending.current = null;
  };
  return { waiting, confirmGesture, confirm, cancel };
}

export function ConfirmPasskeyPrompt(props: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="mt-5 rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-4" data-testid="confirm-passkey">
      <p className="text-[13px] text-text-default">
        Passkey created. Tap once more so your device can confirm it works.
      </p>
      <div className="mt-3 flex gap-3">
        <ActionButton variant="ghost" className="flex-1 w-auto" onClick={props.onCancel}>
          Cancel
        </ActionButton>
        <ActionButton className="flex-1 w-auto" onClick={props.onConfirm}>
          <Fingerprint className="w-4 h-4" /> Confirm your passkey
        </ActionButton>
      </div>
    </div>
  );
}
