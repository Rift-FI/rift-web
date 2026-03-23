import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { isMobileDevice, shouldShowQRCode } from "@/utils/device-detector";
import NationalitySelector from "@/features/kyc/components/NationalitySelector";
import MobileOnlyPrompt from "@/features/kyc/components/MobileOnlyPrompt";
import SmileIDVerification, { KYCDesktopWrapper } from "@/features/kyc/components/SmileIDVerification";
import SumsubVerification from "@/features/kyc/components/SumsubVerification";
import { Country } from "@/features/kyc/types";
import { isSmileIDCountry } from "@/features/kyc/constants";
import useAnalytics from "@/hooks/use-analytics";
import { useFlow } from "../context";
import ActionButton from "@/components/ui/action-button";

type KYCSubStep = "nationality" | "mobile-prompt" | "verification" | "sumsub";

export default function KYC() {
  const [subStep, setSubStep] = useState<KYCSubStep>("nationality");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { logEvent } = useAnalytics();
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
      provider: isSmileIDCountry(country.code) ? "smileid" : "sumsub",
    });

    // Sumsub countries — external link verification, no camera needed
    if (!isSmileIDCountry(country.code)) {
      setSubStep("sumsub");
      return;
    }

    // SmileID countries: show QR prompt on desktop, or go straight to verification
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
    if (subStep === "verification" || subStep === "mobile-prompt" || subStep === "sumsub") {
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
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 overflow-y-auto min-h-0">
          <NationalitySelector onSelect={handleCountrySelect} />
        </div>

        {/* Skip option - can be removed if KYC is mandatory */}
        <div className="shrink-0 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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

  if (subStep === "mobile-prompt") {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 overflow-y-auto min-h-0">
          <MobileOnlyPrompt selectedCountry={selectedCountry} />
        </div>

        {/* Back button */}
        <div className="shrink-0 px-5 py-3 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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

  if (subStep === "sumsub" && selectedCountry) {
    return (
      <KYCDesktopWrapper>
        <SumsubVerification
          country={selectedCountry}
          onSuccess={handleVerificationSuccess}
          onError={handleVerificationError}
          onBack={handleBack}
          apiBaseUrl={
            import.meta.env.VITE_API_URL || "https://70f763cc5e5e.ngrok-free.app"
          }
        />
      </KYCDesktopWrapper>
    );
  }

  if (subStep === "verification" && selectedCountry) {
    return (
      <KYCDesktopWrapper>
        <SmileIDVerification
          country={selectedCountry}
          onSuccess={handleVerificationSuccess}
          onError={handleVerificationError}
          onBack={handleBack}
          apiBaseUrl={
            import.meta.env.VITE_API_URL || "https://70f763cc5e5e.ngrok-free.app"
          }
        />
      </KYCDesktopWrapper>
    );
  }

  return null;
}
