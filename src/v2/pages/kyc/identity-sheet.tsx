import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import KYCFlow from "@/features/kyc";
import { SideSheet } from "@/v2/ui";

/**
 * Identity verification (existing SmileID flow) in a sheet. Opened from
 * Settings, or inline when buying with local currency needs it.
 */
export function IdentitySheet({ open, onClose, onVerified }: { open: boolean; onClose: () => void; onVerified?: () => void }) {
  const queryClient = useQueryClient();
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    onVerified?.();
    onClose();
  };

  // Dev/test only: the SmileID camera can't run headless, so tests signal
  // completion with this event. Never active in production builds.
  useEffect(() => {
    if (!open || !import.meta.env.DEV) return;
    const h = () => done();
    window.addEventListener("rift:kyc-complete", h);
    return () => window.removeEventListener("rift:kyc-complete", h);
  }, [open]);

  return (
    <SideSheet open={open} onClose={onClose} title="Verify your identity" testId="kyc-sheet">
      <div className="-mx-5 -my-5 min-h-[60dvh]" data-testid="kyc-flow">
        {open && (
          <KYCFlow onComplete={done} />
        )}
      </div>
    </SideSheet>
  );
}
