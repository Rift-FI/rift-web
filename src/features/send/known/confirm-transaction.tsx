import { ChevronLeft } from "lucide-react";
import { useFlow } from "./flow-context";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import formatAddress from "@/utils/address-formatter";
import useChain from "@/hooks/data/use-chain";
import OTPConfirm from "../components/otp-confirm-transaction";
import CreateLink from "./create-link";


// TODO: confirm OTP component
export default function ConfirmTransaction(){
    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-5" >
            <div />
            <div className="w-full flex flex-col" >
                <RenderSummary/>
            </div>
             
            <div
                className="flex flex-col w-full items-center "
            >

                <div className="flex flex-row items-center justify-between w-full gap-5" >

                    <OTPConfirm
                        render={() => {
                            return (
                                <button className="w-full flex flex-row items-center justify-center rounded-full px-2 py-2 flex-1 bg-accent-primary cursor-pointer active:scale-95" >
                                    <p className="font-semibold text-white" >
                                        Confirm
                                    </p>

                                </button>
                            )
                        }}
                    />
                    
                    <CreateLink
                        renderPaymentLink={() => {
                            return (
                                <button className="w-full flex flex-row items-center justify-center rounded-full px-2 py-2 flex-1 bg-accent-primary cursor-pointer active:scale-95" >
                                    <p className="font-semibold text-white" >
                                        Link
                                    </p>

                                </button>
                            )
                        }}
                    />

                </div>

            </div>
        </div>
    )
}


function RenderSummary(){
    const flow = useFlow()
    const TOKEN = flow.state?.watch("token")
    const RECIPIENT = flow.state?.watch("recipient")
    const AMOUNT = flow.state?.watch("amount")
    const CHAIN = flow.state?.watch("chain")
    
    const { convertedAmount, geckoQuery } = useGeckoPrice({
        token: TOKEN,
        amount: parseFloat(AMOUNT ?? "0"),
        base: "usd" // TODO: add support for other currencies
    }) 

    const chainQuery = useChain({
        id: CHAIN ?? "1"
    })


    return (
        <div className="flex flex-col w-full rounded-xl bg-surface-alt p-5" >
            <div className="flex flex-row items-center justify-between" >
                <p className="text-muted-foreground" >
                    To
                </p>
                <p className="text-white font-semibold" >
                    {
                        formatAddress(RECIPIENT ?? "0x48383838")  // TODO: value has to be defined
                    }
                </p>
            </div>
            <div className="flex flex-row items-center justify-between" >
                <p className="text-muted-foreground" >
                    Network
                </p>
                <p className="text-white font-semibold" >
                    {
                        chainQuery?.data?.name ?? ""
                    }
                </p>
            </div>
            {/* <div className="flex flex-row items-center justify-between" >
                <p className="text-muted-foreground" >
                    Network Fee
                </p>
                
            </div> */}
        </div>
    )
}