import { getTokens } from "@/lib/assets/tokens";
import sphere from "@/lib/sphere";
import { WALLET_TOKENS } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";


async function getOwnedTokens() {
    const chainsResponse = await sphere.assets.getUserTokens()
    console.log("Chains response::", chainsResponse)
    const token_list = chainsResponse.data?.map((c) => c.id) ?? []
    const actual_tokens = await getTokens({
        base: true,
        list: token_list
    })
    return actual_tokens
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