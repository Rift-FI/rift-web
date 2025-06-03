import useChain from "@/hooks/data/use-chain"
import useTokenBalance from "@/hooks/data/use-token-balance"
import { WalletToken } from "@/lib/entities"

interface TokenRendererProps {
    token: WalletToken
    onClick?: (token: WalletToken) => void
}

export default function TokenRenderer(props: TokenRendererProps) {
    const { token, onClick } = props
    
    const balanceQuery = useTokenBalance({
        token: token.id,
        chain: token.chain_id
    })

    const chainQuery = useChain({
        id: token.chain_id
    })

    return (
        <div onClick={()=> {
            onClick?.(token)
        }} className="flex flex-row items-center justify-between px-4 py-3 rounded-md cursor-pointer active:scale-95 bg-surface-alt w-full" > 
            <div className="flex flex-row items-center gap-x-2" >
                {/* Token Icon */}
                <div className="flex flex-col items-center justify-center relative" >
                    <img
                        src={token.icon}
                        alt={token.name}
                        className="w-10 h-10" 
                    /> 

                    {chainQuery.data && 
                        <div className="flex flex-row items-center absolute bottom-[0px] right-[0px] w-5 h-5" >
                            <img
                                src={chainQuery.data.icon}
                                alt={chainQuery?.data?.name}
                                className=""
                            />
                        </div>
                    }

                </div>
                

                <div className="flex flex-col justify-center" >
                    <p className="font-semibold" > 
                        {token.name}
                    </p>
                    <p className="text-xs text-white/75" >
                        {balanceQuery?.data?.amount ?? 0 } {token.name}
                    </p>
                </div>
            </div>

            <div>
                <p className="font-semibold text-lg text-white" >
                    {
                        Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            currencyDisplay: 'symbol'
                        }).format(balanceQuery?.data?.amount ?? 0)
                    }
                </p>
            </div>


        </div>
    )
}