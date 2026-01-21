import { createContext, useContext, useState, ReactNode } from "react";
import { OfframpOrder } from "@/hooks/data/use-create-withdrawal-order";
import { FeeBreakdown } from "@/hooks/data/use-offramp-fee";

export type WithdrawStep = "amount" | "confirmation" | "success";

export interface WithdrawData {
  amount?: number; // Local currency amount entered by user
  currency?: string; // Currency code (KES, ETB, NGN, etc.)
  feeBreakdown?: FeeBreakdown; // Fee breakdown calculated from API
}

interface WithdrawContextType {
  withdrawData: WithdrawData;
  updateWithdrawData: (data: Partial<WithdrawData>) => void;
  currentStep: WithdrawStep;
  setCurrentStep: (step: WithdrawStep) => void;
  createdOrder: OfframpOrder | null;
  setCreatedOrder: (order: OfframpOrder) => void;
  resetWithdraw: () => void;
}

const WithdrawContext = createContext<WithdrawContextType | undefined>(undefined);

export const WithdrawProvider = ({ children }: { children: ReactNode }) => {
  const [withdrawData, setWithdrawData] = useState<WithdrawData>({});
  const [currentStep, setCurrentStep] = useState<WithdrawStep>("amount");
  const [createdOrder, setCreatedOrder] = useState<OfframpOrder | null>(null);

  const updateWithdrawData = (data: Partial<WithdrawData>) => {
    setWithdrawData((prev) => ({ ...prev, ...data }));
  };

  const resetWithdraw = () => {
    setWithdrawData({});
    setCurrentStep("amount");
    setCreatedOrder(null);
  };

  return (
    <WithdrawContext.Provider
      value={{
        withdrawData,
        updateWithdrawData,
        currentStep,
        setCurrentStep,
        createdOrder,
        setCreatedOrder,
        resetWithdraw,
      }}
    >
      {children}
    </WithdrawContext.Provider>
  );
};

export const useWithdraw = () => {
  const context = useContext(WithdrawContext);
  if (!context) {
    throw new Error("useWithdraw must be used within a WithdrawProvider");
  }
  return context;
};