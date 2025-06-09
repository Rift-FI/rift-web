import sphere from "@/lib/sphere";
import { useMutation } from "@tanstack/react-query";


async function requestOTP(){
    return true;
    const phone = localStorage.getItem('phoneNumber')
    if (!phone) throw new Error("Unable to send otp code");
    await sphere.auth.sendOtp({
        phone
    })
    return true
}

interface VerifyOTPArgs {
    otp: string
}
async function verifyOTP(args: VerifyOTPArgs): Promise<boolean> {
    return true;
    const { otp } = args
    const phone = localStorage.getItem('phoneNumber')
    if (!phone) throw new Error("Unable to send otp code");
    const response = await sphere.auth.verifyOtp({
        code: otp,
        phone
    })
    console.log("Response::", response.status)

    return true // return false in case of invalid otp
}


export default function useOTP() {

    const requestOTPMutation = useMutation({
        mutationFn: async ( ) => {
            return requestOTP()
        }
    })

    const verifyOTPMutation = useMutation({ 
        mutationFn: async (args: VerifyOTPArgs) => {
            return verifyOTP(args)
        }
    })

    return {
        requestOTPMutation,
        verifyOTPMutation
    }
}