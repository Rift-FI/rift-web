import { createContext, useContext, useState, ReactNode } from "react";
import { OfframpOrder } from "@/hooks/data/use-create-withdrawal-order";
import { FeeBreakdown } from "@/hooks/data/use-offramp-fee";

export type WithdrawStep = "source" | "amount" | "confirmation" | "success";

// Chains that support direct withdrawal
export type OfframpSource =
  | "base-usdc"
  | "base-usdt"
  | "ethereum-usdc"
  | "ethereum-usdt"
  | "celo-usdc"
  | "celo-usdt"
  | "polygon-usdc"
  | "polygon-usdt"
  | "arbitrum-usdc"
  | "arbitrum-usdt"
  | "lisk-usdc"
  | "lisk-usdt";

export interface SourceConfig {
  id: OfframpSource;
  token: "USDC" | "USDT";
  chain: string;
  chainLabel: string;
  sdkChain: string;
  icon: string;
}

const USDC_ICON = "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png";
const USDT_ICON = "https://coin-images.coingecko.com/coins/images/325/small/Tether.png";

export const SOURCE_CONFIGS: SourceConfig[] = [
  { id: "base-usdc", token: "USDC", chain: "BASE", chainLabel: "Base", sdkChain: "base", icon: USDC_ICON },
  { id: "base-usdt", token: "USDT", chain: "BASE", chainLabel: "Base", sdkChain: "base", icon: USDT_ICON },
  { id: "ethereum-usdc", token: "USDC", chain: "ETHEREUM", chainLabel: "Ethereum", sdkChain: "ethereum", icon: USDC_ICON },
  { id: "ethereum-usdt", token: "USDT", chain: "ETHEREUM", chainLabel: "Ethereum", sdkChain: "ethereum", icon: USDT_ICON },
  { id: "celo-usdc", token: "USDC", chain: "CELO", chainLabel: "Celo", sdkChain: "celo", icon: USDC_ICON },
  { id: "celo-usdt", token: "USDT", chain: "CELO", chainLabel: "Celo", sdkChain: "celo", icon: USDT_ICON },
  { id: "polygon-usdc", token: "USDC", chain: "POLYGON", chainLabel: "Polygon", sdkChain: "polygon", icon: USDC_ICON },
  { id: "polygon-usdt", token: "USDT", chain: "POLYGON", chainLabel: "Polygon", sdkChain: "polygon", icon: USDT_ICON },
  { id: "arbitrum-usdc", token: "USDC", chain: "ARBITRUM", chainLabel: "Arbitrum", sdkChain: "arbitrum", icon: USDC_ICON },
  { id: "arbitrum-usdt", token: "USDT", chain: "ARBITRUM", chainLabel: "Arbitrum", sdkChain: "arbitrum", icon: USDT_ICON },
  { id: "lisk-usdc", token: "USDC", chain: "LISK", chainLabel: "Lisk", sdkChain: "lisk", icon: USDC_ICON },
  { id: "lisk-usdt", token: "USDT", chain: "LISK", chainLabel: "Lisk", sdkChain: "lisk", icon: USDT_ICON },
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
