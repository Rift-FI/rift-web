import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import ActionButton from "@/components/ui/action-button";
import { isPasskeyEnrolmentSupported } from "@/lib/webauthn";
import { fetchWalletStatus, setupPasskey, type SetupResult } from "@/lib/passkeyWallet";
import {
  chainLabel,
  mergeMigrationWithStatus,
  migrationProgress,
  type ChainMigration,
  type WalletStatus,
} from "@/lib/passkeyUtils";
import { shortenString } from "@/lib/utils";
import { WALLET_STATUS_KEY } from "@/hooks/wallet/use-wallet-status";

type Phase =
  | { kind: "intro" }
  | { kind: "working" }
  | { kind: "migrating"; walletAddress: string; chains: ChainMigration[] }
  | { kind: "done"; walletAddress: string; migrated: boolean }
  | { kind: "new_wallet"; walletAddress: string; previousAddress?: string };

const POLL_MS = 3000;

/**
 * "Secure your wallet with a passkey" — the mandatory first-passkey
 * screen (spec §4 Onboarding). Handles all three backend outcomes of
 * POST /v1/wallet/passkeys:
 *   - new wallet      → passkey-native Safe, done
 *   - legacy wallet   → same address, owner swapped per chain (progress)
 *   - unrecoverable   → a fresh wallet; old address shown as legacy
 */
export default function PasskeySetup(props: {
  status: WalletStatus | null | undefined;
  onDone: () => void;
}) {
  const { status, onDone } = props;
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [error, setError] = useState<string | null>(null);
  const isLegacy = status?.mode === "legacy";
  const supported = isPasskeyEnrolmentSupported();
  const pollRef = useRef<number | null>(null);

  const finish = async () => {
    await queryClient.invalidateQueries({ queryKey: WALLET_STATUS_KEY });
    onDone();
  };

  const start = async () => {
    setError(null);
    setPhase({ kind: "working" });
    try {
      const res: SetupResult = await setupPasskey();
      if (res.status === "migrating" || res.status === "migrated") {
        const p = migrationProgress(res.chains);
        if (res.status === "migrated" || p.complete) {
          setPhase({ kind: "done", walletAddress: res.walletAddress, migrated: true });
        } else {
          setPhase({ kind: "migrating", walletAddress: res.walletAddress, chains: res.chains });
        }
      } else if (res.status === "new_wallet") {
        setPhase({
          kind: "new_wallet",
          walletAddress: res.walletAddress,
          previousAddress: res.previousAddress ?? status?.previousAddress ?? status?.walletAddress ?? undefined,
        });
      } else {
        setPhase({ kind: "done", walletAddress: res.status === "active" ? res.walletAddress : "", migrated: false });
      }
    } catch (e: any) {
      setError(e?.message || "Passkey setup failed");
      setPhase({ kind: "intro" });
    }
  };

  // Poll /wallet/status while chains are still being migrated.
  useEffect(() => {
    if (phase.kind !== "migrating") return;
    pollRef.current = window.setInterval(async () => {
      const s = await fetchWalletStatus();
      setPhase((cur) => {
        if (cur.kind !== "migrating") return cur;
        const chains = mergeMigrationWithStatus(cur.chains, s);
        return migrationProgress(chains).complete
          ? { kind: "done", walletAddress: cur.walletAddress, migrated: true }
          : { ...cur, chains };
      });
    }, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [phase.kind]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8" data-testid="passkey-setup">
      {phase.kind === "intro" || phase.kind === "working" ? (
        <>
          <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
            <Fingerprint className="w-6 h-6 text-accent-primary" />
          </div>
          <h2 className="text-[20px] font-semibold text-text-default leading-tight">
            Secure your wallet with a passkey
          </h2>
          <p className="text-[14px] text-text-subtle mt-2 leading-relaxed">
            {isLegacy
              ? "Same wallet, same address — now protected by your passkey. Rift will never be able to move your funds."
              : "Your passkey is the only key to your wallet. Every payment is approved with Face ID, Touch ID or your device PIN — Rift can never move your funds."}
          </p>
          <ul className="mt-5 space-y-2 text-[13px] text-text-default">
            <li className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
              Stored on your device and synced by iCloud Keychain or Google Password Manager.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
              Add a second device or security key later in Settings → Security.
            </li>
          </ul>
          {error && (
            <div className="mt-5 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger" role="alert">
              {error}
            </div>
          )}
          {!supported && (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              This browser can't create passkeys. Open Rift in an up-to-date browser on your phone or computer.
            </div>
          )}
          <ActionButton
            className="mt-6"
            onClick={start}
            loading={phase.kind === "working"}
            disabled={!supported || phase.kind === "working"}
          >
            {phase.kind === "working" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for your passkey…
              </>
            ) : (
              "Create passkey"
            )}
          </ActionButton>
        </>
      ) : phase.kind === "migrating" ? (
        <MigrationProgress walletAddress={phase.walletAddress} chains={phase.chains} />
      ) : phase.kind === "new_wallet" ? (
        <>
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
            <CircleAlert className="w-6 h-6 text-amber-700" />
          </div>
          <h2 className="text-[20px] font-semibold text-text-default leading-tight">
            We created a new wallet for you
          </h2>
          <p className="text-[14px] text-text-subtle mt-2 leading-relaxed">
            Your previous wallet's key couldn't be recovered, so it can't be moved to passkey
            protection. Your new passkey wallet is ready to use.
          </p>
          <div className="mt-5 rounded-xl border border-gray-200 divide-y divide-gray-100 text-[13px]">
            <AddressRow label="New wallet" value={phase.walletAddress} />
            {phase.previousAddress && (
              <AddressRow label="Previous (legacy, unrecoverable)" value={phase.previousAddress} muted />
            )}
          </div>
          <ActionButton className="mt-6" onClick={finish}>
            Continue
          </ActionButton>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-success" />
          </div>
          <h2 className="text-[20px] font-semibold text-text-default leading-tight">
            Your wallet is protected
          </h2>
          <p className="text-[14px] text-text-subtle mt-2 leading-relaxed">
            {phase.migrated
              ? "Same wallet, same address — now protected by your passkey."
              : "Your passkey wallet is ready. You'll approve every transaction with it."}
          </p>
          {phase.walletAddress && (
            <div className="mt-5 rounded-xl border border-gray-200 text-[13px]">
              <AddressRow label="Wallet address" value={phase.walletAddress} />
            </div>
          )}
          <ActionButton className="mt-6" onClick={finish}>
            Continue
          </ActionButton>
        </>
      )}
    </div>
  );
}

function MigrationProgress({ walletAddress, chains }: { walletAddress: string; chains: ChainMigration[] }) {
  const p = migrationProgress(chains);
  return (
    <>
      <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
        <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
      </div>
      <h2 className="text-[20px] font-semibold text-text-default leading-tight">
        Upgrading your wallet
      </h2>
      <p className="text-[14px] text-text-subtle mt-2 leading-relaxed">
        Same wallet, same address — now protected by your passkey. We're switching
        ownership on each network ({p.done}/{p.total}).
      </p>
      <div className="mt-5 rounded-xl border border-gray-200 text-[13px]">
        <AddressRow label="Wallet address" value={walletAddress} />
      </div>
      <ul className="mt-4 rounded-xl border border-gray-200 divide-y divide-gray-100" aria-label="Migration progress">
        {chains.map((c) => (
          <li key={c.chainId} className="flex items-center justify-between px-3 py-2.5 text-[13px]">
            <span className="text-text-default">{chainLabel(c.chainId)}</span>
            <span
              className={
                c.status === "migrated"
                  ? "text-success font-medium"
                  : c.status === "failed"
                    ? "text-danger font-medium"
                    : "text-text-subtle"
              }
            >
              {c.status === "migrated"
                ? "Protected"
                : c.status === "failed"
                  ? "Needs attention"
                  : c.status === "skipped"
                    ? "Later"
                    : "Upgrading…"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] text-text-subtle">
        Other networks upgrade automatically the first time you use them.
      </p>
    </>
  );
}

function AddressRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-text-subtle">{label}</span>
      <span className={`font-mono ${muted ? "text-text-subtle" : "text-text-default"}`} title={value}>
        {shortenString(value)}
      </span>
    </div>
  );
}
