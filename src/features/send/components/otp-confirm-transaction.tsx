import useOTP from "@/hooks/data/use-otp";
import { useFlow } from "../known/flow-context";
import { ReactNode } from "react";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const otpSchema = z.object({
    code: z.string().length(6)
})

type OTP_SCHEMA = z.infer<typeof otpSchema>


interface OTPConfirmProps {
    render: () => ReactNode
}
export default function OTPConfirm(props: OTPConfirmProps){
    const { render } = props
    const flow = useFlow()
    const { requestOTPMutation, verifyOTPMutation } = useOTP()

    const { isOpen, onOpen, onClose, toggle } = useDisclosure()

    const form = useForm({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            code: ""
        }
    })


    const handleConfirm = async (values: OTP_SCHEMA) => {
        console.log("Values::",values)
        try {
            const isValid = await verifyOTPMutation.mutateAsync({
                otp: values.code
            })

            if (!isValid) {
                // TODO: toast to say otp invalid
                return
            }

            const state = flow.state?.getValues()

            if (!state) {
                return
            }

            flow.goToNext("processing") // navigate to processing then send the transaction
            // These are all expected to be defined at this point in the flow 
            flow.sendTransactionMutation!.mutate({
                amount: state.amount!,
                chain: state.chain!,
                recipient: state.recipient!,
                token: state.token!
            })


        } catch (e)
        {
            console.log("Error::", e)
            // TODO: handle error
        }
    }   

    const IS_CODE_VALID = form.watch("code")?.trim()?.length == 6
    


    return (
        <Drawer open={isOpen} onClose={onClose} onOpenChange={(open)=>{
            if(open) return onOpen();
            onClose()
        }} >
            <DrawerTrigger className="w-full" >
                {render()}
            </DrawerTrigger>
            <DrawerContent className="h-[30vh]" >
                <DrawerHeader>
                    <DrawerTitle/>
                </DrawerHeader>
                <Controller
                    control={form.control}
                    name="code" 
                    render={({field})=>{
                        return (
                            <div className="flex flex-col items-center justify-between w-full p-5 h-full gap-5" >
                                <p className="flex flex-row text-muted-foreground" >   
                                    We just sent you an OTP to confirm this transaction.
                                </p>

                                <div className="flex flex-col items-center w-full" >
                                    <InputOTP value={field.value} onChange={field.onChange} maxLength={6}  >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                <div className="flex flex-row items-center justify-center" >
                                    <button disabled={!IS_CODE_VALID} onClick={form.handleSubmit(handleConfirm)} className="flex flex-row items-center justify-center rounded-full px-2 py-2 flex-1 bg-accent-primary cursor-pointer active:scale-95" >
                                        <p className="font-semibold text-white" >
                                            Confirm
                                        </p>
                                        
                                    </button>
                                </div>
                            </div>
                        )
                    }}
                />
            </DrawerContent>
        </Drawer>
    )

}