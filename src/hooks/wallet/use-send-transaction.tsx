import { getChains } from "@/lib/assets/chains";
import { getTokens } from "@/lib/assets/tokens";
import { WalletChain } from "@/lib/entities";
import sphere from "@/lib/sphere";
import { useMutation } from "@tanstack/react-query";

export interface SendTransactionArgs {
  recipient: string;
  amount: string;
  token: string;
  chain: string;
  // Authentication parameters - at least one auth method must be provided
  otpCode?: string; // For phone number OTP authentication
  email?: string; // For email OTP authentication
  externalId?: string; // For external ID + password authentication
  password?: string; // For external ID + password authentication
  // Recipient identifier for specific sends
  recipientPhoneNumber?: string;
  recipientEmail?: string;
  recipientExternalId?: string;
}

export interface TransactionResult {
  hash: string;
  timestamp: number;
}

async function commitTransaction(
  args: SendTransactionArgs
): Promise<TransactionResult> {
  const token = (
    await getTokens({
      id: args.token,
      chain: args.chain,
    })
  )?.at(0);

  if (!token) throw new Error("Token not found");

  const chain = (await getChains(args.chain)) as WalletChain | null;

  if (!chain) throw new Error("Chain not found");

  // Prepare authentication payload based on provided auth method
  let authPayload: any = {};

  if (args.otpCode && !args.email && !args.externalId) {
    // Phone number OTP authentication
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

  // Prepare the base transaction payload
  let transactionPayload: any = {
    chain: chain.backend_id as any,
    token: token.name as any,
    to: args.recipient,
    value: args.amount,
    type: "gasless",
    ...authPayload, // Spread the authentication payload
  };

  // Add recipient identifier for specific sends (not anonymous)
  if (args.recipient !== "anonymous") {
    if (args.recipientPhoneNumber) {
      transactionPayload.phoneNumber = args.recipientPhoneNumber;
    } else if (args.recipientEmail) {
      transactionPayload.email = args.recipientEmail;
    } else if (args.recipientExternalId) {
      transactionPayload.externalId = args.recipientExternalId;
    }
  }

  const response = await sphere.transactions.send(transactionPayload);

  return {
    hash: response.transactionHash,
    timestamp: Date.now(),
  };
}

export default function useSendTranaction() {
  const sendTransactionMutation = useMutation({
    mutationFn: async (args: SendTransactionArgs) => {
      return commitTransaction(args);
    },
  });

  return {
    sendTransactionMutation,
  };
}
