import { getTokens } from "@/lib/assets/tokens"
import { WALLET_TOKENS } from "@/lib/tokens"
import { useQuery } from "@tanstack/react-query"


interface TokenArgs {
    id?: string,
    chain?: string
    name?: string,
    backend_id?: string
}

async function getToken(args: TokenArgs) {
    const token = await getTokens({
        id: args.id,
        name: args.name,
        chain: args.chain,
        backend_id: args.backend_id
    })

    return token?.at(0)
}


export default function useToken(args: TokenArgs) {

    const query = useQuery({
        queryKey: ['get-token', args.id],
        queryFn: async () => {
            return getToken(args)
        }
    })


    return query
}


