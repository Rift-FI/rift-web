import { WALLET_TOKENS } from "@/lib/tokens"
import { useQuery } from "@tanstack/react-query"


interface TokenArgs {
    id?: string
}

async function getToken(args: TokenArgs){
    // TODO: Make request to the backend for tokens

    return WALLET_TOKENS?.at(0)
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


