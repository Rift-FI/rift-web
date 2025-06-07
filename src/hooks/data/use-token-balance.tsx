import { getChains } from "@/lib/assets/chains"
import { getTokens } from "@/lib/assets/tokens"
import { Balance, WalletChain } from "@/lib/entities"
import sphere from "@/lib/sphere"
import { useQuery } from "@tanstack/react-query"


interface TokenBalanceArgs {
    chain?: string,
    token: string
}

async function getTokenBalance(args: TokenBalanceArgs): Promise<Balance>{

    const chain = (await getChains(args.chain)) as WalletChain | null
    if (!chain) return {
        amount: 0,
        chain: '1',
        token: '',
        usd: 0
    };

    const token = (await getTokens({
        id: args.token,
        chain: args.chain
    }))?.at(0)

    if (!token?.backend_id) return {
        amount: 0,
        chain: '1',
        token: '',
        usd: 0
    };

    const balanceResponse = await sphere.wallet.getTokenBalance({
        token: token.name as any,
        chain: chain.backend_id as any
    })

    const balance = balanceResponse?.data?.at(0) ?? {
        amount: 0,
        chain: '1',
        token: '',
        usd: 0
    }

    return balance

}

export default function useTokenBalance(args: TokenBalanceArgs){

    const query = useQuery({ 
        queryKey: ['token-balance', args.token, args.chain],
        queryFn: async () => {
            return getTokenBalance(args)
        }
    })

    return query
}