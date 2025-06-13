import { ReactNode, useEffect } from "react";
import PageContainer from ".";
import BottomTabs from "../bottom-tabs";
import sphere from "@/lib/sphere";
import { useNavigate } from "react-router";

interface Props {
  children: ReactNode
}
export default function AuthenticatedShell(props: Props) {
  const { children } = props
  const navigate = useNavigate()
  useEffect(() => {
    const auth_token = localStorage.getItem('token')
    const address = localStorage.getItem('address')

    if (auth_token && address) {
      sphere.setBearerToken(auth_token)
    } else {
      navigate("/")
    }
  }, [])
  return (
    <div className="w-screen h-screen flex flex-col items-center bg-app-background relative" >
      <div className="flex flex-col w-full flex-1 " >
        {children}
      </div>
      <div className="flex flex-row items-center justify-center px-5 bg-surface-subtle/60 backdrop-blur-1xl w-full shadow-2xl shadow-surface-subtle fixed bottom-0 pb-5" >
        <BottomTabs />
      </div>
    </div>
  )
}