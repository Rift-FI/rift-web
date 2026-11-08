import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, Fingerprint, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import ActionButton from "@/components/ui/action-button";
import { addPasskey, listPasskeys, removePasskey, type PasskeyRecord } from "@/lib/passkeyWallet";
import { WALLET_STATUS_KEY } from "@/hooks/wallet/use-wallet-status";

const PASSKEYS_KEY = ["wallet", "passkeys"] as const;

/**
 * Settings → Security → Passkeys (spec §4 recovery screen).
 *
 * Every passkey here is an owner of the user's Safe. Adding one registers
 * the new credential (this device, another device via the browser's
 * cross-device QR, or a security key) and then approves the add-owner op
 * on each deployed chain with a passkey the wallet already has. Removing
 * one is approved by a remaining passkey; the last one can't be removed.
 */
export default function Passkeys() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: PASSKEYS_KEY,
    queryFn: listPasskeys,
    retry: false,
  });
  const passkeys = (data ?? []).filter((p) => !p.status || p.status === "active");
  const pending = (data ?? []).filter((p) => p.status === "pending");
  const [adding, setAdding] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PasskeyRecord | null>(null);
  const onlyOne = passkeys.length <= 1;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY });
    queryClient.invalidateQueries({ queryKey: WALLET_STATUS_KEY });
  };

  const onAdd = async () => {
    if (adding) return;
    setAdding("Waiting for the new passkey…");
    try {
      await addPasskey({
        existing: passkeys,
        onStep: (step, d) =>
          setAdding(
            step === "register"
              ? "Waiting for the new passkey…"
              : step === "approve"
                ? `Approve with an existing passkey${d && d.total > 1 ? ` (${d.index + 1}/${d.total})` : ""}…`
                : "Finishing…"
          ),
      });
      toast.success("Passkey added");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't add passkey");
      refresh();
    } finally {
      setAdding(null);
    }
  };

  const onRemove = async (p: PasskeyRecord) => {
    setConfirmRemove(null);
    if (onlyOne) {
      toast.error("You can't remove your only passkey. Add another passkey first.");
      return;
    }
    setRemovingId(p.id);
    try {
      await removePasskey(p, passkeys);
      toast.success("Passkey removed");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't remove passkey");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full flex flex-col bg-app-background"
    >
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-subtle rounded-lg" aria-label="Back">
          <ChevronLeft className="w-5 h-5 text-text-default" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-subtle">Security</p>
          <h2 className="text-lg font-semibold text-text-default leading-tight">Passkeys</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-[13px] text-text-subtle leading-relaxed">
            Passkeys are the only keys to your wallet. Any of them can approve transactions. Rift
            can't move your funds or recover them for you — keep at least two.
          </p>

          {!isLoading && onlyOne && passkeys.length === 1 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex gap-3" role="status" data-testid="single-passkey-warning">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] leading-snug text-amber-900">
                You have only one passkey. If you lose this device and it isn't synced, you'll lose
                access to your wallet. Add a passkey on another device or a security key.
              </p>
            </div>
          )}

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="py-8 flex justify-center text-text-subtle text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-sm text-danger">{(error as Error).message || "Couldn't load passkeys"}</p>
            ) : passkeys.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-subtle">No passkeys yet.</p>
            ) : (
              <ul aria-label="Passkeys">
                {passkeys.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-b-0" data-testid="passkey-row">
                    <div className="w-9 h-9 rounded-md border border-border bg-surface-subtle flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-accent-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-default truncate">{p.label || "Passkey"}</p>
                      <p className="text-xs text-text-subtle">
                        Added {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                        {p.lastUsedAt ? ` · Last used ${new Date(p.lastUsedAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmRemove(p)}
                      disabled={!!removingId || !!adding}
                      title={onlyOne ? "You can't remove your only passkey" : "Remove passkey"}
                      aria-label={`Remove ${p.label || "passkey"}`}
                      className="p-2 rounded-lg text-text-subtle hover:text-danger hover:bg-danger/5 disabled:opacity-40"
                    >
                      {removingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pending.length > 0 && (
            <p className="text-[12px] text-text-subtle">
              {pending.length} passkey{pending.length > 1 ? "s" : ""} waiting for approval. Add it again to finish.
            </p>
          )}

          <ActionButton onClick={onAdd} disabled={!!adding || isLoading || passkeys.length === 0}>
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {adding}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add a passkey
              </>
            )}
          </ActionButton>
          <p className="text-[12px] text-text-subtle leading-relaxed flex gap-2">
            <Fingerprint className="w-4 h-4 flex-shrink-0" />
            Your browser will offer this device, a phone (scan a QR code) or a security key. Then
            you'll confirm the change with a passkey you already have. New networks you use later are
            set up with your first passkey, so keep it synced.
          </p>
        </div>
      </div>

      {confirmRemove && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0F2A38]/55 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
            <h3 className="text-[17px] font-semibold text-text-default">
              {onlyOne ? "Can't remove your only passkey" : `Remove "${confirmRemove.label || "Passkey"}"?`}
            </h3>
            <p className="text-[13px] text-text-subtle mt-1.5">
              {onlyOne
                ? "Your wallet needs at least one passkey. Add another passkey first, then remove this one."
                : "This passkey will no longer be able to approve transactions. You'll confirm with one of your remaining passkeys."}
            </p>
            <div className="mt-5 flex gap-3">
              <ActionButton variant="ghost" className="flex-1 w-auto" onClick={() => setConfirmRemove(null)}>
                {onlyOne ? "OK" : "Cancel"}
              </ActionButton>
              {!onlyOne && (
                <ActionButton variant="danger" className="flex-1 w-auto" onClick={() => onRemove(confirmRemove)}>
                  Remove
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
