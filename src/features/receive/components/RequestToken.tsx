import { useMemo } from "react"
import { useReceiveCrypto } from "../context"
import { TokenSketleton } from "@/v2/pages/home/components/TokenSketleton"
import TokenRenderer from "@/features/send/components/token-renderer"
import { WalletToken } from "@stratosphere-network/wallet"
import useTokens from "@/hooks/data/use-tokens"
import { MdKeyboardArrowLeft } from "react-icons/md"
import { SearchIcon } from "lucide-react"

export default function RequestToken() {
    const { switchCurrentStep, state } = useReceiveCrypto()
    const ownedTokensQuery = useTokens({});
    const searchFilter = state?.watch('searchfilter')

    const TOKENS = useMemo(() => {
        if (!searchFilter) return ownedTokensQuery?.data ?? ownedTokensQuery?.data ?? []
        if ((searchFilter?.trim().length ?? 0) == 0) return ownedTokensQuery?.data ?? ownedTokensQuery?.data ?? []
        const filtered = ownedTokensQuery?.data?.filter((token) => token.name.toLocaleLowerCase().includes(searchFilter.trim().toLocaleLowerCase()))
        return filtered ?? []
    }, [searchFilter, ownedTokensQuery?.isLoading, ownedTokensQuery?.data?.length])

    const goBack = () => {
        switchCurrentStep('MY-ADDRESS')
    }

    const handleTokenClick = (token: WalletToken) => {
        state?.setValue('requestToken', token.id)
        state?.setValue('requestTokenChain', token.chain_id)
        switchCurrentStep('TOKEN-AMOUNT')
    }

    return (
        <div>
            <button
                onClick={goBack}
                className="flex flex-row items-center justify-start p-1 pr-4 mb-2 rounded-full bg-secondary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
                <MdKeyboardArrowLeft className="text-2xl text-text-default" />
                <span className="text-sm font-bold">Go Back</span>
            </button>

            <p className="text-md font-semibold mt-4">Request Crypto</p>
            <p>Use a Sphere link to request crypto</p>

            <div className="w-full flex flex-row items-center gap-x-2 bg-black  rounded-md px-3 py-3 mt-2">
                <input className="flex bg-transparent border-none outline-none bg-none h-full text-white placeholder:text-white/75 flex-1" placeholder="Find a token" onChange={(e) => state?.setValue('searchfilter', e.target.value)} />
                <div className="cursor-pointer active:scale-95" >
                    <SearchIcon className="text-white" />
                </div>
            </div>

            <div className="space-y-2 mt-4">
                {ownedTokensQuery?.isFetching ?
                    <>
                        <TokenSketleton />
                        <TokenSketleton />
                        <TokenSketleton />
                    </> : (
                        TOKENS?.map((token) => (
                            <TokenRenderer
                                token={token}
                                key={`${token.backend_id}-${token.id}-${token.chain_id}`}
                                onClick={handleTokenClick}
                            />
                        ))
                    )}
            </div>
        </div>
    )
}