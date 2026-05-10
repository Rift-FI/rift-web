import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import useGoogleAuth from "@/hooks/wallet/use-google-auth";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import TopProgressBar from "@/components/ui/top-progress-bar";

interface Props {
  redirectTo?: string;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

/**
 * Drop-in Google sign-in button.
 *
 * `<GoogleLogin>` renders an iframe-based button with Google's own border
 * and styling we can't reach into. To make this match Rift's visual language
 * we render two layers in the same box:
 *
 *   1. Below: a Rift-styled button (white pill, no border, soft shadow,
 *      Google logo, "Continue with Google"). Pointer events are disabled
 *      so it's purely cosmetic.
 *   2. Above: the real `<GoogleLogin>` iframe at `opacity: 0` and full
 *      width — this is what receives the click and triggers the popup.
 *
 * The user sees the clean Rift button; clicks go through to Google's iframe
 * button beneath the transparent overlay (browser still treats this as a
 * trusted user interaction, so the popup opens).
 *
 * While the post-popup mutation runs, swap the cosmetic content for a
 * spinner + "Signing in with Google…" so the user has feedback.
 */
export default function GoogleSignInButton({
  redirectTo = "/app",
  text = "continue_with",
}: Props) {
  const navigate = useNavigate();
  const { googleSignInMutation } = useGoogleAuth();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(360);

  const isLoading = googleSignInMutation.isPending;

  // Match the Google iframe's width to the wrapper so clicks anywhere on
  // the visible button area land on the iframe button.
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.min(
        Math.max(Math.round(el.getBoundingClientRect().width), 200),
        400
      );
      setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isLoading]);

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
    <div
      ref={wrapperRef}
      className="relative w-full h-12"
      aria-busy={isLoading}
    >
      {/* Page-wide progress strip across the very top of the viewport. */}
      <TopProgressBar visible={isLoading} />

      {/* Rift-styled button — visible to the user, no pointer events. */}
      <div
        className={`absolute inset-0 rounded-2xl bg-white shadow-sm flex items-center justify-center gap-3 select-none transition-shadow ${
          isLoading ? "opacity-70" : "hover:shadow-md"
        } pointer-events-none`}
        aria-hidden
      >
        {isLoading ? (
          <span className="text-[14px] font-semibold text-gray-900">
            Signing in with Google…
          </span>
        ) : (
          <>
            <GoogleIconSvg />
            <span className="text-[14px] font-semibold text-gray-900">
              Continue with Google
            </span>
          </>
        )}
      </div>

      {/* The real Google button — invisible, on top, captures the click. */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          isLoading ? "pointer-events-none" : ""
        }`}
        style={{ opacity: 0.001 }} // not 0 so the iframe still receives events
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() => toast.error("Google sign-in was cancelled or failed")}
          text={text}
          width={width}
          shape="rectangular"
          size="large"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}

const GoogleIconSvg = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
      fill="#4285F4"
    />
    <path
      d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.896.6-2.04.954-3.386.954-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20z"
      fill="#34A853"
    />
    <path
      d="M4.405 11.9A6.001 6.001 0 0 1 4.09 10c0-.66.114-1.301.315-1.9V5.51H1.064A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.341-2.59z"
      fill="#FBBC05"
    />
    <path
      d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.96.99 12.696 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.192 5.736 7.396 3.977 10 3.977z"
      fill="#EA4335"
    />
  </svg>
);
