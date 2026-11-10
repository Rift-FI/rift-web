import { createContext, ReactNode, useContext, useState } from "react";
import { KYCData, Country } from "./types";

interface KYCContextValue {
  kycData: KYCData;
  setKycData: (data: Partial<KYCData>) => void;
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country | null) => void;
  isKycRequired: boolean;
  setIsKycRequired: (required: boolean) => void;
  isKycComplete: boolean;
  setIsKycComplete: (complete: boolean) => void;
}

const KYCContext = createContext<KYCContextValue | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function KYCProvider({ children }: Props) {
  const [kycData, setKycDataState] = useState<KYCData>({});
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isKycRequired, setIsKycRequired] = useState(false);
  const [isKycComplete, setIsKycComplete] = useState(false);

  const setKycData = (data: Partial<KYCData>) => {
    setKycDataState((prev) => ({ ...prev, ...data }));
  };

  return (
    <KYCContext.Provider
      value={{
        kycData,
        setKycData,
        selectedCountry,
        setSelectedCountry,
        isKycRequired,
        setIsKycRequired,
        isKycComplete,
        setIsKycComplete,
      }}
    >
      {children}
    </KYCContext.Provider>
  );
}

export function useKYC() {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error("useKYC must be used within a KYCProvider");
  }
  return context;
}
