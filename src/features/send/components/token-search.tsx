import { zodResolver } from "@hookform/resolvers/zod"
import { SearchIcon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"


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
    }, [searchForm.watch])



    return (
        <Controller
            control={searchForm.control}
            name="search" 
            render={({ field, formState })=> {
                return (
                    <div className="w-full flex flex-row items-center gap-x-2 bg-black  rounded-md px-3 py-3" >
                        <input {...field} className="flex bg-transparent border-none outline-none bg-none h-full text-white placeholder:text-white/75 flex-1" placeholder="Token" />
                        <div className="cursor-pointer active:scale-95" >
                            <SearchIcon className="text-white" />
                        </div>
                    </div>
                )
            }}
        />
    )
}