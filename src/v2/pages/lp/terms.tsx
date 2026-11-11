import { useId, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, SideSheet, Skeleton } from "@/v2/ui";
import { Markdown } from "@/v2/ui/markdown";
import { fmtDate, lpApi, useLpTerms, type LpSession } from "@/v2/lib/lp";
import { LpChrome } from "./chrome";

function TermsBody({ compact }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch } = useLpTerms();
  if (isLoading)
    return (
      <div className="space-y-3" role="status" aria-label="Loading terms">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  if (isError || !data?.markdown)
    return (
      <p className="text-[14px] text-ink-3" role="alert">
        Couldn{"’"}t load the terms.{" "}
        <button type="button" onClick={() => refetch()} className="cursor-pointer font-medium text-accent-primary hover:underline">
          Retry
        </button>
      </p>
    );
  return (
    <div data-testid="lp-terms-body">
      <p className="mb-4 text-[12.5px] text-ink-3">
        Version <span className="font-mono">{data.version}</span>
        {data.effectiveAt ? ` · effective ${fmtDate(data.effectiveAt)}` : ""}
      </p>
      <Markdown source={data.markdown} className={compact ? "text-[14px]" : undefined} />
    </div>
  );
}

/** /lp/terms: the full LP Terms of Service, public. */
export default function LpTermsPage() {
  return (
    <LpChrome>
      <article className="mx-auto w-full max-w-[720px] px-4 pb-20 pt-8 sm:px-6 lg:pt-12">
        <Link to="/lp" className="text-[13px] font-medium text-ink-3 hover:text-ink">
          ← Yield
        </Link>
        <h1 className="mb-6 mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">LP Terms of Service</h1>
        <div className="rounded-lg border border-hairline bg-card px-5 py-6 sm:px-8 sm:py-8">
          <TermsBody />
        </div>
      </article>
    </LpChrome>
  );
}

/**
 * Required before any deposit: the terms in a scrollable panel, an explicit
 * checkbox, then POST /v1/lp/terms/accept.
 */
export function TermsGate({
  open,
  onClose,
  onAccepted,
  session,
  version,
}: {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
  session: LpSession;
  version: string;
}) {
  const qc = useQueryClient();
  const checkId = useId();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      await lpApi.acceptTerms(session, version);
      await qc.invalidateQueries({ queryKey: ["lp", "me"] });
      setChecked(false);
      onAccepted();
    } catch (e: any) {
      setError(e?.message || "Couldn't record your acceptance. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Accept the LP Terms"
      description="Read these before you deposit. They explain how the pool works and what can go wrong."
      testId="lp-terms-gate"
      footer={
        <div className="space-y-3">
          <label htmlFor={checkId} className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink">
            <input
              id={checkId}
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              data-testid="lp-terms-check"
              className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 cursor-pointer rounded accent-[var(--color-accent-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            />
            <span>
              I have read and accept the LP Terms (<span className="font-mono text-[13px]">{version}</span>)
            </span>
          </label>
          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <Button size="lg" block disabled={!checked || busy} onClick={accept} data-testid="lp-terms-accept">
            {busy ? "Saving…" : "Accept and continue"}
          </Button>
        </div>
      }
    >
      <div tabIndex={0} aria-label="LP Terms text" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
        <TermsBody compact />
      </div>
    </SideSheet>
  );
}
