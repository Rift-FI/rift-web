import { useEffect, useRef } from "react";

interface TransactionVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (verification: { otpCode?: string; password?: string }) => void;
  title?: string;
}

/**
 * Former OTP / password step in front of pay & withdraw.
 *
 * Every transaction is now approved with the user's passkey at signing
 * time (offramp init → passkey → finalize), so a second factor here would
 * be redundant. The component resolves immediately on open and renders
 * nothing; the props are kept so call sites don't change.
 */
export default function TransactionVerification({
  isOpen,
  onVerified,
}: TransactionVerificationProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (isOpen && !fired.current) {
      fired.current = true;
      onVerified({});
    }
    if (!isOpen) fired.current = false;
  }, [isOpen]);

  return null;
}
