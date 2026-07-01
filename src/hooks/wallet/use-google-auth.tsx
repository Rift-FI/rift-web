import { useMutation } from "@tanstack/react-query";
import { LoginResponse } from "@rift-finance/wallet";
import posthog from "posthog-js";
import rift from "@/lib/rift";
import {
  nonCustodialConfig,
  maybeMigrateToV3,
  decodeOidcMethodFromIdToken,
} from "@/lib/nonCustodial";

const TEST = import.meta.env.VITE_TEST == "true";
const ERROR_OUT = import.meta.env.VITE_ERROR_OUT == "true";

export interface GoogleSignInArgs {
  idToken: string;
  referrer?: string;
}

async function signInWithGoogle(args: GoogleSignInArgs): Promise<LoginResponse> {
  if (TEST || ERROR_OUT) {
    if (ERROR_OUT) throw new Error("Testing Error handling");
    return {
      address: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    } as LoginResponse;
  }

  const response = await rift.auth.loginWithGoogle({
    idToken: args.idToken,
    referrer: args.referrer,
  });

  rift.auth.setBearerToken(response.accessToken);
  // Phase-2 backend renamed the smart-account address field to
  // `evmAddress`. See use-wallet-auth.tsx for the same shim.
  const evmAddress =
    (response as any).evmAddress ?? (response as any).address ?? "";
  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("address", evmAddress);

  // Sandbox / non-custodial builds: opportunistically upgrade the
  // envelope to v3 whenever the user signs in via Google. Idempotent —
  // no-op if the envelope is already v3.
  const nc = nonCustodialConfig();
  if (nc.enabled) {
    // Google popup consumed the user activation window — we can't
    // enrol a passkey inline. Pass the id_token as an additional OIDC
    // method so the backend can seal v3 without a passkey. The setup
    // gate (V3EnrolmentBanner) will still fire on next render if the
    // migration produces anything less than a full v3 envelope,
    // letting the user click through Touch ID with a fresh gesture.
    const oidcMethod = decodeOidcMethodFromIdToken(
      args.idToken,
      "https://accounts.google.com"
    );
    await maybeMigrateToV3({
      accessToken: response.accessToken,
      userLabel: "google-user",
      rpId: nc.passkeyRpId,
      rpName: nc.passkeyRpName,
      activationHint: "stale",
      additionalMethods: oidcMethod ? [oidcMethod] : [],
    });
  }

  try {
    const userResponse = await rift.auth.getUser();
    const user = userResponse?.user;
    posthog.identify(user?.email || user?.externalId || "google_user", {
      email: user?.email,
      external_id: user?.externalId,
      address: evmAddress,
    });
    posthog.capture("SIGN_IN", { auth_method: "google" });
  } catch {
    posthog.capture("SIGN_IN", { auth_method: "google" });
  }

  return response;
}

/**
 * Wraps the SDK's Google sign-in call as a react-query mutation. The actual
 * Google credential flow (popping the account picker, getting the ID token)
 * lives in the GoogleSignInButton component — this hook just runs the
 * resulting token through the SDK and persists session state.
 */
export default function useGoogleAuth() {
  const googleSignInMutation = useMutation({ mutationFn: signInWithGoogle });
  return { googleSignInMutation };
}
