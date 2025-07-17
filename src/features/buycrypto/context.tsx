import { createContext, ReactNode, useContext } from "react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";

export type buyTokens = "BERA-USDC" | "ETH" | "POL-USDC" | "WBERA";

const stateSchema = z.object({
  cryptoAmount: z.string().optional(),
  kesAmount: z.string().optional(),
  purchaseToken: z.string().optional(),
  purchaseTokenId: z.string().optional(),
  mpesaNumber: z.string().optional(),
  recipient: z.string().optional(),
  checkoutRequestId: z.string().optional(),
  currentStep: z.enum(["CHOOSE-TOKEN", "CRYPTO-AMOUNT", "PHONE", "CONFIRM"]),
});

type State = z.infer<typeof stateSchema>;

type buyCtxType = {
  state: UseFormReturn<State> | null;
  switchCurrentStep: (nextstep: State["currentStep"]) => void;
};

const buyContext = createContext<buyCtxType>({
  state: null,
  switchCurrentStep: () => {},
});

interface providerprops {
  children: ReactNode;
}

export const BuyCryptoProvider = ({ children }: providerprops) => {
  const form = useForm<State>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      currentStep: "CHOOSE-TOKEN",
      purchaseToken: "BERA-USDC",
      purchaseTokenId: "usd-coin",
    },
  });

  const onSwitchCurrentStep = (nextstep: State["currentStep"]) => {
    form.setValue("currentStep", nextstep);
  };

  return (
    <buyContext.Provider
      value={{
        state: form,
        switchCurrentStep: onSwitchCurrentStep,
      }}
    >
      {children}
    </buyContext.Provider>
  );
};

export const useBuyCrypto = () => {
  const context = useContext(buyContext);
  const currentStep = context.state?.watch("currentStep");

  return {
    ...context,
    currentStep,
  };
};
