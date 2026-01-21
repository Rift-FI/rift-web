import { createContext, useContext, useState, ReactNode } from "react";
import { CreateInvoiceRequest } from "@/hooks/data/use-create-invoice";
import { OnrampFeeBreakdown } from "@/hooks/data/use-offramp-fee";

export type RequestStep = "amount" | "description" | "sharing";
export type RequestType = "request" | "topup";

export interface RequestData extends Partial<CreateInvoiceRequest> {
  currency?: string;
  feeBreakdown?: OnrampFeeBreakdown;
}

interface RequestContextType {
  currentStep: RequestStep;
  setCurrentStep: (step: RequestStep) => void;
  requestData: RequestData;
  setRequestData: (data: RequestData) => void;
  updateRequestData: (updates: RequestData) => void;
  createdInvoice: any;
  setCreatedInvoice: (invoice: any) => void;
  requestType: RequestType;
  setRequestType: (type: RequestType) => void;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

interface RequestProviderProps {
  children: ReactNode;
}

export function RequestProvider({ children }: RequestProviderProps) {
  const [currentStep, setCurrentStep] = useState<RequestStep>("amount");
  const [requestData, setRequestData] = useState<RequestData>({
    chain: "BASE",
    token: "USDC",
  });
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [requestType, setRequestType] = useState<RequestType>("request");

  const updateRequestData = (updates: RequestData) => {
    setRequestData(prev => ({ ...prev, ...updates }));
  };

  return (
    <RequestContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        requestData,
        setRequestData,
        updateRequestData,
        createdInvoice,
        setCreatedInvoice,
        requestType,
        setRequestType,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error("useRequest must be used within a RequestProvider");
  }
  return context;
}