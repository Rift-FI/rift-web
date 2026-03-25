import { createContext, useContext, useState, ReactNode } from "react";
import type { SupportedCurrency } from "@/hooks/data/use-base-usdc-balance";
import { FeeBreakdown } from "@/hooks/data/use-offramp-fee";
import type { OfframpSource } from "@/features/withdraw/context";

export type PaymentType = "MOBILE" | "PAYBILL" | "BUY_GOODS" | "BANK" | "PHONE_NUMBER";

export type PayStep = "country" | "type" | "source" | "amount" | "recipient" | "confirmation";

export type Institution = string;

export interface RecipientData {
  accountIdentifier: string; // Mobile number, bank account, PIX key, paybill/till number
  accountNumber?: string; // Only for PAYBILL
  accountName?: string; // Required for bank transfers
  institution: Institution;
  type?: PaymentType; // Only for Kenya (MOBILE, PAYBILL, BUY_GOODS)
  currency: SupportedCurrency;
  bankCode?: string; // For NGN bank transfers via Pretium
}

export interface PaymentData {
  currency?: SupportedCurrency;
  type?: PaymentType;
  selectedSource?: OfframpSource; // Which chain/token to pay from
  amount?: number; // Local currency amount entered by user
  recipient?: RecipientData;
  feeBreakdown?: FeeBreakdown; // Fee breakdown calculated from API
}

interface PayContextType {
  paymentData: PaymentData;
  updatePaymentData: (data: Partial<PaymentData>) => void;
  currentStep: PayStep;
  setCurrentStep: (step: PayStep) => void;
  resetPayment: () => void;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

export const PayProvider = ({ children }: { children: ReactNode }) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({});
  const [currentStep, setCurrentStep] = useState<PayStep>("country");

  const updatePaymentData = (data: Partial<PaymentData>) => {
    setPaymentData((prev) => ({ ...prev, ...data }));
  };

  const resetPayment = () => {
    setPaymentData({});
    setCurrentStep("country");
  };

  return (
    <PayContext.Provider
      value={{
        paymentData,
        updatePaymentData,
        currentStep,
        setCurrentStep,
        resetPayment,
      }}
    >
      {children}
    </PayContext.Provider>
  );
};

export const usePay = () => {
  const context = useContext(PayContext);
  if (!context) {
    throw new Error("usePay must be used within a PayProvider");
  }
  return context;
};
