import sphere from "@/lib/sphere";
import { sleep } from "@/lib/utils";
import { LoginResponse, SignupResponse } from "@stratosphere-network/wallet";
import { useMutation, useQuery } from "@tanstack/react-query";

const TEST = import.meta.env.VITE_TEST == "true";
const ERROR_OUT = import.meta.env.VITE_ERROR_OUT == "true";
export interface sendOTP {
  phoneNumber: string;
}

async function sendOTP(args: sendOTP) {
  if (TEST || ERROR_OUT) {
    await sleep(1_000);
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return true;
  }
  const res = await sphere.auth.sendOtp({
    phone: args.phoneNumber,
  });

  console.log("Response from send otp::", res);

  return true;
}

export interface signInArgs {
  otpCode: string;
  phoneNumber?: string;
}
async function signIn(args: signInArgs) {
  if (TEST || ERROR_OUT) {
    await sleep(5_000);
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return {
      address: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    } as LoginResponse;
  }
  const phoneNumber = args?.phoneNumber ?? localStorage.getItem("phoneNumber");
  if (!phoneNumber) {
    throw new Error("No Phone Number Found");
  }
  const response = await sphere.auth.login({
    otpCode: args.otpCode,
    phoneNumber: phoneNumber?.replace("-", ""),
  });
  sphere.auth.setBearerToken(response.accessToken);

  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("address", response.address);

  return response;
}

export interface signUpArgs {
  phoneNumber: string;
}
async function signUpUser(args: signUpArgs) {
  if (TEST || ERROR_OUT) {
    await sleep(5_000);
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return {} as any as SignupResponse;
  }

  const response = await sphere.auth.signup({
    phoneNumber: args.phoneNumber,
  });

  console.log("Response from sign up::", response);

  return response;
}

async function getUser() {
  const response = await sphere.auth.getUser();
  const user = response.user ?? null;

  return user;
}

export default function useWalletAuth() {
  const signUpMutation = useMutation({
    mutationFn: signUpUser,
  });

  const signInMutation = useMutation({
    mutationFn: signIn,
  });

  const sendOTPMutation = useMutation({
    mutationFn: sendOTP,
    onError: console.log,
    onSuccess: (data, v) => console.log("Successfully sent otp ::", data),
  });

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    throwOnError: false,
    enabled: !!localStorage.getItem("token"),
  });

  return {
    user: sphere?.auth?.isAuthenticated(),
    signUpMutation,
    signInMutation,
    sendOTPMutation,
    userQuery,
  };
}
