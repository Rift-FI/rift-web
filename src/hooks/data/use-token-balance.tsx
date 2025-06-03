import { Balance } from "@/lib/entities"
import { useQuery } from "@tanstack/react-query"


interface TokenBalanceArgs {
    chain?: string,
    token: string
}

async function getTokenBalance(args: TokenBalanceArgs): Promise<Balance>{
    // TODO: integrate with new backend endpoint for this usecase
    

    return {
        amount: 5,
        chain: '1',
        token: '0x4423222',
        usd: 60.3
    }

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