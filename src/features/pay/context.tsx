import { createContext, useContext, useState, ReactNode } from "react";

export type PaymentType = "MOBILE" | "PAYBILL" | "BUY_GOODS";

export type PayStep = "type" | "amount" | "recipient" | "confirmation";

export interface RecipientData {
  accountIdentifier: string; // Mobile number for MOBILE, Paybill number for PAYBILL, Till number for BUY_GOODS
  accountNumber?: string; // Only for PAYBILL
  accountName?: string; // Optional display name
  institution: "Safaricom";
  type: PaymentType;
  currency: "KES";
}

export interface PaymentData {
  type?: PaymentType;
  amount?: number; // KES amount entered by user
  recipient?: RecipientData;
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
  const [currentStep, setCurrentStep] = useState<PayStep>("type");

  const updatePaymentData = (data: Partial<PaymentData>) => {
    setPaymentData((prev) => ({ ...prev, ...data }));
  };

  const resetPayment = () => {
    setPaymentData({});
    setCurrentStep("type");
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