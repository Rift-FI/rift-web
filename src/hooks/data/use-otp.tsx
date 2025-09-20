import rift from "@/lib/rift";
import { useMutation } from "@tanstack/react-query";
import useWalletAuth from "../wallet/use-wallet-auth";

async function requestOTP(phoneNumber: string) {
  if (!phoneNumber) throw new Error("Unable to send otp code");
  await rift.auth.sendOtp({
    phone: phoneNumber,
  });
  return true;
}

interface VerifyOTPArgs {
  otp: string;
}
async function verifyOTP(
  phoneNumber: string,
  args: VerifyOTPArgs
): Promise<boolean> {
  const { otp } = args;
  if (!phoneNumber) throw new Error("Unable to send otp code");
  const response = await rift.auth.verifyOtp({
    code: otp,
    phone: phoneNumber,
  });
  console.log("Response::", response.status);

  return true;
}

export default function useOTP() {
  const { userQuery } = useWalletAuth();
  const userPhone = userQuery?.data?.phoneNumber;

  const requestOTPMutation = useMutation({
    mutationFn: async () => {
      return requestOTP(userPhone!);
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async (args: VerifyOTPArgs) => {
      return verifyOTP(userPhone!, args);
    },
  });

  return {
    requestOTPMutation,
    verifyOTPMutation,
  };
}
