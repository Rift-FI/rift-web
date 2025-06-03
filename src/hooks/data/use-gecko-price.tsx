import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import COINGECKO_ID_MAPPING from "@/lib/coin-gecko-id-mapping";
import { useMemo } from "react";

type GeckoResponse  = Record<string,Record<string, number>>

interface PriceArgs {
    token?: string,
    base?: "usd" | "eth"
}

async function fetchGeckoPrice(args: PriceArgs) {
    // TODO: custom logic for sphere and other unlisted tokens

    const TOKEN_GECKO_ID = (()=> {
        // @ts-expect-error - cann't type all tokens yet so this will work for now
        const token = COINGECKO_ID_MAPPING[args.token ?? ""] 
        
        if(token) return token;
        return args.token
    })(); 
    
    const response = await axios.get<GeckoResponse>("https://pro-api.coingecko.com/api/v3/simple/price", {
        params: {
            ids: TOKEN_GECKO_ID,
            vs_currencies:  args.base, 
            "x_cg_pro_api_key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi"  // TODO: Move to env variables
        }
    })

    const gecko = response.data

    const baseValue = gecko?.[TOKEN_GECKO_ID][args?.base!] ?? 0

    return baseValue


}


export default function useGeckoPrice( args: PriceArgs & {amount?: number} ) {

    const { token, base = "usd", amount } = args 

    const query = useQuery({
        queryKey: ['gecko-price', token, base], 
        queryFn: async()=> {
            if(!token || !base) return 0;
            return fetchGeckoPrice({
                token,
                base
            })
        },
        enabled: !!token && !!base
    })

    const convertedAmount = useMemo(() => {
        if(!token || !base) return 0;
        if(!query.data) return 0;
        if(!amount) return 0;

        return amount * query.data

    }, [token, base, query.isLoading, query.data, amount])


    return {
        convertedAmount,
        geckoQuery: query
    }
    
}