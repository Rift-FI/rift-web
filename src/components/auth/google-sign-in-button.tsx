import { useNavigate } from "react-router";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import useGoogleAuth from "@/hooks/wallet/use-google-auth";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";

interface Props {
  // Where to send the user once Google sign-in succeeds. Defaults to /app.
  redirectTo?: string;
  // Optional override for the Google button styling/label.
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
}

/**
 * Drop-in Google sign-in button. Uses Google's One-Tap "credential" flow,
 * which returns a verified ID token directly to the client — no extra
 * round-trips to Google's userinfo endpoint required.
 *
 *   <GoogleSignInButton text="continue_with" />
 */
export default function GoogleSignInButton({
  redirectTo = "/app",
  text = "continue_with",
  width = 300,
}: Props) {
  const navigate = useNavigate();
  const { googleSignInMutation } = useGoogleAuth();

  const onSuccess = async (resp: CredentialResponse) => {
    if (!resp.credential) {
      toast.error("Google sign-in failed: no credential returned");
      return;
    }
    const referrer = localStorage.getItem("pending_referrer") || undefined;
    try {
      await googleSignInMutation.mutateAsync({
        idToken: resp.credential,
        referrer,
      });
      navigate(redirectTo);
    } catch (err) {
      RenderErrorToast(err as Error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={() => toast.error("Google sign-in was cancelled or failed")}
      text={text}
      width={width}
      // useOneTap is intentionally off — we want explicit user interaction.
    />
  );
}
