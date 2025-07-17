import { getChains } from "@/lib/assets/chains";
import { getTokens } from "@/lib/assets/tokens";
import { WalletChain } from "@/lib/entities";
import sphere from "@/lib/sphere";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CancelPaymentRequestResult,
  CancelSendLinkResult,
  ClaimPaymentResponse,
  GetPaymentRequestsResult,
  GetSendLinksResult,
  PayPaymentRequestResponse,
} from "@stratosphere-network/wallet";

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
      ? await sphere.paymentLinks.createSpecificSendLink({
          chain: args.chain,
          time: args.duration,
          token: args.token,
          value: args.amount,
          ...(args.phoneNumber && { phoneNumber: args.phoneNumber }),
          ...(args.email && { email: args.email }),
          ...(args.externalId && { username: args.externalId }),
        } as any)
      : await sphere.paymentLinks.createOpenSendLink({
          chain: args.chain as any,
          time: args.duration,
          token: args.token as any,
          value: args.amount,
        });

  const url = response?.data;

  return {
    link: url,
  };
}

async function createRequestLink(args: createPaymentRequestArgs) {
  const response = await sphere.paymentLinks.requestPayment({
    amount: parseFloat(args?.amount),
    chain: args?.chain as any,
    token: args?.token as any,
  });

  return { link: response?.data };
}

async function payToRequestLink(
  args: PayRequestLinkArgs
): Promise<payResponse> {
  const res = await sphere.paymentLinks.payPaymentRequest(args.nonce);

  return res as payResponse;
}

async function collectFromLink(
  args: CollectFromSendLinkArgs
): Promise<collectResponse> {
  const res = await sphere.paymentLinks.claimOpenSendLink({ id: args.id });
  return res as collectResponse;
}

async function cancelPaymentLink(args: {
  nonce: string;
}): Promise<CancelPaymentRequestResult> {
  const res = await sphere.paymentLinks.cancelPaymentRequest(args.nonce);
  return res;
}

async function cancelSendLink(args: {
  urlId: string;
}): Promise<CancelSendLinkResult> {
  const res = await sphere.paymentLinks.cancelSendLink(args.urlId);
  return res;
}

async function getPaymentRequestLinks(): Promise<GetPaymentRequestsResult> {
  const res = await sphere.paymentLinks.listPaymentRequests({});
  return res;
}

async function getSendLinks(): Promise<GetSendLinksResult> {
  const res = await sphere.paymentLinks.listSendLinks({});
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

  const collectFromSendLink = useMutation({ mutationFn: collectFromLink });

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
    collectFromSendLink,
    revokePaymentLink,
    revokeSendLink,
    listRequestLinks,
    listSendLinks,
  };
}
