import { WalletAddress } from "@/lib/entities"
import { isAddressValid } from "@/utils/address-verifier"
import { useQuery } from "@tanstack/react-query"

interface  SearchArgs {
    address: string,
    chain?: string
}


function findRecipient(args: SearchArgs){

    if(args.address?.includes("cool")) {
        return  {
            address: '0xf5efFda92b3Ca6FD3BDc9F4957d69F755006328C',
            chain: '8453',
            type: 'address'
        } as WalletAddress
    }

    const is_address = isAddressValid(args.address, args.chain)
    
    if(is_address) {
        return {
            address: args.address?.trim(),
            chain: args.chain,
            type: 'address'
        } satisfies WalletAddress
    }

    // 2. Check if it's a valid ens name

    // 3. Check if it's a valid telegram username

    // TODO: query the backend for the address
    return null
}

export default function useSearchRecipient(args: SearchArgs){
    const { address, chain } = args
    const query = useQuery({
        queryKey: ['address', address, chain],
        queryFn: async ()=> {
            return findRecipient(args)
        }
    })

    return query
}