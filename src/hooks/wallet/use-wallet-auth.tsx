import { useEffect } from "react";
import rift from "@/lib/rift";
import { sleep } from "@/lib/utils";
import { LoginResponse, SignupResponse } from "@rift-finance/wallet";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import {
  enrolPasskey,
  isPlatformAuthenticatorAvailable,
  type EnrolledMethod,
} from "@/lib/webauthn";
import { nonCustodialConfig, maybeMigrateToV3 } from "@/lib/nonCustodial";


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

  const res = await rift.auth.sendOtp(payload);

  

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const response = await rift.auth.login(payload);
  rift.auth.setBearerToken(response.accessToken);

  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("address", response.address);

  // Non-custodial sandbox builds: after every sign-in, opportunistically
  // upgrade the user's envelope to v3. Idempotent — backend returns
  // alreadyMigrated:true for v3 wallets (fresh signups, repeat signins).
  // Failure here doesn't block sign-in: the user lands on the app with
  // their existing custodial wallet and gets prompted again next time.
  const nc = nonCustodialConfig();
  if (nc.enabled) {
    const userLabel =
      args.externalId || args.phoneNumber || args.email || "rift-user";
    await maybeMigrateToV3({
      accessToken: response.accessToken,
      userLabel,
      rpId: nc.passkeyRpId,
      rpName: nc.passkeyRpName,
    });
  }

  // Identify user for analytics after successful login
  try {
    const userResponse = await rift.auth.getUser();
    const user = userResponse?.user;
    
    // Track sign in
    const authMethod = args.externalId && args.password 
      ? "username_password" 
      : args.phoneNumber 
      ? "phone_otp" 
      : args.email 
      ? "email_otp" 
      : "unknown";
    
    posthog.identify(user?.externalId || user?.email || user?.phoneNumber || args.externalId || "unknown", {
      email: user?.email,
      phone: user?.phoneNumber,
      external_id: user?.externalId,
      telegram_id: user?.telegramId,
      address: response.address,
    });
    
    posthog.capture("SIGN_IN", {
      auth_method: authMethod,
      has_email: !!user?.email,
      has_phone: !!user?.phoneNumber,
      has_external_id: !!user?.externalId,
      telegram_id: user?.telegramId || null,
    });
  } catch {
    // If we can't get user data, still identify with what we have
    const identifier = args.externalId || args.phoneNumber || args.email || "unknown";
    posthog.identify(identifier);
    posthog.capture("SIGN_IN", {
      auth_method: args.externalId ? "username_password" : args.phoneNumber ? "phone_otp" : "email_otp",
    });
  }

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
    return {} as unknown as SignupResponse;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Non-custodial sandbox builds: enrol a platform passkey and attach
  // it to the signup payload. Backend forwards `enrolledMethods` to the
  // enclave which seals the new EOA key in an `enc:v3:` envelope. From
  // that point on every signing op needs an authProof bound to the
  // user_op_hash. Failure to enrol falls back to v1 custodial flow — we
  // don't want to block signup on a flaky biometric prompt.
  const { enabled: nonCustodial, passkeyRpId, passkeyRpName } =
    nonCustodialConfig();
  if (nonCustodial) {
    try {
      const supported = await isPlatformAuthenticatorAvailable();
      if (supported) {
        const userLabel =
          args.externalId || args.phoneNumber || args.email || "rift-user";
        const { method } = await enrolPasskey({
          rpId: passkeyRpId,
          rpName: passkeyRpName,
          userName: userLabel,
        });
        const methods: EnrolledMethod[] = [method];
        (payload as Record<string, unknown>).enrolledMethods = methods;
      }
    } catch (err) {
      console.warn(
        "[rift] passkey enrol skipped — falling back to v1 custodial",
        err
      );
    }
  }

  const response = await rift.auth.signup(payload);

  // Track sign up
  const signupMethod = args.externalId && args.password 
    ? "username_password" 
    : args.phoneNumber 
    ? "phone_otp" 
    : args.email 
    ? "email_otp" 
    : "unknown";
  
  const identifier = response?.userId || args.externalId || args.phoneNumber || args.email || "unknown";
  
  posthog.identify(identifier, {
    email: args.email || null,
    phone: args.phoneNumber || null,
    external_id: args.externalId || null,
    telegram_id: response?.userId || null,
  });
  
  posthog.capture("SIGN_UP", {
    auth_method: signupMethod,
    has_email: !!args.email,
    has_phone: !!args.phoneNumber,
    has_external_id: !!args.externalId,
    telegram_id: response?.userId || null,
  });

  return response;
}

async function getUser() {
  const response = await rift.auth.getUser();
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
    onSuccess: () => {},
  });

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    throwOnError: false,
    enabled: !!localStorage.getItem("token"),
  });

  // Identify user for analytics when user data is successfully fetched
  // This handles cases where user is already logged in and app restarts
  useEffect(() => {
    if (userQuery.data) {
      const userData = userQuery.data;
      const identifier = userData.externalId || userData.email || userData.phoneNumber || "unknown";
      
      posthog.identify(identifier, {
        email: userData.email,
        phone: userData.phoneNumber,
        external_id: userData.externalId,
        telegram_id: userData.telegramId,
        address: userData.address,
        display_name: userData.displayName || userData.display_name,
        has_payment_account: !!(userData.paymentAccount || userData.payment_account),
        created_at: userData.createdAt,
      });
    }
  }, [userQuery.data]);

  return {
    user: rift?.auth?.isAuthenticated(),
    signUpMutation,
    signInMutation,
    sendOTPMutation,
    userQuery,
  };
}
