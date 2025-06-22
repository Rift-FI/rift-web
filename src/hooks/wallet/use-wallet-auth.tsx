import sphere from "@/lib/sphere";
import { sleep } from "@/lib/utils";
import { LoginResponse, SignupResponse } from "@stratosphere-network/wallet";
import { useMutation, useQuery } from "@tanstack/react-query";

const TEST = import.meta.env.VITE_TEST == "true";
const ERROR_OUT = import.meta.env.VITE_ERROR_OUT == "true";
export interface sendOTP {
  phoneNumber?: string;
  email?: string;
}

async function sendOTP(args: sendOTP) {
  if (TEST || ERROR_OUT) {
    await sleep(1_000);
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return true;
  }

  if (!args.phoneNumber && !args.email) {
    throw new Error("Either phoneNumber or email is required");
  }

  const payload = args.phoneNumber
    ? { phone: args.phoneNumber }
    : { email: args.email! };

  const res = await sphere.auth.sendOtp(payload);

  console.log("Response from send otp::", res);

  return true;
}

export interface signInArgs {
  otpCode?: string;
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  password?: string;
}
async function signIn(args: signInArgs) {
  if (TEST || ERROR_OUT) {
    await sleep(5_000);
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return {
      address: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    } as LoginResponse;
  }

  let payload: any;

  if (args.externalId && args.password) {
    // Username/password login
    payload = {
      externalId: args.externalId,
      password: args.password,
    };
  } else if (args.otpCode) {
    // OTP login (phone or email)
    const identifier =
      args.phoneNumber ??
      args.email ??
      localStorage.getItem("phoneNumber") ??
      localStorage.getItem("email");
    if (!identifier) {
      throw new Error("No identifier found for OTP login");
    }

    payload = args.phoneNumber
      ? {
          otpCode: args.otpCode,
          phoneNumber: identifier.replace("-", ""),
        }
      : {
          otpCode: args.otpCode,
          email: identifier,
        };
  } else {
    throw new Error("Invalid login parameters");
  }

  const response = await sphere.auth.login(payload);
  sphere.auth.setBearerToken(response.accessToken);

  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("address", response.address);

  return response;
}

export interface signUpArgs {
  phoneNumber?: string;
  email?: string;
  externalId?: string;
  password?: string;
}
async function signUpUser(args: signUpArgs) {
  if (TEST || ERROR_OUT) {
    await sleep(5_000);
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return {} as any as SignupResponse;
  }

  let payload: any;

  if (args.externalId && args.password) {
    // Username/password signup
    payload = {
      externalId: args.externalId,
      password: args.password,
    };
  } else if (args.phoneNumber) {
    // Phone number signup
    payload = {
      phoneNumber: args.phoneNumber,
    };
  } else if (args.email) {
    // Email signup
    payload = {
      email: args.email,
    };
  } else {
    throw new Error("Invalid signup parameters");
  }

  const response = await sphere.auth.signup(payload);

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
