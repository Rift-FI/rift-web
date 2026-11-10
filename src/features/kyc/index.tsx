import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { isMobileDevice, shouldShowQRCode } from "@/utils/device-detector";
import NationalitySelector from "./components/NationalitySelector";
import MobileOnlyPrompt from "./components/MobileOnlyPrompt";
import SmileIDVerification, { KYCDesktopWrapper } from "./components/SmileIDVerification";
import SumsubVerification from "./components/SumsubVerification";
import { Country } from "./types";
import { isSmileIDCountry } from "./constants";
import useAnalytics from "@/hooks/use-analytics";

type KYCStep = "nationality" | "mobile-prompt" | "verification" | "sumsub" | "complete";

/** Identity verification (SmileID, Sumsub for other countries). */
export default function KYCFlow({ onComplete }: { onComplete?: () => void } = {}) {
  const [currentStep, setCurrentStep] = useState<KYCStep>("nationality");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { logEvent } = useAnalytics();
  const navigate = useNavigate();

  // Check device type on mount
  useEffect(() => {
    const mobile = isMobileDevice();
    const needsQR = shouldShowQRCode();

    setIsMobile(mobile);
    setShowQR(needsQR);

    logEvent("KYC_FLOW_STARTED", {
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

    // Sumsub countries skip the mobile prompt — verification is via external link
    if (!isSmileIDCountry(country.code)) {
      setCurrentStep("sumsub");
      return;
    }

    // SmileID countries: show QR prompt on desktop, or go straight to verification
    if (showQR) {
      setCurrentStep("mobile-prompt");
    } else {
      setCurrentStep("verification");
    }
  };

  const handleVerificationSuccess = (data: any) => {
    logEvent("KYC_VERIFICATION_SUCCESS", {
      country: selectedCountry?.code,
      smileJobId: data.SmileJobID,
    });
    setCurrentStep("complete");

    // Navigate to main app after a short delay
    setTimeout(() => {
      if (onComplete) onComplete();
      else navigate("/app");
    }, 1200);
  };

  const handleVerificationError = (error: any) => {
    logEvent("KYC_VERIFICATION_ERROR", {
      country: selectedCountry?.code,
      error: error.message,
    });
  };

  const handleBack = () => {
    if (currentStep === "verification" || currentStep === "mobile-prompt" || currentStep === "sumsub") {
      setCurrentStep("nationality");
      setSelectedCountry(null);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "nationality":
        return <NationalitySelector onSelect={handleCountrySelect} />;

      case "mobile-prompt":
        return <MobileOnlyPrompt selectedCountry={selectedCountry} />;

      case "sumsub":
        return selectedCountry ? (
          <KYCDesktopWrapper>
            <SumsubVerification
              country={selectedCountry}
              onSuccess={handleVerificationSuccess}
              onError={handleVerificationError}
              onBack={handleBack}
              apiBaseUrl={
                import.meta.env.VITE_API_URL ||
                "https://70f763cc5e5e.ngrok-free.app"
              }
            />
          </KYCDesktopWrapper>
        ) : null;

      case "verification":
        return selectedCountry ? (
          <KYCDesktopWrapper>
            <SmileIDVerification
              country={selectedCountry}
              onSuccess={handleVerificationSuccess}
              onError={handleVerificationError}
              onBack={handleBack}
              apiBaseUrl={
                import.meta.env.VITE_API_URL ||
                "https://70f763cc5e5e.ngrok-free.app"
              }
            />
          </KYCDesktopWrapper>
        ) : null;

      case "complete":
        return (
          <KYCDesktopWrapper>
            <div className="flex flex-col items-center justify-center w-full h-full p-5">
              <h2 className="text-[18px] font-semibold text-ink mb-1">Verified</h2>
              <p className="text-[14px] text-ink-3 text-center">You're all set.</p>
            </div>
          </KYCDesktopWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-app-background">
      {renderStep()}
    </div>
  );
}
