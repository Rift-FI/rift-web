import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useDisclosure } from "@/hooks/use-disclosure"
import { ReactNode, useEffect } from "react"
import { useFlow } from "./flow-context"
import formatAddress from "@/utils/address-formatter"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Copy } from "lucide-react"
import { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import useCreatePaymentLink from "@/hooks/data/use-payment-link"
import { CgSpinner } from "react-icons/cg"
import ActionButton from "@/components/ui/action-button"

const durationSchema = z.object({
    duration: z.enum(["30m", "1h", "2h"]),
    copied: z.enum(['copied', 'not-copied']),
    url: z.string()
})

type DURATION_SCHEMA = z.infer<typeof durationSchema>

interface CreatePaymentLinkProps {
    renderPaymentLink: () => ReactNode
}

export default function CreateLink(props: CreatePaymentLinkProps) {
    const { renderPaymentLink } = props
    const { isOpen, onClose, onOpen } = useDisclosure()
    const { state, closeAndReset } = useFlow()

    const form = useForm<DURATION_SCHEMA>({
        resolver: zodResolver(durationSchema),
        defaultValues: {
            duration: "30m",
            copied: 'not-copied',
            url: ''
        }
    })

    const { createPaymentLinkMutation } = useCreatePaymentLink()

    const stored = state?.getValues() ?? null
    const RECIPIENT = state?.getValues('recipient')
    const COPIED = form.watch('copied') == "copied"
    const DURATION = form.watch('duration')
    const URL = form.watch('url')

    const handleCopy = () => {
        if (URL) {
            window.navigator.clipboard.writeText(URL)
            form.setValue('copied', 'copied')
            setTimeout(() => {
                form.setValue('copied', 'not-copied')
            }, 1_000)
        }
    }

    useEffect(() => {
        if (isOpen) {
            createPaymentLinkMutation.mutate({
                chain: stored?.chain!,
                duration: DURATION,
                token: stored?.token!,
                recipient: stored?.recipient,
                amount: stored?.amount ?? "0",
                type: RECIPIENT == 'anonymous' ? 'open' : "specific"
            }, {
                onSuccess(data, variables, context) {
                    form.setValue('url', data.link)
                },
            })
        }
    }, [isOpen, DURATION])

    return (
        <Drawer open={isOpen} onClose={onClose} onOpenChange={(open) => {
            if (open) {
                onOpen()
            } else {
                onClose()
            }
        }} >
            <DrawerTrigger className="w-full" >
                {renderPaymentLink()}
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle className="hidden">Create Link</DrawerTitle>
                    <DrawerDescription className="hidden">Create a crypto collection link</DrawerDescription>
                </DrawerHeader>
                <div className="w-full flex flex-col items-center p-5 h-[30vh] gap-4 justify-between" >
                    <div className="flex flex-col items-center w-full gap-4" >
                        <div className="flex" >
                            {/* TODO: For cases where a telegram id was specified, I should probably default to using that instead */}
                            <p>
                                This link is claimable by <span className="font-semibold text-accent-secondary" >{RECIPIENT == 'anonymous' ? "anyone" : formatAddress(stored?.recipient ?? "")} </span>
                            </p>
                        </div>

                        <Controller
                            control={form.control}
                            name="duration"
                            render={({ field }) => {
                                return (
                                    <div className="flex flex-row items-center" >
                                        <RadioGroup value={field.value} onValueChange={field.onChange} defaultValue="30m" >
                                            <div className="flex flex-row items-center gap-2" >
                                                <RadioGroupPrimitive.Item value="30m" className="peer flex flex-row items-center bg-muted px-2 py-2 rounded-md cursor-pointer data-[state=checked]:ring data-[state=checked]:ring-accent-secondary " >

                                                    <p className="font-semibold" >
                                                        30 mins
                                                    </p>
                                                </RadioGroupPrimitive.Item>

                                                <RadioGroupPrimitive.Item value="1h" className="peer flex flex-row items-center bg-muted px-2 py-2 rounded-md cursor-pointer data-[state=checked]:ring data-[state=checked]:ring-accent-secondary " >

                                                    <p className="font-semibold" >
                                                        1 hr
                                                    </p>
                                                </RadioGroupPrimitive.Item>

                                                <RadioGroupPrimitive.Item value="2h" className="peer flex flex-row items-center bg-muted px-2 py-2 rounded-md cursor-pointer data-[state=checked]:ring data-[state=checked]:ring-accent-secondary " >

                                                    <p className="font-semibold" >
                                                        2 hrs
                                                    </p>
                                                </RadioGroupPrimitive.Item>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )
                            }}
                        />

                        <div className="flex flex-col items-center w-full" >
                            <Controller
                                control={form.control}
                                name="url"
                                render={({ field }) => {

                                    if (createPaymentLinkMutation?.isPending) {
                                        return (
                                            <div className="flex flex-row items-center py-2 px-2 gap-2 " >
                                                <CgSpinner className="text-accent-primary animate-spin" />  <p className="font-semibold text-white" >Creating...</p>
                                            </div>
                                        )
                                    }

                                    if (!field.value) {
                                        return (
                                            <div></div>
                                        )
                                    }
                                    return (
                                        <div onClick={handleCopy} className="flex flex-row items-center bg-black rounded-md overflow-hidden pl-2 max-w-1/2 group active:scale-95" >
                                            <p className="text-muted-foreground px-5 text-ellipsis line-clamp-1" >
                                                {field.value}
                                            </p>
                                            <div className="px-2 py-2 h-full items-center bg-accent-primary cursor-pointer " >
                                                <Copy />
                                            </div>
                                        </div>
                                    )
                                }}
                            />

                            {
                                COPIED && <div className="flex flex-row items-center gap-x-2 " >
                                    <Copy className="w-2 h-2 text-success" /> <p className="font-semibold text-sm text-success" >Copied!</p>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="w-full flex flex-col items-center justify-center" >
                        <ActionButton variant={"secondary"} onClick={closeAndReset} loading={createPaymentLinkMutation.isPending} size={"small"} >
                            Done
                        </ActionButton>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}


