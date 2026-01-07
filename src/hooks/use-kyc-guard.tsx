import { useState, useCallback } from "react";
import useKYCStatus from "@/hooks/data/use-kyc-status";

/**
 * Hook to guard sensitive features with KYC verification
 *
 * Usage:
 * ```tsx
 * const { checkKYC, isKYCVerified, isUnderReview, showKYCModal, closeKYCModal, featureName } = useKYCGuard();
 *
 * const handleWithdraw = () => {
 *   if (!checkKYC("withdrawals")) return;
 *   // Proceed with withdrawal
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleWithdraw}>Withdraw</button>
 *     <KYCRequiredModal isOpen={showKYCModal} onClose={closeKYCModal} featureName={featureName} isUnderReview={isUnderReview} />
 *   </>
 * );
 * ```
 */
export default function useKYCGuard() {
  const { isKYCVerified, isUnderReview, isLoading, refetch } = useKYCStatus();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [featureName, setFeatureName] = useState<string>("this feature");

  /**
   * Check if user is KYC verified before allowing access to a feature
   * @param feature - Name of the feature being accessed (for display in modal)
   * @returns true if verified, false if not (and shows modal)
   */
  const checkKYC = useCallback(
    (feature: string = "this feature"): boolean => {
      if (isKYCVerified) {
        return true;
      }

      // Show modal for both unverified and under review states
      setFeatureName(feature);
      setShowKYCModal(true);
      return false;
    },
    [isKYCVerified]
  );

  const closeKYCModal = useCallback(() => {
    setShowKYCModal(false);
  }, []);

  const openKYCModal = useCallback((feature: string = "this feature") => {
    setFeatureName(feature);
    setShowKYCModal(true);
  }, []);

  return {
    checkKYC,
    isKYCVerified,
    isUnderReview,
    isLoading,
    showKYCModal,
    closeKYCModal,
    openKYCModal,
    featureName,
    refetchKYCStatus: refetch,
  };
}
