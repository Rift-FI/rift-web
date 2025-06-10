import { getChains } from "@/lib/assets/chains"
import { getTokens } from "@/lib/assets/tokens"
import { WalletChain } from "@/lib/entities"
import sphere from "@/lib/sphere"
import { sleep } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"


async function resolveToken(id: string, chain: string){
    const tokens = await getTokens({
        id,
        chain
    })

    return tokens?.at(0) ?? null
}

async function resolveChain(id: string){
    const chain = await getChains(id)

    return chain as WalletChain | null
}


interface SwapTransactionArgs {
    from_token: string,
    to_token: string, 
    from_chain: string, 
    to_chain: string
    amount_in: string
}

async function commitSwap(args: SwapTransactionArgs) {
    if(import.meta.env.VITE_TEST == "true") {
        await sleep(1000)
        return
    }
    const from_token = await resolveToken(args.from_token, args.from_chain)
    const to_token = await resolveToken(args.to_token, args.to_chain)
    const from_chain = await resolveChain(args.from_chain)
    const to_chain = await resolveChain(args.to_chain)

    if(!from_chain || !to_chain || !to_token || !from_token) throw new Error("Unable to resolve tokens");

    // TODO: needs a lot of modifications to actually work
    const result = await sphere.defi.swap({
        chain: from_chain.backend_id! as any,
        flow: "gasless",
        token_to_sell: from_token.name as any,
        token_to_buy: to_token.name as any,
        value:  args.amount_in,

    })

    return true
} 


export default function useSwapTransaction() {
    const swapTransactionMutation = useMutation({
        mutationFn: commitSwap
    })


    return swapTransactionMutation

}