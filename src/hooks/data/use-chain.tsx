import { WALLET_CHAINS } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";


interface ChainArgs {
    id: string
}

async function getWalletChain(args: ChainArgs) {
    // TODO: make request
    return WALLET_CHAINS?.at(0)!
}



export default function useChain(args: ChainArgs){
    const { id } = args
    
    const query = useQuery({
        queryKey: ['chain', args.id],
        queryFn: async ()=> {
            return getWalletChain(args)
        }
    })


    return query
}