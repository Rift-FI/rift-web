/**
 * Yield (LP pool), terminal layout. Served at lp.riftfi.com (/lp on
 * localhost/previews). Stats strip, chart, deposit/withdraw ticket and
 * tabbed tables; the same page signed in or out.
 */
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Button, Segmented, Skeleton } from "@/v2/ui";
import { LP_TERMS_VERSION, fmtUsd, hasAcceptedTerms, useLpMe, useLpPool, useLpSession, type LpMe, type LpPool, type LpSession } from "@/v2/lib/lp";
import { LpChrome } from "./chrome";
import { ChartPanel } from "./chart";
import { ConnectSheet } from "./connect";
import { AccountRows, DepositsTable, EarningsTable, LocksTable, PayoutsTable, WithdrawalsTable } from "./dashboard";
import { DepositEstimate, KV, Panel, PoolActivityTable, RisksList, StatsStrip } from "./overview";
import { TermsGate } from "./terms";
import { CryptoDepositSheet } from "./deposit-crypto";
import { FiatDepositSheet } from "./deposit-fiat";
import { WithdrawSheet } from "./withdraw";

type Action = "crypto" | "fiat" | "withdraw";
type TicketTab = "deposit" | "withdraw";

/* ── Ticket ────────────────────────────────────────────────────────── */

function Ticket({
  pool,
  poolLoading,
  session,
  me,
  meLoading,
  meError,
  onRetryMe,
  accepted,
  heldForTerms,
  onConnect,
  onStart,
  onReviewTerms,
}: {
  pool?: LpPool;
  poolLoading: boolean;
  session: LpSession | null;
  me?: LpMe;
  meLoading: boolean;
  meError: string | null;
  onRetryMe: () => void;
  accepted: boolean;
  heldForTerms: number;
  onConnect: () => void;
  onStart: (a: Action) => void;
  onReviewTerms: () => void;
}) {
  const [tab, setTab] = useState<TicketTab>("deposit");
  const lockedTotal = me ? me.lockSchedule.filter((l) => Date.parse(l.unlocksAt) > Date.now()).reduce((s, l) => s + l.amountUsd, 0) : 0;

  const connect = (
    <div className="space-y-2">
      <Button block onClick={onConnect} data-testid={tab === "deposit" ? "lp-cta-connect" : "lp-cta-connect-withdraw"}>
        Connect wallet
      </Button>
      <p className="text-center text-[12px] text-ink-3">
        or{" "}
        <button type="button" onClick={onConnect} className="cursor-pointer font-medium text-accent-primary hover:underline" data-testid="lp-cta-rift">
          Sign in with Rift
        </button>
      </p>
    </div>
  );

  return (
    <Panel className="p-3" data-testid="lp-ticket">
      <Segmented<TicketTab>
        label="Deposit or withdraw"
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: "deposit", label: "Deposit", testId: "lp-ticket-deposit" },
          { value: "withdraw", label: "Withdraw", testId: "lp-ticket-withdraw" },
        ]}
      />
      <div className="mt-3">
        {tab === "deposit" ? (
          <>
            <DepositEstimate pool={pool} loading={poolLoading} />
            <div className="mt-3">
              {!session ? (
                connect
              ) : (
                <div className="space-y-2">
                  {me && !accepted && (
                    <div className="rounded-md border border-hairline-strong bg-tint-pending px-2.5 py-2 text-[12px] text-pending" data-testid="lp-terms-banner">
                      <p className="font-medium">Accept the LP Terms to deposit.</p>
                      {heldForTerms > 0 && <p>{heldForTerms} deposit{heldForTerms > 1 ? "s are" : " is"} waiting for it.</p>}
                      <button type="button" onClick={onReviewTerms} className="mt-1 cursor-pointer font-semibold underline" data-testid="lp-review-terms">
                        Review terms
                      </button>
                    </div>
                  )}
                  <Button block onClick={() => onStart("crypto")} disabled={!me} data-testid="lp-deposit-crypto">
                    Deposit crypto
                  </Button>
                  <Button block variant="secondary" onClick={() => onStart("fiat")} disabled={!me} data-testid="lp-deposit-fiat">
                    Deposit local money
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : !session ? (
          <div className="space-y-3">
            <p className="text-[12.5px] text-ink-3">Sign in to see what you can withdraw. Each deposit unlocks {pool?.lockDays ?? 30} days after it's credited.</p>
            {connect}
          </div>
        ) : (
          <div className="space-y-3">
            <dl>
              <KV label="Withdrawable now">{me ? fmtUsd(me.withdrawableUsd) : "—"}</KV>
              <KV label="Still locked">{me ? fmtUsd(lockedTotal) : "—"}</KV>
            </dl>
            <Button block onClick={() => onStart("withdraw")} disabled={!me} data-testid="lp-withdraw">
              Withdraw
            </Button>
          </div>
        )}
      </div>

      {session && (
        <div className="mt-3 border-t border-hairline pt-2.5" data-testid="lp-account">
          <p className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">Account</p>
          {meLoading ? (
            <div className="space-y-2 py-1" role="status" aria-label="Loading your position">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : meError || !me ? (
            <p className="py-2 text-[12.5px] text-ink-3" data-testid="lp-me-error">
              {meError || "Couldn't load your position."}{" "}
              <button type="button" onClick={onRetryMe} className="cursor-pointer font-medium text-accent-primary hover:underline">
                Retry
              </button>
            </p>
          ) : (
            <AccountRows me={me} />
          )}
        </div>
      )}
    </Panel>
  );
}

/* ── Bottom tabs ───────────────────────────────────────────────────── */

type BottomTab = "earnings" | "deposits" | "withdrawals" | "payouts" | "locks" | "activity" | "risks";

function BottomTabs({ me, signedIn }: { me?: LpMe; signedIn: boolean }) {
  const tabs: { id: BottomTab; label: string; count?: number }[] = [
    ...(signedIn && me
      ? ([
          { id: "earnings", label: "Earnings", count: me.recentAccruals.length },
          { id: "deposits", label: "Deposits", count: me.deposits.length },
          { id: "withdrawals", label: "Withdrawals", count: me.withdrawals.length },
          { id: "payouts", label: "Payouts", count: me.payouts.length },
          { id: "locks", label: "Locks", count: me.lockSchedule.length },
        ] as const)
      : []),
    { id: "activity", label: "Pool activity" },
    { id: "risks", label: "Risks & terms" },
  ];
  // Until the visitor picks a tab, the first one leads (Earnings once signed in).
  const [tab, setTab] = useState<BottomTab | null>(null);
  const ids = tabs.map((t) => t.id);
  const active = tab && ids.includes(tab) ? tab : ids[0];

  let body: ReactNode = null;
  if (active === "activity") body = <PoolActivityTable />;
  else if (active === "risks") body = <RisksList />;
  else if (me) {
    if (active === "earnings") body = <EarningsTable me={me} />;
    if (active === "deposits") body = <DepositsTable me={me} />;
    if (active === "withdrawals") body = <WithdrawalsTable me={me} />;
    if (active === "payouts") body = <PayoutsTable me={me} />;
    if (active === "locks") body = <LocksTable me={me} />;
  }

  return (
    <Panel className="flex min-h-[220px] flex-col" data-testid="lp-tables">
      <div role="tablist" aria-label="Tables" className="flex overflow-x-auto border-b border-hairline px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            data-testid={`lp-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative h-9 flex-shrink-0 cursor-pointer whitespace-nowrap px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary",
              active === t.id ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent-primary" : "text-ink-3 hover:text-ink"
            )}
          >
            {t.label}
            {t.count ? <span className="ml-1 text-ink-3 tabular-numeric">({t.count})</span> : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="min-w-0 flex-1">
        {body}
      </div>
    </Panel>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

function Terminal() {
  const { session } = useLpSession();
  const pool = useLpPool();
  const meQ = useLpMe(session);
  const me = meQ.data;
  const [connectOpen, setConnectOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [gateFor, setGateFor] = useState<Action | null>(null);
  const termsVersion = pool.data?.termsVersion ?? LP_TERMS_VERSION;
  const accepted = hasAcceptedTerms(me, termsVersion);

  // Deposits are gated on the current terms; withdrawals are not.
  const start = (a: Action) => {
    if (a !== "withdraw" && !accepted) setGateFor(a);
    else setAction(a);
  };

  const signedIn = !!session;
  const ready = signedIn && !!me;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-1 p-1" data-testid={ready ? "lp-dashboard" : "lp-overview"}>
      <StatsStrip pool={pool.data} loading={pool.isLoading} error={pool.isError} onRetry={() => pool.refetch()} />
      <div className="grid grid-cols-1 gap-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="lg:col-start-1 lg:row-start-1">
          <ChartPanel className="border-b-0" />
        </Panel>
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Deposit and withdraw">
          <div className="lg:sticky lg:top-12">
            <Ticket
              pool={pool.data}
              poolLoading={pool.isLoading}
              session={session}
              me={me}
              meLoading={meQ.isLoading}
              meError={meQ.isError ? (meQ.error as any)?.message || "Couldn't load your position." : null}
              onRetryMe={() => meQ.refetch()}
              accepted={accepted}
              heldForTerms={me?.deposits.filter((d) => d.status === "held_terms").length ?? 0}
              onConnect={() => setConnectOpen(true)}
              onStart={start}
              onReviewTerms={() => setGateFor("crypto")}
            />
          </div>
        </aside>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <BottomTabs me={me} signedIn={ready} />
        </div>
      </div>

      <ConnectSheet open={connectOpen} onClose={() => setConnectOpen(false)} />
      {session && (
        <TermsGate
          open={!!gateFor}
          session={session}
          version={termsVersion}
          onClose={() => setGateFor(null)}
          onAccepted={() => {
            const next = gateFor;
            setGateFor(null);
            setAction(next);
          }}
        />
      )}
      {session && me && (
        <>
          <CryptoDepositSheet open={action === "crypto"} onClose={() => setAction(null)} session={session} pool={pool.data} me={me} />
          <FiatDepositSheet open={action === "fiat"} onClose={() => setAction(null)} session={session} />
          <WithdrawSheet open={action === "withdraw"} onClose={() => setAction(null)} session={session} pool={pool.data} me={me} />
        </>
      )}
    </div>
  );
}

/** lp.riftfi.com — public. */
export default function LpPage() {
  return (
    <LpChrome>
      <Terminal />
    </LpChrome>
  );
}
