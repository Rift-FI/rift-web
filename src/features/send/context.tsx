import { createContext, ReactNode, useContext } from "react";
import z from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const send_state = z.object({
  token: z.string().optional(),
  chain: z.string().optional(),
  amount: z.string().optional(),
  hash: z.string().optional(),
  recipient: z.string().optional(),
  mode: z.enum(["send-to-address", "send-specific-link", "send-open-link"]),
  searchfilter: z.string().optional(),
  active: z.enum([
    "select-token",
    "address-search",
    "user-search",
    "amount-input",
    "confirm",
    "success",
    "error",
    "processing",
  ]),
  authMethod: z
    .enum(["phone-otp", "email-otp", "external-id-password"])
    .optional(),
  email: z.string().optional(),
  externalId: z.string().optional(),
  password: z.string().optional(),
});

type SEND_STATE_SCHEMA = z.infer<typeof send_state>;

type sendTokenCtxType = {
  state: UseFormReturn<SEND_STATE_SCHEMA> | null;
  switchCurrentStep: (target: SEND_STATE_SCHEMA["active"]) => void;
};

const sendTokenCtx = createContext<sendTokenCtxType>({
  state: null,
  switchCurrentStep: (target: SEND_STATE_SCHEMA["active"]) => {},
});

interface providerprops {
  children: ReactNode;
}

export const SendCryptoProvider = ({ children }: providerprops) => {
  const send_state_form = useForm<SEND_STATE_SCHEMA>({
    resolver: zodResolver(send_state),
    defaultValues: { active: "select-token" },
  });

  const switchCurrentStep = (target: SEND_STATE_SCHEMA["active"]) => {
    send_state_form.setValue("active", target);
  };

  return (
    <sendTokenCtx.Provider
      value={{
        state: send_state_form,
        switchCurrentStep,
      }}
    >
      {children}
    </sendTokenCtx.Provider>
  );
};

export const useSendContext = () => {
  const context = useContext(sendTokenCtx);

  return {
    ...context,
  };
};
