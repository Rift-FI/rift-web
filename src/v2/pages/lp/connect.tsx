import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, UserRound, Wallet } from "lucide-react";
import { POST_LOGIN_REDIRECT_KEY } from "@/v2/pages/approvals/redirect";
import { lpPath } from "@/v2/lib/lpHost";
import { Button, SideSheet } from "@/v2/ui";
import { clearWalletSession, signInWithWallet, useInjectedWallets, type InjectedWallet } from "@/v2/lib/lp";

const STEP_COPY = {
  connect: "Approve the connection in your wallet…",
  sign: "Sign the message in your wallet. It costs nothing and moves no money.",
  verify: "Checking your signature…",
} as const;

/** Sign-in for LPs: an existing Rift account, or an external wallet signature. */
export function ConnectSheet({ open, onClose, onSignedIn }: { open: boolean; onClose: () => void; onSignedIn?: () => void }) {
  const navigate = useNavigate();
  const wallets = useInjectedWallets(open);
  const [busy, setBusy] = useState<string | null>(null);
  const [step, setStep] = useState<keyof typeof STEP_COPY | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRift = (() => {
    try {
      return !!localStorage.getItem("token");
    } catch {
      return false;
    }
  })();

  const connect = async (w: InjectedWallet) => {
    setBusy(w.id);
    setError(null);
    try {
      await signInWithWallet(w.provider, setStep);
      onSignedIn?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Sign-in failed. Try again.");
    } finally {
      setBusy(null);
      setStep(null);
    }
  };

  const useRift = () => {
    if (hasRift) {
      clearWalletSession();
      onSignedIn?.();
      onClose();
      return;
    }
    try {
      localStorage.setItem(POST_LOGIN_REDIRECT_KEY, lpPath("/"));
    } catch {
      /* ignore */
    }
    navigate("/auth");
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Sign in to Yield" description="Use your Rift account or a wallet you control." testId="lp-connect">
      <div className="space-y-6">
        <section aria-labelledby="lp-connect-wallet">
          <h3 id="lp-connect-wallet" className="mb-2 text-[13px] font-medium text-ink-2">
            Connect a wallet
          </h3>
          {wallets.length > 0 ? (
            <ul className="space-y-2">
              {wallets.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => connect(w)}
                    disabled={!!busy}
                    data-testid="lp-wallet-option"
                    className="flex w-full items-center gap-3 rounded-md border border-hairline bg-card px-4 py-3 text-left transition-colors hover:border-hairline-strong hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  >
                    {w.icon ? (
                      <img src={w.icon} alt="" aria-hidden="true" className="h-8 w-8 rounded-md" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-accent-primary">
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">{w.name}</span>
                    {busy === w.id && <Loader2 className="h-4 w-4 animate-spin text-ink-3" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-hairline-strong px-4 py-3 text-[13.5px] leading-relaxed text-ink-3" data-testid="lp-no-wallet">
              No browser wallet found. Open this page in your wallet app{"’"}s browser (MetaMask, Coinbase Wallet, Rainbow…) or install a wallet extension, then reload.
            </p>
          )}
          <p className="mt-2 text-[12.5px] text-ink-3">WalletConnect (scan a QR with your phone wallet) isn{"’"}t available here yet.</p>
          {step && (
            <p role="status" className="mt-3 text-[13px] text-ink-2">
              {STEP_COPY[step]}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
        </section>

        <div className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.12em] text-ink-3" aria-hidden="true">
          <span className="h-px flex-1 bg-hairline" />
          or
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <section aria-label="Rift account">
          <Button variant="secondary" size="lg" block onClick={useRift} data-testid="lp-use-rift">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {hasRift ? "Continue with my Rift account" : "Sign in with Rift"}
          </Button>
          <p className="mt-2 text-[12.5px] text-ink-3">Your Rift wallet becomes your LP wallet. You can deposit straight from your balance.</p>
        </section>
      </div>
    </SideSheet>
  );
}
