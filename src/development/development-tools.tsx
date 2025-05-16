import { useEffect } from "react"



export function DevelopmentTools(){
    useEffect(()=>{
        if(process.env.APP_ENV=="preview" || import.meta.env.MODE == "development"){
            document.body.removeAttribute('oncontextmenu')
        }
    }, [])
    return (
        <></>
    )
}