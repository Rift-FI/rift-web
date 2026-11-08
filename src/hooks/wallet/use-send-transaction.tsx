import { useMutation } from "@tanstack/react-query";
import { signAndSubmitSpend } from "@/lib/nonCustodial";

export interface SendTransactionArgs {
  recipient: string;
  amount: string;
  token: string;
  chain: string;
  // Authentication parameters - at least one auth method must be provided
  phoneNumber?: string;
  otpCode?: string; // For phone number OTP authentication
  email?: string; // For email OTP authentication
  externalId?: string; // For external ID + password authentication
  password?: string; // For external ID + password authentication
}

export interface TransactionResult {
  hash: string;
  timestamp: number;
}

export async function commitTransaction(
  args: SendTransactionArgs
): Promise<TransactionResult> {
  // Two-phase, passkey-approved: /v1/transactions/preview → hashToSign →
  // passkey → submit-prepared. No OTP / password — the passkey IS the
  // consent. (The auth fields on SendTransactionArgs are ignored.)
  const accessToken = localStorage.getItem("token");
  if (!accessToken) throw new Error("Sign in to approve this transfer");
  const res = await signAndSubmitSpend({
    accessToken,
    chain: args.chain,
    token: args.token,
    recipient: args.recipient,
    amount: args.amount,
  });
  return {
    hash: res.transactionHash || res.hash,
    timestamp: Date.now(),
  };
}

export default function useSendTranaction() {
  const sendTransactionMutation = useMutation({
    mutationFn: commitTransaction,
  });

  return {
    sendTransactionMutation,
  };
}
