import { useMutation } from "@tanstack/react-query";
import rift from "@/lib/rift";

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

async function commitTransaction(
  args: SendTransactionArgs
): Promise<TransactionResult> {
  // Prepare authentication payload based on provided auth method
  let authPayload: any = {};

  if (args.otpCode && !args.email && !args.externalId) {
    // Phone number OTP authentication
    authPayload.phoneNumber = args.phoneNumber;
    authPayload.otpCode = args.otpCode;
  } else if (args.email && args.otpCode) {
    // Email OTP authentication
    authPayload.email = args.email;
    authPayload.otpCode = args.otpCode;
  } else if (args.externalId && args.password) {
    // External ID + password authentication
    authPayload.externalId = args.externalId;
    authPayload.password = args.password;
  } else {
    throw new Error("No valid authentication method provided");
  }

  let transactionPayload: any = {
    chain: args.chain,
    token: args.token,
    to: args.recipient,
    value: args.amount,
    type: "gasless",
    ...authPayload,
  };

  const response = await rift.transactions.send(transactionPayload);

  return {
    hash: response.transactionHash,
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
