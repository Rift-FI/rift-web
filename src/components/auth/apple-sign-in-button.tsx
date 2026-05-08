import { useNavigate } from "react-router";
import AppleSignin from "react-apple-signin-auth";
import { toast } from "sonner";
import useAppleAuth from "@/hooks/wallet/use-apple-auth";
import { APPLE_CLIENT_ID, APPLE_REDIRECT_URI } from "@/constants";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";

interface Props {
  redirectTo?: string;
  // Optional override of the button's visual size.
  width?: number;
}

interface AppleAuthResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  // `user` is delivered ONLY on the user's first sign-in. After that Apple
  // returns the authorization block but no user details — that's by design.
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
}

/**
 * Drop-in "Sign in with Apple" button for the web. Uses Apple's official
 * JS SDK via the react-apple-signin-auth wrapper — popup mode, no redirect.
 *
 *   <AppleSignInButton redirectTo="/app" />
 */
export default function AppleSignInButton({
  redirectTo = "/app",
  width = 300,
}: Props) {
  const navigate = useNavigate();
  const { appleSignInMutation } = useAppleAuth();

  if (!APPLE_CLIENT_ID) {
    // Don't render a non-functional button — surface the misconfig at dev time.
    if (import.meta.env.MODE === "development") {
      console.warn(
        "[AppleSignInButton] VITE_APPLE_CLIENT_ID is not set; button hidden."
      );
    }
    return null;
  }

  return (
    <AppleSignin
      authOptions={{
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT_URI,
        state: "rift-signin",
        nonce: cryptoRandom(),
        usePopup: true,
      }}
      onSuccess={async (resp: AppleAuthResponse) => {
        const idToken = resp?.authorization?.id_token;
        if (!idToken) {
          toast.error("Apple sign-in failed: no ID token returned");
          return;
        }
        const first = resp?.user?.name?.firstName?.trim();
        const last = resp?.user?.name?.lastName?.trim();
        const displayName = [first, last].filter(Boolean).join(" ") || undefined;
        const referrer = localStorage.getItem("pending_referrer") || undefined;
        try {
          await appleSignInMutation.mutateAsync({ idToken, displayName, referrer });
          navigate(redirectTo);
        } catch (err) {
          RenderErrorToast(err as Error);
        }
      }}
      onError={(err: any) => {
        if (err?.error === "popup_closed_by_user") return; // user cancelled — silent
        toast.error("Apple sign-in failed");
      }}
      uiType="dark"
      buttonExtraChildren="Continue with Apple"
      // Sizing is controlled via CSS in Apple's button — width is approximate.
      style={{ width, borderRadius: 8 }}
    />
  );
}

// Small helper to give Apple a per-attempt nonce. The backend doesn't
// currently verify nonce (Apple's `verifyIdToken` ignores it unless we pass
// `nonce` in options), but populating it is required by Apple's spec and
// helps once we do enable nonce checking.
function cryptoRandom(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
