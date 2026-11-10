import { useQueryClient } from "@tanstack/react-query";
import KYCFlow from "@/features/kyc";
import { SideSheet } from "@/v2/ui";

/**
 * Identity verification (existing SmileID flow) in a sheet. Opened from
 * Settings, or inline when buying with local currency needs it.
 */
export function IdentitySheet({ open, onClose, onVerified }: { open: boolean; onClose: () => void; onVerified?: () => void }) {
  const queryClient = useQueryClient();
  return (
    <SideSheet open={open} onClose={onClose} title="Verify your identity" testId="kyc-sheet">
      <div className="-mx-5 -my-5 min-h-[60dvh]" data-testid="kyc-flow">
        {open && (
          <KYCFlow
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
              onVerified?.();
              onClose();
            }}
          />
        )}
      </div>
    </SideSheet>
  );
}
