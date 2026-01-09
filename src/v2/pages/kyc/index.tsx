import { useNavigate } from "react-router";
import { useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import KYCFlow from "@/features/kyc";
import useKYCStatus from "@/hooks/data/use-kyc-status";

export default function KYCPage() {
  const navigate = useNavigate();
  const { isKYCVerified, refetch } = useKYCStatus();

  // If already verified, redirect to home
  useEffect(() => {
    if (isKYCVerified) {
      navigate("/app", { replace: true });
    }
  }, [isKYCVerified, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSkip = () => {
    // Skip KYC and go to app
    navigate("/app", { replace: true });
  };

  const handleSuccess = () => {
    // Refetch KYC status and redirect
    refetch().then(() => {
      navigate("/app", { replace: true });
    });
  };

  return (
    <div className="w-full h-screen bg-app-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-app-background/95 backdrop-blur-sm border-b border-surface-subtle">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-surface-subtle rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Identity Verification</h1>
          </div>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 rounded-lg transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* KYC Flow */}
      <div className="pt-16 h-full">
        <KYCFlow />
      </div>
    </div>
  );
}
