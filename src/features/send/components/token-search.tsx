import { zodResolver } from "@hookform/resolvers/zod"
import { SearchIcon } from "lucide-react"
import { useEffect, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useFlow } from "../known/flow-context"


const search = z.object({
    search: z.string()
})

type SearchForm = z.infer<typeof search>


interface Props {
    onSearch: (searchString: string) => void
    value?: string
}


export default function TokenSearch(props: Props) {
    const { onSearch, value } = props 
    const inputRef = useRef<HTMLInputElement | null>(null)
    const flow = useFlow()
    const searchForm = useForm<SearchForm>({
        resolver: zodResolver(search),
        defaultValues: {
            search: value ?? ''
        }
    })

    useEffect(()=> {
        const subscription = searchForm.watch((values)=>{
                onSearch(values.search ?? "")
        })

        return () => subscription.unsubscribe()
    }, [searchForm.watch])
    const token = flow.state?.watch("token")
    useEffect(() => {
        if (token) {
            inputRef.current?.blur()
        }
    }, [token])



    return (
        <Controller
            control={searchForm.control}
            name="search" 
            render={({ field, formState })=> {
                return (
                    <div className="w-full flex flex-row items-center gap-x-2 bg-black  rounded-md px-3 py-3" >
                        <input {...field} ref={inputRef} className="flex bg-transparent border-none outline-none bg-none h-full text-white placeholder:text-white/75 flex-1" placeholder="Token" />
                        <div className="cursor-pointer active:scale-95" >
                            <SearchIcon className="text-white" />
                        </div>
                    </div>
                )
            }}
        />
    )
}