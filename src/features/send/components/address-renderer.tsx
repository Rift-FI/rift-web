import { WalletAddress } from "@/lib/entities";
import formatAddress from "@/utils/address-formatter";
import { WalletIcon } from "lucide-react";

interface Props {
    address: WalletAddress
    onClick?:  (address: WalletAddress)=> void
}
export default function AddressRenderer(props: Props){
    const { address, onClick } = props

    return (
        <div onClick={()=> {
            onClick?.(address)
        }} className="flex flex-row items-center w-full cursor-pointer active:scale-95" >
            <div className="flex flex-row items-center gap-x-3" >
                <div className="p-2 rounded-full flex flex-row items-center justify-center bg-black" >
                    <WalletIcon
                        className="text-accent-foreground"
                    />
                </div>
                <div className="flex flex-col w-full" >
                    <p className="text-white font-semibold" >
                        {formatAddress(address?.address, address.chain)}
                    </p>    
                    <p className="text-xs" >
                        {/* TODO: transaction history with address e.g 2 previous transactions */}
                        {formatAddress(address?.address, address.chain)}
                    </p>
                </div>
            </div>

        </div>
    )

}