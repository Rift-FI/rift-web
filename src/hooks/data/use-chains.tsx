import { WALLET_CHAINS } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";


async function getWalletChains() {
    // TODO: make request
    return WALLET_CHAINS
}


export default function useChains(){
    
    const query = useQuery({
        queryKey: ['chains'],
        queryFn: async ()=> {
            return getWalletChains()
        }
    })


    return query
}