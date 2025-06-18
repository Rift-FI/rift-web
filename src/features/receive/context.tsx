import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, ReactNode, useContext } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import z from "zod";

const stateSchema = z.object({
  requestAmount: z.string().optional(),
  requestToken: z.string().optional(),
  requestTokenChain: z.string().optional(),
  searchfilter: z.string().optional(),
  mode: z.enum(["receive", "request"]),
  requestStep: z.enum(["token-select", "amount-input"]).optional(),
});

type State = z.infer<typeof stateSchema>;

type receiveCtxType = {
  state: UseFormReturn<State> | null;
  switchMode: (mode: State["mode"]) => void;
  switchRequestStep: (step: NonNullable<State["requestStep"]>) => void;
  closeAndReset: () => void;
};

const receiveContext = createContext<receiveCtxType>({
  state: null,
  switchMode: () => {},
  switchRequestStep: () => {},
  closeAndReset: () => {},
});

interface providerprops {
  children: ReactNode;
  onClose?: () => void;
}

export const ReceiveCryptoProvider = ({ children, onClose }: providerprops) => {
  const form = useForm<State>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      mode: "receive",
      requestStep: "token-select",
    },
  });

  const onSwitchMode = (mode: State["mode"]) => {
    form.setValue("mode", mode);
    // Reset request step when switching modes
    if (mode === "request") {
      form.setValue("requestStep", "token-select");
    }
  };

  const onSwitchRequestStep = (step: NonNullable<State["requestStep"]>) => {
    form.setValue("requestStep", step);
  };

  const onCloseAndReset = () => {
    onClose?.();
    form.reset();
  };

  return (
    <receiveContext.Provider
      value={{
        state: form,
        switchMode: onSwitchMode,
        switchRequestStep: onSwitchRequestStep,
        closeAndReset: onCloseAndReset,
      }}
    >
      {children}
    </receiveContext.Provider>
  );
};

export const useReceiveCrypto = () => {
  const context = useContext(receiveContext);
  const mode = context.state?.watch("mode");
  const requestStep = context.state?.watch("requestStep");

  return {
    ...context,
    mode,
    requestStep,
  };
};
