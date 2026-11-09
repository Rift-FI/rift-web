import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PasskeySetup from "./passkey-setup";
import useWalletStatus, { WALLET_STATUS_KEY } from "@/hooks/wallet/use-wallet-status";
import { PASSKEY_SETUP_REQUIRED_EVENT } from "@/lib/nonCustodial";

/**
 * Mandatory passkey setup gate, mounted in the authenticated shells.
 *
 * Opens when /v1/wallet/status (or the login response's walletStatus)
 * says `needsPasskeySetup`, or when any signing route answers
 * 409 PASSKEY_SETUP_REQUIRED. Not dismissible: without a passkey the
 * wallet can't approve anything.
 */
export default function PasskeySetupGate() {
  const queryClient = useQueryClient();
  const { data: status } = useWalletStatus();
  const [forced, setForced] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const open = () => {
      setDone(false);
      setForced(true);
      queryClient.invalidateQueries({ queryKey: WALLET_STATUS_KEY });
    };
    window.addEventListener(PASSKEY_SETUP_REQUIRED_EVENT, open);
    return () => window.removeEventListener(PASSKEY_SETUP_REQUIRED_EVENT, open);
  }, [queryClient]);

  const show = !done && (forced || status?.needsPasskeySetup === true);
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2A38]/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Secure your wallet with a passkey"
    >
      <PasskeySetup
        status={status}
        onDone={() => {
          setForced(false);
          setDone(true);
        }}
      />
    </div>
  );
}
