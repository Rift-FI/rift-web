/**
 * The invite landing page: `/premia?code=<code>`.
 *
 * This is the shape the backend's own seeding script prints, so the link in
 * someone's hand and the route that answers it are the same string. It is a
 * standalone public route rather than a param on a gated app route because
 * `validate` needs only the API key — so this page can tell a recipient their
 * link is good BEFORE asking them to sign in. On a gated route they would
 * bounce to /auth and lose the code.
 *
 * Sequence: validate the code → show the beta terms → on acceptance redeem
 * against the signed-in account → into Markets.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/v2/ui";
import { usePremiaAccess } from "@/v2/lib/premia/access";
import { explainReason, redeemCode, validateCode } from "@/v2/lib/premia/beta";
import { FEATURE_PREMIA } from "@/v2/lib/premia/flag";

type Phase = "checking" | "invalid" | "terms" | "redeeming" | "done";

export default function PremiaInvite() {
  const [params] = useSearchParams();
  // Sent as typed: the server matches case-, space- and hyphen-insensitively,
  // so normalising here would only risk disagreeing with it.
  const code = params.get("code") ?? "";
  const navigate = useNavigate();
  const { grant, hasAccess } = usePremiaAccess();
  const [phase, setPhase] = useState<Phase>("checking");
  const [reason, setReason] = useState<string>("");
  const [accepted, setAccepted] = useState(false);

  const signedIn = (() => {
    try {
      return !!localStorage.getItem("token");
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!FEATURE_PREMIA) {
        if (!cancel) {
          setPhase("invalid");
          setReason("This beta isn't open.");
        }
        return;
      }
      if (!code) {
        if (!cancel) {
          setPhase("invalid");
          setReason("This link is missing its invite code.");
        }
        return;
      }
      if (hasAccess) {
        if (!cancel) setPhase("done");
        return;
      }
      const res = await validateCode(code);
      if (cancel) return;
      if (res.valid) setPhase("terms");
      else {
        setPhase("invalid");
        setReason(explainReason(res.reason));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [code, hasAccess]);

  const accept = useCallback(async () => {
    setPhase("redeeming");
    try {
      const status = await redeemCode(code);
      grant(status);
      setPhase("done");
      navigate("/app/markets", { replace: true });
    } catch (e) {
      setPhase("terms");
      setReason((e as Error)?.message || "That invite could not be redeemed.");
    }
  }, [code, grant, navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col justify-center px-5 py-10">
      <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-accent-primary">PREMIA</p>

      {phase === "checking" && (
        <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your invite…
        </p>
      )}

      {phase === "invalid" && (
        <>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            This invite isn't valid
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">{reason}</p>
          <Link to="/app" className="mt-5 text-[13.5px] font-medium text-accent-primary hover:underline">
            Back to Rift
          </Link>
        </>
      )}

      {(phase === "terms" || phase === "redeeming") && (
        <>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            You're invited to the PREMIA beta
          </h1>

          {/*
            This is the consent moment. It replaces the standing disclosure
            line as the point where the user actually agrees, so it has to be
            unambiguous about what they are trading.
          */}
          <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink-2">
            <li>
              <span className="font-semibold text-ink">prmUSD is a test token with no monetary value.</span> You
              receive it free and it cannot be sold or exchanged.
            </li>
            <li>
              <span className="font-semibold text-ink">Positions are not redeemable</span> for cash, tokens or
              anything else. Any profit or loss is in prmUSD only.
            </li>
            <li>
              This is a beta on Base mainnet. The contracts and transactions are real; the money is not.
            </li>
          </ul>

          <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              data-testid="premia-accept-terms"
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--color-accent-solid)]"
            />
            I understand and accept the beta terms.
          </label>

          {!signedIn && (
            <p className="mt-3 text-[12.5px] leading-relaxed text-warning">
              Sign in to your Rift wallet first — your invite is kept.
            </p>
          )}

          <Button
            block
            size="lg"
            className="mt-4"
            disabled={!accepted || phase === "redeeming" || !signedIn}
            onClick={accept}
            data-testid="premia-redeem"
          >
            {phase === "redeeming" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Redeeming…
              </>
            ) : (
              "Join the beta"
            )}
          </Button>

          {reason && phase === "terms" && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-danger">{reason}</p>
          )}
        </>
      )}

      {phase === "done" && (
        <>
          <h1 className="mt-2 flex items-center gap-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            <Check className="h-5 w-5 text-success" /> You're in
          </h1>
          <Link to="/app/markets" className="mt-4">
            <Button block size="lg">
              Open Markets
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
