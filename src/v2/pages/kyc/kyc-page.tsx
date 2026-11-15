import { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { exchangeHandoff, parseHandoffHash } from "@/v2/lib/kycHandoff";
import { POST_LOGIN_REDIRECT_KEY } from "../approvals/redirect";

const KYCFlow = lazy(() => import("@/features/kyc"));

type State =
  | { kind: "loading" }
  | { kind: "ready"; returnTo?: string }
  | { kind: "done"; returnTo?: string }
  | { kind: "error"; message: string };

/**
 * /kyc — standalone identity verification.
 *  - From the phone app: /kyc#handoff=<code>&returnTo=rift://kyc-done. The
 *    code becomes a KYC-only token (memory only), and the page sends the
 *    user back to the app when they finish.
 *  - From the web (the backend's kycUrl): signed-in users verify here;
 *    others sign in first and come back.
 */
export default function KycPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const h = parseHandoffHash(window.location.hash);
    if (h) {
      // Drop the code from the address bar and history straight away.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      exchangeHandoff(h.code)
        .then(() => {
          queryClient.removeQueries({ queryKey: ["user"] });
          queryClient.removeQueries({ queryKey: ["kyc-status"] });
          setState({ kind: "ready", returnTo: h.returnTo });
        })
        .catch((e) => setState({ kind: "error", message: e?.message || "This verification link has expired. Start again from the app." }));
      return;
    }
    if (window.location.hash.includes("handoff=")) {
      setState({ kind: "error", message: "This verification link isn't valid. Start again from the app." });
      return;
    }
    if (!localStorage.getItem("token")) {
      try {
        localStorage.setItem(POST_LOGIN_REDIRECT_KEY, "/kyc");
      } catch {
        /* ignore */
      }
      navigate("/auth", { replace: true });
      return;
    }
    setState({ kind: "ready" });
  }, []);

  const finish = () => {
    queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    if (state.kind === "ready" && state.returnTo) {
      setState({ kind: "done", returnTo: state.returnTo });
      window.location.href = state.returnTo;
    } else navigate("/app", { replace: true });
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas" data-testid="kyc-page">
      <header className="flex h-14 items-center border-b border-hairline bg-card px-4 sm:px-6">
        <span className="flex items-center gap-2.5">
          <img src="/rift.png" alt="" className="h-7 w-7 rounded-md" />
          <span className="text-[15px] font-semibold text-ink">Verify your identity</span>
        </span>
      </header>
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-[560px] flex-col">
        {state.kind === "loading" && (
          <div className="flex flex-1 items-center justify-center text-ink-3">
            <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
          </div>
        )}
        {state.kind === "error" && (
          <p role="alert" className="m-6 rounded-xl bg-tint-danger px-4 py-3 text-[14px] text-danger" data-testid="kyc-error">
            {state.message}
          </p>
        )}
        {state.kind === "done" && (
          <div className="m-6 space-y-3 text-center" data-testid="kyc-done">
            <p className="text-[16px] font-semibold text-ink">You're done</p>
            <p className="text-[14px] text-ink-3">Go back to the Rift app to carry on.</p>
            <a href={state.returnTo} className="inline-block rounded-xl bg-accent-primary px-4 py-2.5 text-[14px] font-semibold text-white">
              Open Rift
            </a>
          </div>
        )}
        {state.kind === "ready" && (
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center text-ink-3">
                <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
              </div>
            }
          >
            <KYCFlow onComplete={finish} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
