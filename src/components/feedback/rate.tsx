import React, { useEffect } from 'react'
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer'
import { StarIcon } from 'lucide-react'
import { RatingStars } from '../ui/RatingStars'
import z from "zod"
import { Controller, useForm } from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import { useDisclosure } from '@/hooks/use-disclosure'
import { toast } from 'sonner'
import { useLaunchParams } from '@telegram-apps/sdk-react'
import { submitRating } from '@/analytics/events'

const ratings = z.object({
    ratings: z.number().max(5)
})

type R = z.infer<typeof ratings>

function RenderThankYou(props: { rating: number }) {
    const { rating } = props
    const messages = [
    "Amazing! Thanks for your great feedback.",
    "Thanks! We're glad you had a positive experience.",
    "Thanks for your feedback! Glad you had a good time.",
    "Thanks! We'll keep improving.",
    "Thanks for your feedback. We're working to improve.",
]

    const message = rating > 4 ? messages[0] : rating > 3 ? messages[1] : rating > 2 ? messages[2] : rating > 1 ? messages[3] : messages[4]

    if(rating === 0) {
        return (
            <div></div>
        )
    }
    return (
        <div className='flex flex-col items-center justify-center gap-y-2 bg-popover px-4 py-3 rounded-md' >
            <p className='text-sm text-muted-foreground text-center' >
                {message}
            </p>
        </div>
    )


}

function Rate() {
    const { initData } = useLaunchParams()
    const { isOpen, onClose, toggle } = useDisclosure()
    const form = useForm<R>({
        resolver: zodResolver(ratings),
        defaultValues: {
            ratings: 0
        }
    })

    useEffect(()=>{
        const subscription = form.watch((values)=>{
            if((values.ratings ?? 0) > 0) {
                onClose()
                submitRating(initData?.user?.id?.toString(), values.ratings)
                toast.custom(()=> <RenderThankYou rating={values.ratings ?? 0} />, {
                    duration: 2000,
                    position: 'top-center'
                })
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [form])

    return (
        <Drawer modal open={isOpen} onOpenChange={toggle} >
            <DrawerTrigger>
                <div className='flex flex-row items-center justify-center cursor-pointer active:scale-95' >
                    <StarIcon size={16} />
                </div>
            </DrawerTrigger>
            <DrawerContent className='h-[40vh] bg-popover  z-1000 flex flex-col items-center gap-y-3' >
                <Controller control={form.control} name='ratings' render={({ field })=>{
                    return (
                        <div className='w-full h-full mx-auto max-w-sm' >
                            <div className='flex flex-col items-center justify-center px-2 py-4 gap-y-3 ' >
                                <p>
                                    Rate your experience using us so far.
                                </p>
                                <div className='flex flex-row items-center justify-center w-full' >
                                    <RatingStars value={field.value} onChange={field.onChange} />
                                </div>
                                <RenderThankYou rating={field.value} />
                            </div>
                        </div>
                    )
                }} />
            </DrawerContent>
        </Drawer>
    )
}

export default Rate