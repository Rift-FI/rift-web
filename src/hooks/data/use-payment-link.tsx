import { sleep } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"

interface CreatePaymentLinkArgs {
    chain: string,
    token: string,
    duration: string,
    recipient?: string
}

interface CreatePaymentLinkResponse {
    link: string
}

async function createPaymentLink(args: CreatePaymentLinkArgs): Promise<CreatePaymentLinkResponse> {

    // TODO: make request for payment link creation
    await sleep(1_000)

    return {
        link: 'https://google.com'
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