/**
 * Yield (LP pool). Served at lp.riftfi.com (own chrome, no login needed to
 * browse; /lp on localhost/previews). Signed-in LPs get their position first,
 * with the pool explainer one tab away.
 */
import { useState } from "react";
import { useSearchParams } from "react-router";
import { UserRound, Wallet } from "lucide-react";
import { Button, Segmented } from "@/v2/ui";
import { useLpPool, useLpSession } from "@/v2/lib/lp";
import { LpChrome } from "./chrome";
import { ConnectSheet } from "./connect";
import { Dashboard } from "./dashboard";
import { PoolOverview } from "./overview";

type View = "position" | "pool";

function useView(): [View, (v: View) => void] {
  const [params, setParams] = useSearchParams();
  const view: View = params.get("view") === "pool" ? "pool" : "position";
  return [
    view,
    (v) => {
      const next = new URLSearchParams(params);
      if (v === "pool") next.set("view", "pool");
      else next.delete("view");
      setParams(next, { replace: true });
    },
  ];
}

function Body({ embedded }: { embedded?: boolean }) {
  const { session } = useLpSession();
  const pool = useLpPool();
  const [view, setView] = useView();
  const [connectOpen, setConnectOpen] = useState(false);

  const overviewProps = { pool: pool.data, poolLoading: pool.isLoading, poolError: pool.isError, onRetry: () => pool.refetch() };

  if (!session)
    return (
      <>
        <PoolOverview
          {...overviewProps}
          cta={
            <>
              <Button size="lg" onClick={() => setConnectOpen(true)} data-testid="lp-cta-connect">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                Connect wallet
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setConnectOpen(true)} data-testid="lp-cta-rift">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Sign in with Rift
              </Button>
            </>
          }
        />
        <ConnectSheet open={connectOpen} onClose={() => setConnectOpen(false)} />
      </>
    );

  return (
    <>
      <div className="mb-5 max-w-[360px]">
        <Segmented<View>
          label="Yield view"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "position", label: "My position", testId: "lp-view-position" },
            { value: "pool", label: "Pool & terms", testId: "lp-view-pool" },
          ]}
        />
      </div>
      {view === "position" ? <Dashboard session={session} pool={pool.data} /> : <PoolOverview {...overviewProps} hero={!embedded} />}
    </>
  );
}

/** lp.riftfi.com — public. */
export default function LpPage() {
  const { session } = useLpSession();
  return (
    <LpChrome>
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pb-24 lg:pt-14">
        {session && <h1 className="mb-5 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink lg:text-[26px]">Yield</h1>}
        <Body />
      </div>
    </LpChrome>
  );
}
