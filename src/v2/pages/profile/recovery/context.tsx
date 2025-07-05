import { createContext, ReactNode, useContext } from "react";
import { z } from "zod";
import { UseMutationResult } from "@tanstack/react-query";
import {
  LoginResponse,
  CreateRecoveryResponse,
  UpdateRecoveryMethodResponse,
} from "@stratosphere-network/wallet";
import useWalletAuth, { signInArgs } from "@/hooks/wallet/use-wallet-auth";
import useWalletRecovery, {
  createRecoveryArgs,
  addRecoveryArgs,
} from "@/hooks/wallet/use-wallet-recovery";

export const recoverySchema = z.object({
  emailAddress: z.string().optional(),
  countryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  externalId: z.string().optional(),
  password: z.string().optional(),
  isVerified: z.boolean().optional(),
});

export type RECOVERY_SCHEMA_TYPE = z.infer<typeof recoverySchema>;

interface RecoveryContext {
  signInMutation: UseMutationResult<
    LoginResponse,
    Error,
    signInArgs,
    unknown
  > | null;
  createRecoveryMutation: UseMutationResult<
    CreateRecoveryResponse,
    Error,
    createRecoveryArgs,
    unknown
  > | null;
  addRecoveryMutation: UseMutationResult<
    UpdateRecoveryMethodResponse,
    Error,
    addRecoveryArgs,
    unknown
  > | null;
}

const RecoveryContext = createContext<RecoveryContext>({
  signInMutation: null, // attemp login to verify paasword
  createRecoveryMutation: null,
  addRecoveryMutation: null,
});

interface Props {
  children: ReactNode;
}

export default function RecoveryContextProvider(props: Props) {
  const { children } = props;

  const { signInMutation } = useWalletAuth();
  const { addRecoveryMutation, createRecoveryMutation } = useWalletRecovery({});

  return (
    <RecoveryContext.Provider
      value={{
        signInMutation,
        createRecoveryMutation,
        addRecoveryMutation,
      }}
    >
      {children}
    </RecoveryContext.Provider>
  );
}

export function useRecovery() {
  const context = useContext(RecoveryContext);

  return context;
}
