import useSendTranaction, {
  SendTransactionArgs,
  TransactionResult,
} from "@/hooks/wallet/use-send-transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseMutationResult } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useContext } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

const stateSchema = z.object({
  token: z.string().optional(),
  chain: z.string().optional(),
  amount: z.string().optional(),
  hash: z.string().optional(),
  recipient: z.string().optional(),
  mode: z.enum(["send-to-address", "send-to-anyone"]),
  active: z.enum([
    "select-token",
    "address-search",
    "amount-input",
    "confirm",
    "success",
    "error",
    "processing",
  ]),
});

type State = z.infer<typeof stateSchema>;

interface FlowContext {
  goToNext: (target?: State["active"]) => void;
  goBack: (target?: State["active"]) => void;
  switchMode: (mode: State["mode"]) => void;
  state: UseFormReturn<State> | null;
  sendTransactionMutation: UseMutationResult<
    TransactionResult,
    Error,
    SendTransactionArgs,
    unknown
  > | null;
  closeAndReset: () => void;
}

const flowContext = createContext<FlowContext>({
  goBack() {},
  goToNext() {},
  switchMode() {},
  state: null,
  sendTransactionMutation: null,
  closeAndReset() {},
});

interface Props {
  children?: ReactNode;
  onClose?: () => void;
}

export default function FlowContextProvider(props: Props) {
  const { children, onClose } = props;

  const { sendTransactionMutation } = useSendTranaction();
  const form = useForm<State>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      active: "select-token",
      mode: "send-to-address",
    },
  });

  const active = form.watch("active");

  function back(target?: State["active"]) {
    if (target) {
      form.setValue("active", target);
      return;
    }

    const currentMode = form.getValues("mode");

    switch (active) {
      case "select-token": {
        onClose?.();
        break;
      }
      case "address-search": {
        form.setValue("active", "select-token");
        break;
      }
      case "amount-input": {
        // If in "send-to-anyone" mode, go back to select-token (skip address search)
        if (currentMode === "send-to-anyone") {
          form.setValue("active", "select-token");
        } else {
          form.setValue("active", "address-search");
        }
        break;
      }
      case "confirm": {
        form.setValue("active", "amount-input");
        break;
      }
      case "processing": {
        form.setValue("active", "confirm");
        break;
      }
      case "success": {
        onClose?.();
        break;
      }
      case "error": {
        form.setValue("active", "confirm");
        break;
      }
    }
  }

  function next(target?: State["active"]) {
    if (target) {
      form.setValue("active", target);
      return;
    }

    const currentMode = form.getValues("mode");

    switch (active) {
      case "select-token": {
        // If in "send-to-anyone" mode, skip address search and set recipient to anonymous
        if (currentMode === "send-to-anyone") {
          form.setValue("recipient", "anonymous");
          form.setValue("active", "amount-input");
        } else {
          form.setValue("active", "address-search");
        }
        break;
      }
      case "address-search": {
        form.setValue("active", "amount-input");
        break;
      }
      case "amount-input": {
        form.setValue("active", "confirm");
        break;
      }
      case "success": {
        onClose?.();
        break;
      }
      case "error": {
        form.setValue("active", "confirm");
        break;
      }
    }
  }

  function switchMode(mode: State["mode"]) {
    form.setValue("mode", mode);
    // Reset to select-token when switching modes
    form.setValue("active", "select-token");
    // Clear recipient when switching modes
    form.setValue("recipient", undefined);
  }

  function closeAndReset() {
    onClose?.();
    form.reset();
  }

  return (
    <flowContext.Provider
      value={{
        goBack: back,
        goToNext: next,
        switchMode,
        state: form,
        sendTransactionMutation,
        closeAndReset,
      }}
    >
      {children}
    </flowContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(flowContext);
  const currentStep = context.state?.watch("active");
  const mode = context.state?.watch("mode");
  return {
    ...context,
    currentStep,
    mode,
  };
}
