import { getChains } from "@/lib/assets/chains"
import { getTokens } from "@/lib/assets/tokens"
import { WalletChain } from "@/lib/entities"
import sphere from "@/lib/sphere"
import { sleep } from "@/lib/utils"
import { CreateSendLinkInput } from "@stratosphere-network/wallet"
import { useMutation } from "@tanstack/react-query"

interface CreatePaymentLinkArgs {
    chain: string,
    token: string,
    duration: string,
    amount: string,
    // TODO: waiting on support for searchable telegram ids
    recipient?: string,
    type?: "specific" | "open"
}

interface CreatePaymentLinkResponse {
    link: string
}

async function createPaymentLink(args: CreatePaymentLinkArgs): Promise<CreatePaymentLinkResponse> {

    const tokens = await getTokens({
        id: args.token,
        chain: args.chain
    })

    const chain = (await getChains(args?.chain)) as WalletChain | null

    const token = tokens?.at(0)

    if (!token) throw new Error("Token not found");
    if (!chain) throw new Error("Chain not found");

    const request = {
        chain: chain.backend_id! as any,
        receiver: args.recipient!,
        time: args.duration,
        token: token.name as any,
        value: args.amount
    }

    const response = args.type == "specific" ?
        await sphere.paymentLinks.createSpecificSendLink(request) :
        await sphere.paymentLinks.createOpenSendLink(request)


    const url = response?.data

    return {
        link: url
    }

    
}

interface CancelPaymentLinkArgs {
    id: string
}
async function cancelPaymentLink(args: CancelPaymentLinkArgs){
    const { id } = args

    // TODO: make request to cancel payment link 
}


export default function useCreatePaymentLink(){
    
    const createPaymentLinkMutation = useMutation({
        mutationFn: createPaymentLink
    })

    const cancelPaymentLinkMutation = useMutation({
        mutationFn: cancelPaymentLink
    })

    return {
        createPaymentLinkMutation,
        cancelPaymentLinkMutation
    }
}