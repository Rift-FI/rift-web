import { useEffect } from "react"
import { useFlow } from "../context"
import sphere from "@/lib/sphere"
import { useNavigate } from "react-router"
import sphrLogo from "@/assets/images/icons/sphere.png"
import { CgSpinner } from "react-icons/cg"

export default function AuthCheck() {
    const flow = useFlow()
    const navigate = useNavigate()
    useEffect(()=>{
        const auth_token = localStorage.getItem('token')
        const address = localStorage.getItem('address')

        if(auth_token && address){
            sphere.setBearerToken(auth_token)
            navigate("/app")
        }else{
            flow.goToNext('start')
        }
    }, [])

    return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-2" >
            <img
                src={sphrLogo}
                className="w-[80px] h-[80px]"
            />
            <div className="flex flex-row items-center gap-2" >
                <p className="text-muted-foreground font-semibold" >
                    Initializing Sphere
                </p>
                <CgSpinner className="text-accent-secondary animate-spin" />
            </div>
        </div>
    )
}