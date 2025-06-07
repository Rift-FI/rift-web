import { getTokens } from "@/lib/assets/tokens"
import { WALLET_TOKENS } from "@/lib/tokens"
import { useQuery } from "@tanstack/react-query"


interface TokenArgs {
    id?: string,
    chain?: string
}

async function getToken(args: TokenArgs){
    const token = await getTokens({
        id: args.id,
        chain: args.chain
    })

    return token?.at(0)
}


export default function useToken(args: TokenArgs){
    
    const query = useQuery({
        queryKey: ['get-token', args.id],
        queryFn: async () => {
            return getToken(args)
        }
    })


    return query
}


