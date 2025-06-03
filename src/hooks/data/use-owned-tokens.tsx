import sphere from "@/lib/sphere";
import { WALLET_TOKENS } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";


async function getOwnedTokens() {
    // TODO: Make the request
    return WALLET_TOKENS
}

export default function  useOwnedTokens(){
    
    const query = useQuery({
        queryKey: ['owned-tokens'],
        queryFn: async () => {
            return getOwnedTokens()
        }
    })

    
    return query

}