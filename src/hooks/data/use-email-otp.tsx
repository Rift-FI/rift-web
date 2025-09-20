import rift from "@/lib/rift";
import { useMutation } from "@tanstack/react-query";
import useWalletAuth from "../wallet/use-wallet-auth";

async function requestEmailOTP(email: string) {
  if (!email) throw new Error("Unable to send email OTP code");
  await rift.auth.sendOtp({
    email: email,
  });
  return true;
}

interface VerifyEmailOTPArgs {
  otp: string;
}

async function verifyEmailOTP(
  email: string,
  args: VerifyEmailOTPArgs
): Promise<boolean> {
  const { otp } = args;
  if (!email) throw new Error("Unable to verify email OTP code");

  const response = await rift.auth.verifyOtp({
    code: otp,
    email: email,
  });

  console.log("Email OTP Response::", response.status);
  return true;
}

export default function useEmailOTP() {
  const { userQuery } = useWalletAuth();
  const userEmail = userQuery?.data?.email || localStorage.getItem("email");

  const requestEmailOTPMutation = useMutation({
    mutationFn: async () => {
      return requestEmailOTP(userEmail!);
    },
  });

  const verifyEmailOTPMutation = useMutation({
    mutationFn: async (args: VerifyEmailOTPArgs) => {
      return verifyEmailOTP(userEmail!, args);
    },
  });

  return {
    requestEmailOTPMutation,
    verifyEmailOTPMutation,
    userEmail,
  };
}
