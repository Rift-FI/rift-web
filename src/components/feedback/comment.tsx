import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { MessageCircleMore } from 'lucide-react'
import z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDisclosure } from '@/hooks/use-disclosure'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { submitFeedback } from '@/analytics/events'
import { useLaunchParams } from '@telegram-apps/sdk-react'

const commentSchema = z.object({
  comment: z.string().min(2, 'Please enter a comment').max(300, 'Comment too long')
})
type CommentForm = z.infer<typeof commentSchema>

function RenderThankYou() {
  return (
    <div className='flex flex-col items-center justify-center gap-y-2 bg-popover px-4 py-3 rounded-md'>
      <p className='text-sm text-muted-foreground text-center'>
        Thank you for your feedback!
      </p>
    </div>
  )
}

function Comment() {
  const { initData } = useLaunchParams()
  const { isOpen, onClose, toggle } = useDisclosure()
  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment: '' }
  })

  const onSubmit = (values: CommentForm) => {
    onClose()
    submitFeedback(initData?.user?.id?.toString(), values.comment)
    toast.custom(() => <RenderThankYou />, {
      duration: 2000,
      position: 'top-center'
    })
    form.reset()
  }

  return (
    <Drawer modal open={isOpen} onOpenChange={toggle}>
      <DrawerTrigger>
        <div className='flex flex-row items-center justify-center cursor-pointer active:scale-95'>
          <MessageCircleMore size={16} />
        </div>
      </DrawerTrigger>
      <DrawerContent className='h-[90vh] bg-popover z-1000 flex flex-col items-center gap-y-3'>
        <DrawerHeader>
          <DrawerTitle>Leave a Comment or Request a feature</DrawerTitle>
        </DrawerHeader>
        <form
          className='w-full max-w-sm flex flex-col items-center gap-y-3 px-4'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Controller
            control={form.control}
            name='comment'
            render={({ field, fieldState }) => (
              <div className='w-full'>
                <textarea
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px] resize-none'
                  placeholder='Share your thoughts...'
                  maxLength={300}
                  {...field}
                />
                {fieldState.error && (
                  <p className='text-xs text-red-500 mt-1'>{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <Button type='submit' className='w-full !bg-accent-secondary !text-white !font-semibold' disabled={form.formState.isSubmitting || !form.formState.isValid}>
            Submit
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export default Comment
