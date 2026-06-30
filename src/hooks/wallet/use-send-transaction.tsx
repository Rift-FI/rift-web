import { useMutation } from "@tanstack/react-query";
import rift from "@/lib/rift";
import { nonCustodialConfig, signAndSubmitSpend } from "@/lib/nonCustodial";

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
  // Non-custodial sandbox path: two-phase signing with passkey. No
  // OTP / password required — the authProof IS the consent. We hit
  // /v1/transactions/preview → user_op_hash → passkey → submit-prepared.
  const { enabled, passkeyRpId } = nonCustodialConfig();
  if (enabled) {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) throw new Error("No access token for non-custodial send");
    const res = await signAndSubmitSpend({
      accessToken,
      chain: args.chain,
      token: args.token,
      recipient: args.recipient,
      amount: args.amount,
      rpId: passkeyRpId,
    });
    return {
      hash: res.transactionHash || res.hash,
      timestamp: Date.now(),
    };
  }

  // Legacy one-phase path (custodial v1 wallets) — prepare auth payload
  // and submit via SDK. Backend signs internally without authProof.
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
