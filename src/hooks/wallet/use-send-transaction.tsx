import { sleep } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"

export interface SendTransactionArgs {
    recipient: string,
    amount: string,
    token: string,
    chain: string
}

export interface TransactionResult {
    hash: string,
    timestamp: number
}

async function commitTransaction(args: SendTransactionArgs): Promise<TransactionResult> {
    // TODO: make transaction
    await sleep(1_000)

    // throw new Error("I'm messing with you")
    return {
        hash: "0x44332212",
        timestamp: Date.now()
    }
}


export default function useSendTranaction(){

    const sendTransactionMutation = useMutation({
        mutationFn: async (args: SendTransactionArgs) => {
            return commitTransaction(args)
        }
    })

    

    return {
        sendTransactionMutation
    }
}