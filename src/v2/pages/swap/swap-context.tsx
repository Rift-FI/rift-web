import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, ReactNode, useContext } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

const swapSchema = z.object({
  from_token: z.string(),
  to_token: z.string(),
  from_chain: z.string(),
  to_chain: z.string(),
  amount_in: z.string(),
  amount_out: z.string(),
});

type SwapSchema = z.infer<typeof swapSchema>;

interface SwapContext {
  state: UseFormReturn<SwapSchema>;
}

const swapContext = createContext<SwapContext>({
  state: {} as any,
});

export interface SwapInitial {
  from_token?: string;
  to_token?: string;
  from_chain?: string;
  to_chain?: string;
  amount_in?: string;
}

interface Props {
  children: ReactNode;
  initial?: SwapInitial;
}
export default function SwapContextProvider(props: Props) {
  const { children, initial } = props;
  const form = useForm<SwapSchema>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      amount_in: "0",
      amount_out: "0",
      from_token: "usd-coin", // Default to USDC
      to_token: "usd-coin", // Default to USDC
      from_chain: "42161", // Default to Arbitrum
      to_chain: "8453", // Default to Base
      ...(initial ?? {}),
    },
  });

  return (
    <swapContext.Provider
      value={{
        state: form,
      }}
    >
      {children}
    </swapContext.Provider>
  );
}

export function useSwap() {
  const context = useContext(swapContext);

  return context;
}
