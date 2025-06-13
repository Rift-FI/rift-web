import { getTokens } from "@/lib/assets/tokens"
import sphere from "@/lib/sphere"
import { WALLET_TOKENS } from "@/lib/tokens"
import { useQuery } from "@tanstack/react-query"


interface TokenArgs {
    chain?: string,
    search?: string,
    swappable?: boolean
}

async function _getTokens(args: TokenArgs) {
    // TODO: Make request to the backend for tokens
    const response = await sphere.assets.getAllTokens()
    const token_list = response?.data?.map((d) => d.id)
    const tokens = await getTokens({
        list: token_list,
        chain: args.chain,
        description: args.search,
        swappable: args.swappable
    })
    return tokens
}


export default function useTokens(args: TokenArgs){
    
    const query = useQuery({
        queryKey: ['get-tokens', args.chain, args.search, args.swappable],
        queryFn: async () => {
            return _getTokens(args)
        }
    })


    return query
}


