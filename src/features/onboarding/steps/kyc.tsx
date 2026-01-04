import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { isMobileDevice, shouldShowQRCode } from "@/utils/device-detector";
import NationalitySelector from "@/features/kyc/components/NationalitySelector";
import MobileOnlyPrompt from "@/features/kyc/components/MobileOnlyPrompt";
import SmileIDVerification from "@/features/kyc/components/SmileIDVerification";
import { Country } from "@/features/kyc/types";
import useAnalaytics from "@/hooks/use-analytics";
import { useFlow } from "../context";
import ActionButton from "@/components/ui/action-button";
import DeviceDebugInfo from "@/features/kyc/components/DeviceDebugInfo";

type KYCSubStep = "nationality" | "mobile-prompt" | "verification";

export default function KYC() {
  const [subStep, setSubStep] = useState<KYCSubStep>("nationality");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { logEvent } = useAnalaytics();
  const { goToNext } = useFlow();

  // Check device type on mount
  useEffect(() => {
    const mobile = isMobileDevice();
    const needsQR = shouldShowQRCode();

    setIsMobile(mobile);
    setShowQR(needsQR);

    logEvent("KYC_STEP_STARTED", {
      isMobile: mobile,
      showQR: needsQR,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    });
  }, [logEvent]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    logEvent("KYC_COUNTRY_SELECTED", {
      country: country.code,
      willShowQR: showQR,
    });

    // If we should show QR code, show mobile prompt
    if (showQR) {
      setSubStep("mobile-prompt");
    } else {
      setSubStep("verification");
    }
  };

  const handleVerificationSuccess = (data: any) => {
    logEvent("KYC_VERIFICATION_SUCCESS", {
      country: selectedCountry?.code,
      smileJobId: data.SmileJobID,
    });

    // Store KYC status in localStorage
    localStorage.setItem("kyc_verified", "true");
    localStorage.setItem("kyc_country", selectedCountry?.code || "");

    // Move to the final step
    goToNext("created");
  };

  const handleVerificationError = (error: any) => {
    logEvent("KYC_VERIFICATION_ERROR", {
      country: selectedCountry?.code,
      error: error.message,
    });
  };

  const handleBack = () => {
    if (subStep === "verification" || subStep === "mobile-prompt") {
      setSubStep("nationality");
      setSelectedCountry(null);
    }
  };

  const handleSkipKYC = () => {
    logEvent("KYC_SKIPPED");
    localStorage.setItem("kyc_skipped", "true");
    goToNext("created");
  };

  if (subStep === "nationality") {
    return (
      <>
        <NationalitySelector onSelect={handleCountrySelect} />

        {/* Skip option - can be removed if KYC is mandatory */}
        <div className="fixed bottom-20 left-0 right-0 px-5">
          <button
            onClick={handleSkipKYC}
            className="w-full text-center text-sm text-muted-foreground hover:text-text-default transition-colors py-2"
          >
            Skip for now
          </button>
        </div>
      </>
    );
  }

  if (subStep === "mobile-prompt") {
    return (
      <div className="flex flex-col w-full h-full">
        <MobileOnlyPrompt selectedCountry={selectedCountry} />

        {/* Back button */}
        <div className="fixed bottom-5 left-0 right-0 px-5 space-y-2">
          <ActionButton onClick={handleBack} variant="secondary">
            Go Back
          </ActionButton>
          <button
            onClick={handleSkipKYC}
            className="w-full text-center text-sm text-muted-foreground hover:text-text-default transition-colors py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (subStep === "verification" && selectedCountry) {
    return (
      <SmileIDVerification
        country={selectedCountry}
        onSuccess={handleVerificationSuccess}
        onError={handleVerificationError}
        onBack={handleBack}
        apiBaseUrl={
          import.meta.env.VITE_API_URL || "https://70f763cc5e5e.ngrok-free.app"
        }
      />
    );
  }

  return (
    <>
      {/* Debug info - remove in production */}
      {import.meta.env.DEV && <DeviceDebugInfo />}
      {null}
    </>
  );
}
