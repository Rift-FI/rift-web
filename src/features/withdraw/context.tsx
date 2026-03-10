import { createContext, useContext, useState, ReactNode } from "react";
import { OfframpOrder } from "@/hooks/data/use-create-withdrawal-order";
import { FeeBreakdown } from "@/hooks/data/use-offramp-fee";

export type WithdrawStep = "source" | "amount" | "confirmation" | "success";

// Chains that support direct withdrawal
export type OfframpSource = "base-usdc" | "celo-usdt" | "lisk-usdc" | "lisk-usdt";

export interface SourceConfig {
  id: OfframpSource;
  token: "USDC" | "USDT";
  chain: string;
  chainLabel: string;
  sdkChain: string;
  icon: string;
}

export const SOURCE_CONFIGS: SourceConfig[] = [
  { id: "base-usdc", token: "USDC", chain: "BASE", chainLabel: "Base", sdkChain: "base", icon: "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png" },
  { id: "celo-usdt", token: "USDT", chain: "CELO", chainLabel: "Celo", sdkChain: "celo", icon: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png" },
  { id: "lisk-usdc", token: "USDC", chain: "LISK", chainLabel: "Lisk", sdkChain: "lisk", icon: "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png" },
  { id: "lisk-usdt", token: "USDT", chain: "LISK", chainLabel: "Lisk", sdkChain: "lisk", icon: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png" },
];

export interface WithdrawData {
  amount?: number; // Local currency amount entered by user
  currency?: string; // Currency code (KES, ETB, NGN, etc.)
  feeBreakdown?: FeeBreakdown; // Fee breakdown calculated from API
  selectedSource?: OfframpSource; // Which chain/token to withdraw from
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
  const [currentStep, setCurrentStep] = useState<WithdrawStep>("source");
  const [createdOrder, setCreatedOrder] = useState<OfframpOrder | null>(null);

  const updateWithdrawData = (data: Partial<WithdrawData>) => {
    setWithdrawData((prev) => ({ ...prev, ...data }));
  };

  const resetWithdraw = () => {
    setWithdrawData({});
    setCurrentStep("source");
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
