import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import { ArrowLeft } from "lucide-react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import ActionButton from "@/components/ui/action-button";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { CgSpinner } from "react-icons/cg";

const codeSchema = z.object({
    code: z.string().max(4)
})

type CODE_SCHEMA = z.infer<typeof codeSchema>

interface Props {
    flow?: 'onboarding' | 'login'
}

export default function Code(props: Props){
    const { flow: flowType } = props
    const navigate = useNavigate()
    const flow = useFlow()
    const { initData } = useLaunchParams()
    const { sendOTPMutation } = useWalletAuth()
    const stored = flow.stateControl.getValues()
    const form = useForm<CODE_SCHEMA>({
        resolver: zodResolver(codeSchema),
        defaultValues: {
            code: stored?.code ?? ""
        }
    })

    const CODE = form.watch("code")
     
    const ENABLED = CODE.length == 4

    const handleSubmit = async (values: CODE_SCHEMA) => {
        const stored = flow.stateControl.getValues()
        flow.stateControl.setValue('code', values.code)

        if(values.code){
            
            if(!flow.signInMutation || !flow.signUpMutation) {
                return
            }

            if(flowType == "login") {
                try {
                    await flow.signInMutation.mutateAsync({
                        externalId: initData?.user?.id?.toString()!,
                        otpCode: values.code,
                        phoneNumber: stored.identifier!?.replace("-", "")
                    })
                    navigate("/app")
                } catch (e)
                {
                    console.log("Something went wrong::", e)
                    // TODO: handle error
                }
                
                return 
            }

            try {
                flow.goToNext()
                if(!initData?.user?.id){
                    throw new Error("No telegram user id found")
                }

                
                flow.signUpMutation.mutateAsync({
                    externalId: initData.user.id!?.toString(),
                    phoneNumber: stored.identifier!?.replace("-", "")
                })

                flow.signInMutation.mutate({
                    externalId: initData.user.id!?.toString(),
                    otpCode: values.code
                })

            } catch (e)
            {
                // TODO: handle error
            }
        }
    }

    const handleError = (error: any) => {
        console.log("Something went wrong ::", error)
    }

    const handleSendOTP = async () => {
        if(!stored.identifier || sendOTPMutation.isPending) return;
        try {

            await sendOTPMutation.mutateAsync({
                phoneNumber: stored.identifier!?.replace("-", "")
            })
        } catch (e)
        {
            // TODO: show toast
        }
    }

    return (
        <Controller
            control={form.control}
            name="code"
            render={({field})=> {
                return (
                    <div className="flex flex-col w-full h-full p-5 pb-10 items-center justify-between" >
                        <div/>
                        <div className="w-full h-4/5 flex flex-col gap-3 " >
                            <div className="flex flex-row items-center gap-4 cursor-pointer" onClick={()=>flow.gotBack()} >
                                <ArrowLeft/>
                                <p className="font-semibold text-2xl" >
                                    Verification Code 
                                </p>
                            </div>
                            
                            <p>
                                We&apos;ve sent you a verification code.
                            </p>
                            <div className="flex flex-row items-center w-full" >
                                <InputOTP value={field.value} onChange={field.onChange} maxLength={6}  >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <div className="flex flex-row items-center gap-x-1" >
                                <div className="flex flex-row items-center gap-1" >
                                    <p className="text-muted-foreground" >
                                        Didn&apos;t receive a code? 
                                    </p>
                                    <span onClick={handleSendOTP} className="font-semibold text-accent-secondary cursor-pointer active:scale-95" >Resend</span>
                                    {
                                        sendOTPMutation?.isPending && <CgSpinner className="text-sm text-accent-secondary animate-spin" />
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex flex-col items-center" >
                            <ActionButton disabled={!ENABLED} variant={'secondary'} loading={flowType == "login" && flow.signInMutation?.isPending} onClick={form.handleSubmit(handleSubmit, handleError)}  >
                                <p className=" text-white font-semibold text-xl" >
                                    Continue
                                </p>
                            </ActionButton>
                        </div>
                    </div>
                )
            }}
        />
    )
}