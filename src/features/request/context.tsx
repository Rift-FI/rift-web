import { createContext, useContext, useState, ReactNode } from "react";
import { CreateInvoiceRequest } from "@/hooks/data/use-create-invoice";

export type RequestStep = "amount" | "description" | "sharing";

interface RequestContextType {
  currentStep: RequestStep;
  setCurrentStep: (step: RequestStep) => void;
  requestData: Partial<CreateInvoiceRequest>;
  setRequestData: (data: Partial<CreateInvoiceRequest>) => void;
  updateRequestData: (updates: Partial<CreateInvoiceRequest>) => void;
  createdInvoice: any;
  setCreatedInvoice: (invoice: any) => void;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

interface RequestProviderProps {
  children: ReactNode;
}

export function RequestProvider({ children }: RequestProviderProps) {
  const [currentStep, setCurrentStep] = useState<RequestStep>("amount");
  const [requestData, setRequestData] = useState<Partial<CreateInvoiceRequest>>({
    chain: "BASE",
    token: "USDC",
  });
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  const updateRequestData = (updates: Partial<CreateInvoiceRequest>) => {
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