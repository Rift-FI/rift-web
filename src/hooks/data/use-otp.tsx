import { useMutation } from "@tanstack/react-query";



async function requestOTP(){
    // TODO: make call to backend
    // do some fancy stuff
    // TODO: also save when the last otp was sent for otp countdown
}

interface VerifyOTPArgs {
    otp: string
}
async function verifyOTP(args: VerifyOTPArgs): Promise<boolean> {
    const { otp } = args
    // TODO: verify otp
    // do some fancy shinanigans

    return true // return false in case of invalid otp
}


export default function useOTP() {
    
    // TODO: get user identifier

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