import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SideSheet } from "@/v2/ui";

// SmileID's camera components are large: load them only when verifying.
const KYCFlow = lazy(() => import("@/features/kyc"));

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
          <Suspense
            fallback={
              <div className="flex min-h-[40dvh] items-center justify-center text-ink-3">
                <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
              </div>
            }
          >
            <KYCFlow onComplete={done} />
          </Suspense>
        )}
      </div>
    </SideSheet>
  );
}
