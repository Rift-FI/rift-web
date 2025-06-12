import sphere from "@/lib/sphere"
import { sleep } from "@/lib/utils"
import Sphere, {
    Environment,
    LoginResponse,
    SignupResponse
} from "@stratosphere-network/wallet"
import { useMutation, useQuery } from "@tanstack/react-query"
import { init, useLaunchParams } from "@telegram-apps/sdk-react"

const TEST = import.meta.env.VITE_TEST == "true"
const ERROR_OUT = import.meta.env.VITE_ERROR_OUT == "true"
export interface sendOTP {
    phoneNumber: string
}
async function sendOTP(args: sendOTP){
    if (TEST || ERROR_OUT) {
        await sleep(1_000)
        if (ERROR_OUT) throw new Error("Testing Error handling");
        return true
    }
    const res = await sphere.auth.sendOtp({
        phone: args.phoneNumber
    })

    console.log("Response from send otp::", res)

    return true
}

export interface signInArgs {
    externalId: string
    otpCode: string
    phoneNumber?: string
}
async function signIn(args: signInArgs){
    if (TEST || ERROR_OUT) {
        await sleep(5_000)
        if (ERROR_OUT) throw new Error("Testing Error handling");
        return {
            address: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
        } as LoginResponse
    }
    const phoneNumber = args?.phoneNumber ?? localStorage.getItem('phoneNumber')
    if(!phoneNumber){
        throw new Error("No Phone Number Found")
    }
    const response = await sphere.auth.login({
        otpCode: args.otpCode,
        phoneNumber: phoneNumber?.replace('-', '')
    })
    sphere.auth.setBearerToken(response.accessToken)
  
    localStorage.setItem('token', response.accessToken)
    localStorage.setItem('address', response.address)
    localStorage.setItem('btc-address', response.btcAddress)

    return response
}

export interface signUpArgs {
    externalId: string,
    phoneNumber: string
}
async function signUpUser(args: signUpArgs){
    if (TEST || ERROR_OUT) {
        await sleep(5_000)
        if (ERROR_OUT) throw new Error("Testing Error handling");
        return {} as any as SignupResponse
    }
    localStorage.setItem('phoneNumber', args.phoneNumber?.replace('-', ''))
    localStorage.setItem('externalId', args.externalId)
    const response = await sphere.auth.signup({
        phoneNumber: args.phoneNumber
    })

    console.log("Response from sign up::", response)
    

    return response
}


export default function useWalletAuth(){
    const { platform, initData } = useLaunchParams()

    const signUpMutation = useMutation({
        mutationFn:signUpUser
    })

    const signInMutation = useMutation({
        mutationFn: signIn
    })

    const sendOTPMutation = useMutation({
        mutationFn: sendOTP,
        onError: console.log,
        onSuccess: (data, v) => console.log("Successfully sent otp ::", data)
    })

    const userQuery = useQuery({
        queryKey: ['user'], 
        queryFn: async ()=> {
            const user = await sphere.auth.getUser()
            return user
        },
        throwOnError: false,
        enabled: !!localStorage.getItem('token')
    })

    return {
        user: initData?.user,
        signUpMutation,
        signInMutation,
        sendOTPMutation,
        userQuery
    }
}