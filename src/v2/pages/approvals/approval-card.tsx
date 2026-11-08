import { useState } from "react";
import { Check, Clock, Fingerprint, Loader2, X, XCircle } from "lucide-react";
import ActionButton from "@/components/ui/action-button";
import { useApproval, useApprovalActions } from "@/hooks/data/use-approvals";
import {
  chainLabel,
  isApprovalActionable,
  summaryRows,
  summaryTitle,
} from "@/lib/passkeyUtils";
import { shortenString } from "@/lib/utils";

/**
 * One approval request (spec §2d): summary of the stored intent, then
 * passkey approve (preview → sign → approve) or reject.
 */
export default function ApprovalCard({ id, onFinished }: { id: string; onFinished?: () => void }) {
  const { data: approval, isLoading, error } = useApproval(id);
  const { approve, reject } = useApprovalActions(id);
  const [outcome, setOutcome] = useState<
    { kind: "approved"; hash: string } | { kind: "rejected" } | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-10 text-text-subtle text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading request…
        </div>
      </Shell>
    );
  }
  if (error || !approval) {
    return (
      <Shell>
        <Header icon={<XCircle className="w-6 h-6 text-danger" />} tone="danger" title="Request not found" />
        <p className="text-[14px] text-text-subtle mt-2">
          This approval link is invalid, or it belongs to a different account.
        </p>
      </Shell>
    );
  }

  const rows = summaryRows(approval.summary);
  const title = summaryTitle(approval.summary);
  const status = outcome?.kind ?? approval.status;
  const actionable = !outcome && isApprovalActionable(approval.status, approval.expiresAt);
  const busy = approve.isPending || reject.isPending;
  const txHash = outcome?.kind === "approved" ? outcome.hash : approval.result?.transactionHash;

  const onApprove = async () => {
    setActionError(null);
    try {
      const r = await approve.mutateAsync();
      setOutcome({ kind: "approved", hash: r.transactionHash || r.hash });
      onFinished?.();
    } catch (e: any) {
      setActionError(e?.message || "Approval failed");
    }
  };
  const onReject = async () => {
    setActionError(null);
    try {
      await reject.mutateAsync();
      setOutcome({ kind: "rejected" });
      onFinished?.();
    } catch (e: any) {
      setActionError(e?.message || "Couldn't reject the request");
    }
  };

  return (
    <Shell>
      {status === "approved" ? (
        <Header icon={<Check className="w-6 h-6 text-success" />} tone="success" title="Approved" />
      ) : status === "rejected" ? (
        <Header icon={<X className="w-6 h-6 text-text-subtle" />} tone="muted" title="Rejected" />
      ) : actionable ? (
        <Header icon={<Fingerprint className="w-6 h-6 text-accent-primary" />} tone="accent" title={title} />
      ) : (
        <Header
          icon={<Clock className="w-6 h-6 text-text-subtle" />}
          tone="muted"
          title={status === "failed" ? "This request failed" : "This request has expired"}
        />
      )}

      <p className="text-[13px] text-text-subtle mt-1.5">
        {status === "approved"
          ? "Your passkey approved this request."
          : status === "rejected"
            ? "Nothing was sent. The requester has been told you declined."
            : actionable
              ? "Review the details. Approving asks for your passkey — Rift can't approve this for you."
              : "No funds moved. Ask the requester to send a new request."}
      </p>

      <dl className="mt-5 rounded-xl border border-gray-200 divide-y divide-gray-100 text-[13px]" data-testid="approval-summary">
        {rows.map((r) => (
          <div key={r.label + r.value} className="flex items-start justify-between gap-4 px-3 py-2.5">
            <dt className="text-text-subtle">{r.label}</dt>
            <dd className="text-text-default font-medium text-right break-all">{r.value}</dd>
          </div>
        ))}
        {approval.chainId && !rows.some((r) => r.label === "Network") ? (
          <div className="flex justify-between px-3 py-2.5">
            <dt className="text-text-subtle">Network</dt>
            <dd className="text-text-default font-medium">{chainLabel(approval.chainId)}</dd>
          </div>
        ) : null}
        {approval.expiresAt && actionable && (
          <div className="flex justify-between px-3 py-2.5">
            <dt className="text-text-subtle">Expires</dt>
            <dd className="text-text-default">{new Date(approval.expiresAt).toLocaleString()}</dd>
          </div>
        )}
      </dl>

      {txHash && (
        <p className="mt-3 text-[12px] text-text-subtle">
          Transaction <span className="font-mono text-text-default">{shortenString(txHash)}</span>
        </p>
      )}

      {actionError && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger" role="alert">
          {actionError}
        </div>
      )}

      {actionable && (
        <div className="mt-6 flex gap-3">
          <ActionButton variant="ghost" className="flex-1 w-auto" onClick={onReject} disabled={busy}>
            {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Reject
          </ActionButton>
          <ActionButton className="flex-1 w-auto" onClick={onApprove} disabled={busy}>
            {approve.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            Approve with passkey
          </ActionButton>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
      {children}
    </div>
  );
}

function Header({
  icon,
  title,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "accent" | "success" | "danger" | "muted";
}) {
  const bg =
    tone === "accent"
      ? "bg-accent-primary/10"
      : tone === "success"
        ? "bg-success/10"
        : tone === "danger"
          ? "bg-danger/10"
          : "bg-surface-subtle";
  return (
    <>
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>{icon}</div>
      <h2 className="text-[20px] font-semibold text-text-default leading-tight">{title}</h2>
    </>
  );
}
