

interface Props {
    message?: string
}
export default function RenderErrorToast(props: Props) {
    const { message } = props
    return (
        <div className='flex flex-row items-center justify-between gap-2 bg-popover px-4 py-3 rounded-md shadow'>
            
            <p className='text-sm text-danger text-center'>
                {message ?? "Something went wrong! Try again."}
            </p>
        </div>
    )
}