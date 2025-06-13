import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import TokenSearch from "../components/token-search"
import ChooseToken from "../components/choose-token"

const search = z.object({
    searchString: z.string()
})

type SearchForm = z.infer<typeof search>

export function SelectToken(){
    const form = useForm<SearchForm>({
        resolver: zodResolver(search),
        defaultValues: {
            searchString: ''
        }
    })


    return (
        <div className="flex flex-col w-full items-center px-5" >
            <Controller
                control={form.control}
                name="searchString"
                render={({field})=>{
                    return (
                        <div className="flex flex-col gap-3 w-full h-full" >
                            <TokenSearch
                                onSearch={field.onChange}
                                value={field.value}
                            />
                            <ChooseToken
                                searchFilter={field.value}
                            />
                        </div>
                    )
                }}
            />
        </div>
    )
}