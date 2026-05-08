import { useMutation } from "@tanstack/react-query";
import { LoginResponse } from "@rift-finance/wallet";
import posthog from "posthog-js";
import rift from "@/lib/rift";

const TEST = import.meta.env.VITE_TEST == "true";
const ERROR_OUT = import.meta.env.VITE_ERROR_OUT == "true";

export interface AppleSignInArgs {
  idToken: string;
  // Composed first + last name. Apple only delivers it on the very first
  // sign-in (and only if name scope was requested), so the button captures
  // it from the credential and the hook forwards it once.
  displayName?: string;
  referrer?: string;
}

async function signInWithApple(args: AppleSignInArgs): Promise<LoginResponse> {
  if (TEST || ERROR_OUT) {
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return {
      address: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    } as LoginResponse;
  }

  const response = await rift.auth.loginWithApple({
    idToken: args.idToken,
    displayName: args.displayName,
    referrer: args.referrer,
  });

  rift.auth.setBearerToken(response.accessToken);
  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("address", response.address);

  try {
    const userResponse = await rift.auth.getUser();
    const user = userResponse?.user;
    posthog.identify(user?.email || user?.externalId || "apple_user", {
      email: user?.email,
      external_id: user?.externalId,
      address: response.address,
    });
    posthog.capture("SIGN_IN", { auth_method: "apple" });
  } catch {
    posthog.capture("SIGN_IN", { auth_method: "apple" });
  }

  return response;
}

/**
 * Wraps the SDK's Apple sign-in call as a react-query mutation. The actual
 * Apple credential flow lives in AppleSignInButton.
 */
export default function useAppleAuth() {
  const appleSignInMutation = useMutation({ mutationFn: signInWithApple });
  return { appleSignInMutation };
}
