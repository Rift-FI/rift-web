import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CancelPaymentRequestResult,
  CancelSendLinkResult,
  ClaimPaymentResponse,
  GetPaymentRequestsResult,
  GetSendLinksResult,
  PayPaymentRequestResponse,
} from "@rift-finance/wallet";
import rift from "@/lib/rift";

export interface CreatePaymentLinkArgs {
  chain: string;
  token: string;
  duration: string;
  amount: string;
  recipient?: string;
  type?: "specific" | "open";
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  otpCode?: string;
  password?: string;
  //
  recipientPhoneNumber?: string;
  recipientEmail?: string;
  recipientExternalId?: string;
}

interface CreatePaymentLinkResponse {
  link: string;
}

interface PayRequestLinkArgs {
  nonce: string;
}

interface createPaymentRequestArgs {
  amount: string;
  chain: string;
  token: string;
}

interface CollectFromSendLinkArgs {
  id: string;
}

interface collectResponse extends ClaimPaymentResponse {
  status: number;
}

interface payResponse extends PayPaymentRequestResponse {
  status: number;
}

async function createPaymentLink(
  args: CreatePaymentLinkArgs
): Promise<CreatePaymentLinkResponse> {
  const response =
    args.type == "specific"
      ? await rift.paymentLinks.createSpecificSendLink({
          chain: args.chain,
          time: args.duration,
          token: args.token,
          value: args.amount,
          ...(args.recipientEmail && { recipientEmail: args.recipientEmail }),
          ...(args.recipientExternalId && {
            recipientUsername: args.recipientExternalId,
          }),
          ...(args.recipientPhoneNumber && {
            recipientPhoneNumber: args.recipientPhoneNumber,
          }),
          ...(args.phoneNumber && {
            phoneNumber: args.phoneNumber,
            otpCode: args.otpCode,
          }),
          ...(args.email && { email: args.email, otpCode: args.otpCode }),
          ...(args.externalId && {
            externalId: args.externalId,
            password: args.password,
          }),
        } as any)
      : await rift.paymentLinks.createOpenSendLink({
          chain: args.chain as any,
          time: args.duration,
          token: args.token as any,
          value: args.amount,
        } as any);

  const url = response?.data;

  return {
    link: url,
  };
}

async function createRequestLink(args: createPaymentRequestArgs) {
  const response = await rift.paymentLinks.requestPayment({
    amount: parseFloat(args?.amount),
    chain: args?.chain as any,
    token: args?.token as any,
  });

  return { link: response?.data };
}

async function payToRequestLink(
  args: PayRequestLinkArgs
): Promise<payResponse> {
  const res = await rift.paymentLinks.payPaymentRequest(args.nonce);

  return res as payResponse;
}

async function collectFromOpenLink(
  args: CollectFromSendLinkArgs
): Promise<collectResponse> {
  const res = await rift.paymentLinks.claimOpenSendLink({ id: args.id });
  return res as collectResponse;
}

async function collectFromSpecificLink(
  args: CollectFromSendLinkArgs
): Promise<collectResponse> {
  const res = await rift.paymentLinks.claimSpecificSendLink({ id: args.id });
  return res as collectResponse;
}

async function cancelPaymentLink(args: {
  nonce: string;
}): Promise<CancelPaymentRequestResult> {
  const res = await rift.paymentLinks.cancelPaymentRequest(args.nonce);
  return res;
}

async function cancelSendLink(args: {
  urlId: string;
}): Promise<CancelSendLinkResult> {
  const res = await rift.paymentLinks.cancelSendLink(args.urlId);
  return res;
}

async function getPaymentRequestLinks(): Promise<GetPaymentRequestsResult> {
  const res = await rift.paymentLinks.listPaymentRequests({});
  return res;
}

async function getSendLinks(): Promise<GetSendLinksResult> {
  const res = await rift.paymentLinks.listSendLinks({});
  return res;
}

export default function usePaymentLinks() {
  const createPaymentLinkMutation = useMutation({
    mutationFn: createPaymentLink,
  });

  const createRequestLinkMutation = useMutation({
    mutationFn: createRequestLink,
  });

  const payRequestPaymentLink = useMutation({ mutationFn: payToRequestLink });

  const revokePaymentLink = useMutation({ mutationFn: cancelPaymentLink });

  const revokeSendLink = useMutation({ mutationFn: cancelSendLink });

  const collectFromOpenSendLink = useMutation({
    mutationFn: collectFromOpenLink,
  });

  const collectFromSpecificSendLink = useMutation({
    mutationFn: collectFromSpecificLink,
  });

  const listRequestLinks = useQuery({
    queryKey: ["payment-links"],
    queryFn: getPaymentRequestLinks,
  });

  const listSendLinks = useQuery({
    queryKey: ["sendlinks"],
    queryFn: getSendLinks,
  });

  return {
    createPaymentLinkMutation,
    createRequestLinkMutation,
    payRequestPaymentLink,
    collectFromOpenSendLink,
    collectFromSpecificSendLink,
    revokePaymentLink,
    revokeSendLink,
    listRequestLinks,
    listSendLinks,
  };
}
