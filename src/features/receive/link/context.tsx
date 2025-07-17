import { createContext, ReactNode, useContext } from "react";
import z from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const stateSchema = z.object({
  requestToken: z.string().optional(),
  requestTokenChain: z.string().optional(),
  requestAmount: z.string().optional(),
  searchfilter: z.string().optional(),
  requestStep: z.enum(["token-select", "amount-input"]).optional(),
});

type State = z.infer<typeof stateSchema>;

type requestPaymentType = {
  state: UseFormReturn<State> | null;
  switchPaymentRequestStep: (step: NonNullable<State["requestStep"]>) => void;
};

const requestPaymentCtx = createContext<requestPaymentType>({
  state: null,
  switchPaymentRequestStep: () => {},
});

interface providerprops {
  children: ReactNode;
}

export const PaymentRequestProvider = ({ children }: providerprops) => {
  const form = useForm<State>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      requestStep: "token-select",
    },
  });

  const onSwitchRequestStep = (step: NonNullable<State["requestStep"]>) => {
    form.setValue("requestStep", step);
  };

  return (
    <requestPaymentCtx.Provider
      value={{
        state: form,
        switchPaymentRequestStep: onSwitchRequestStep,
      }}
    >
      {children}
    </requestPaymentCtx.Provider>
  );
};

export const usePaymentRequest = () => {
  const context = useContext(requestPaymentCtx);
  const requestStep = context.state?.watch("requestStep");

  return {
    ...context,
    requestStep,
  };
};
