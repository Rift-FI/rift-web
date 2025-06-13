import { ReactNode } from "react"
import { UseFormReturn } from "react-hook-form"
import { TokenSchema } from "./token-input"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useDisclosure } from "@/hooks/use-disclosure"
import TokenSearch from "./token-search"
import FromTokenSelect from "./from-token-select"
import { useSwap } from "../swap-context"

interface TokenSelectProps {
    renderTrigger: () => ReactNode,
    position: "to" | "from"
}

export default function TokenSelect(props: TokenSelectProps){
    const { renderTrigger, position } = props
    const { isOpen, onClose, onOpen } = useDisclosure()
    const { state } = useSwap()
    const handleSelect = (args: {chain: string, token: string}) => { 
        state.setValue(
            position == "from" ? "from_token" : "to_token", args.token
        )

        state.setValue(
            position == "from" ? "from_chain" : "to_chain", args.chain
        )

        console.log("triggering close::")
        onClose()
    }

    return (
        <Drawer open={isOpen} onClose={onClose} onOpenChange={(open)=>{
            if(open){
                onOpen()
            }else{
                onClose()
            }
            
        }} >
            <DrawerTrigger>
                <>
                    {renderTrigger()}
                </>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle/>
                </DrawerHeader>
                <div className="w-full flex-flex-row h-[90vh] " >
                    {
                        position == "from" ? 
                        <FromTokenSelect onSelect={handleSelect} /> :
                        <TokenSearch onSelect={handleSelect} />
                    }
                </div>
            </DrawerContent>
        </Drawer>
    )
}