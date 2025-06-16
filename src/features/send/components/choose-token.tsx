import useOwnedTokens from "@/hooks/data/use-owned-tokens"
import { WALLET_TOKENS } from "@/lib/tokens"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { FaSpinner } from "react-icons/fa6"
import { CgSpinner } from "react-icons/cg";
import { z } from "zod"
import TokenRenderer from "./token-renderer"
import { useFlow } from "../known/flow-context"
import { WalletToken } from "@/lib/entities"
import useWalletAuth from "@/hooks/wallet/use-wallet-auth"

const choice = z.object({
    id: z.string()
})

type ChoiceForm = z.infer<typeof choice>

interface Props {
    searchFilter?: string
}

export default function ChooseToken(props: Props){
    const { searchFilter } = props
    const { } = useWalletAuth()
    const flowControl = useFlow()
    const ownedTokensQuery = useOwnedTokens()

    const tokens = useMemo(() => {
        if(!searchFilter) return ownedTokensQuery?.data ?? ownedTokensQuery?.data ?? []
        if((searchFilter?.trim().length ?? 0) == 0) return ownedTokensQuery?.data ?? ownedTokensQuery?.data ?? []
        const filtered = ownedTokensQuery?.data?.filter((token)=>token.name.toLocaleLowerCase().includes(searchFilter.trim().toLocaleLowerCase()))
        return filtered ?? []
    }, [searchFilter, ownedTokensQuery?.isLoading, ownedTokensQuery?.data?.length, searchFilter?.length])

    function handleSelect(token: WalletToken) {
        flowControl.state?.setValue('token', token.id)
        flowControl.state?.setValue('chain', token.chain_id)
        flowControl.goToNext()
    }

    if (ownedTokensQuery?.isLoading) {
        return (
            <div className="flex flex-row items-center justify-center w-full h-full" >
                <CgSpinner className="animate-spin text-accent-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full h-[80vh] items-center py-4 gap-y-2 overflow-y-scroll" >
            {
                tokens?.map((token, i) => {
                    return <TokenRenderer
                        token={token}
                        key={i}
                        onClick={handleSelect}
                    />
                } )
            }
        </div>
    )
}