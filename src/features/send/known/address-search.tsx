import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import useSearchRecipient from "../hooks/use-search-recipient"
import { useFlow } from "./flow-context"
import { CgSpinner } from "react-icons/cg"
import { FiLink } from "react-icons/fi";
import AddressRenderer from "../components/address-renderer"
import { WalletAddress } from "@/lib/entities"
import { useEffect, useRef } from "react"
import { FaChevronRight } from "react-icons/fa6";

const search = z.object({
    searchInput: z.string()
})

type Search = z.infer<typeof search>

export default function AddressSearch() {
    const flowState = useFlow()
    const inputRef = useRef<HTMLInputElement | null>(null);
    const form = useForm<Search>({
        resolver: zodResolver(search),
        defaultValues: {
            searchInput: ''
        }
    })


    const address = form.watch("searchInput")
    const chain = flowState.state?.watch("chain")
    const token = flowState.state?.watch("token")
    const SEARCH_EMPTY = (address?.trim()?.length ?? 0) == 0

    useEffect(() => {
        if (token) {
            inputRef?.current?.blur()
        }
    }, [token])


    return (
        <div className="w-full flex flex-col items-center gap-2 px-5" >
            <Controller
                control={form.control}
                name="searchInput"
                render={({ field }) => {
                    return (
                        <div className="flex flex-row items-center w-full gap-x-2 bg-black rounded-md px-3 py-3" >
                            <input {...field} ref={inputRef} className="flex bg-transparent border-none outline-none h-full text-white placeholder:text-white/75 flex-1" placeholder="Address, ENS or Phone Number" />
                        </div>
                    )
                }}
            />

            <div className="flex flex-col w-full h-full" >
                {
                    SEARCH_EMPTY ? <PreviousAddresses /> : <AddressSearchResults
                        address={address}
                    />
                }

            </div>

            <div
                onClick={() => {
                    flowState.state?.setValue('recipient', 'anonymous');
                    flowState.goToNext('amount-input');
                }}
                className="absolute bottom-0 left-0 right-0 bg-surface-subtle flex flex-row flex-nowrap items-center justify-between gap-2 p-4 cursor-pointer">
                <p className="flex flex-col items-start justify-start text-md font-bold">
                    Sphere Open Links
                    <span className="text-md text-text-subtle font-medium">Create a Sphere open link that lets you send crypto to anyone</span>
                </p>
                <FaChevronRight />
            </div>
        </div>
    )
}


interface PreviousAddressesProps {

}

function PreviousAddresses() {
    return (
        <div className="w-full flex flex-col items-center h-full" >
            <p>
                No previous transactions
            </p>
        </div>
    )
}

interface AddressSearchResultsProps {
    address: string
}

function AddressSearchResults(props: AddressSearchResultsProps) {
    const { address } = props

    const flowState = useFlow()
    const chain = flowState.state?.watch("chain")

    const walletAddressQuery = useSearchRecipient({
        address,
        chain
    })

    function handleClick(address: WalletAddress) {
        flowState.state?.setValue('recipient', address.address)
        flowState.goToNext()
    }


    if (walletAddressQuery.isLoading) {
        return (
            <div className="flex flex-col gap-3 items-center w-full h-full" >
                <CgSpinner className="animate-spin text-accent-primary" />
            </div>
        )
    }

    if (!walletAddressQuery?.data) {
        return (
            <div className="flex flex-col items-center justify-center gap-x-3 w-full h-full" >
                <p className="font-semibold text-white" >
                    No matching address found
                </p>
            </div>
        )
    }


    return (
        <div className="flex flex-col w-full h-full" >
            <AddressRenderer
                address={walletAddressQuery?.data}
                onClick={handleClick}
            />
        </div>
    )

}   