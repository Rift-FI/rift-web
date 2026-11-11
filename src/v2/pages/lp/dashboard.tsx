import { ReactNode, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Lock, Smartphone, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, Segmented, Skeleton, StatusPill, shortHash, type Status } from "@/v2/ui";
import { Flag, currencyMeta } from "@/v2/ui/currency-picker";
import { explorerTxUrl } from "@/v2/lib/payments";
import {
  chainLabel,
  directionLabel,
  fmtDate,
  fmtPeriod,
  fmtUsd,
  fmtUsdSmall,
  LP_TERMS_VERSION,
  hasAcceptedTerms,
  useLpMe,
  type LpMe,
  type LpPool,
  type LpSession,
} from "@/v2/lib/lp";
import { TermsGate } from "./terms";
import { CryptoDepositSheet } from "./deposit-crypto";
import { FiatDepositSheet } from "./deposit-fiat";
import { WithdrawSheet } from "./withdraw";

type Action = "crypto" | "fiat" | "withdraw";

const STATUS_MAP: Record<string, { status: Status; label: string }> = {
  pending: { status: "pending", label: "Pending" },
  credited: { status: "succeeded", label: "Credited" },
  rejected: { status: "failed", label: "Rejected" },
  held_terms: { status: "pending", label: "Waiting for terms" },
  requested: { status: "pending", label: "Requested" },
  approved: { status: "pending", label: "Approved" },
  paid: { status: "succeeded", label: "Paid" },
};
const Pill = ({ s }: { s: string }) => {
  const m = STATUS_MAP[s] ?? { status: "neutral" as Status, label: s || "—" };
  return <StatusPill status={m.status} label={m.label} />;
};

function Figure({ label, value, sub, testId, strong, className }: { label: string; value: ReactNode; sub?: ReactNode; testId?: string; strong?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0 bg-card px-5 py-4", className)} data-testid={testId}>
      <dt className="text-[12.5px] font-medium text-ink-3">{label}</dt>
      <dd className={cn("mt-1 truncate font-semibold tracking-[-0.02em] text-ink tabular-numeric", strong ? "text-[28px] leading-none sm:text-[32px]" : "text-[20px] leading-tight")}>{value}</dd>
      {sub && <dd className="mt-1 text-[12px] text-ink-3">{sub}</dd>}
    </div>
  );
}

function nextPayoutDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}

function LockSchedule({ me }: { me: LpMe }) {
  const now = Date.now();
  const locked = me.lockSchedule.filter((l) => Date.parse(l.unlocksAt) > now);
  const lockedTotal = locked.reduce((s, l) => s + l.amountUsd, 0);
  return (
    <Card data-testid="lp-lock-schedule">
      <CardHeader title="Lock schedule" />
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-surface-subtle px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
              <Unlock className="h-3.5 w-3.5" aria-hidden="true" /> Withdrawable now
            </p>
            <p className="mt-0.5 text-[17px] font-semibold text-ink tabular-numeric" data-testid="lp-withdrawable">
              {fmtUsd(me.withdrawableUsd)}
            </p>
          </div>
          <div className="rounded-md bg-surface-subtle px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Still locked
            </p>
            <p className="mt-0.5 text-[17px] font-semibold text-ink tabular-numeric">{fmtUsd(lockedTotal)}</p>
          </div>
        </div>
        {me.lockSchedule.length === 0 ? (
          <p className="mt-4 text-[13.5px] text-ink-3">Deposits show here with the date each one unlocks.</p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {me.lockSchedule.map((l, i) => {
              const open = Date.parse(l.unlocksAt) <= now;
              return (
                <li key={`${l.unlocksAt}-${i}`} className="flex items-center justify-between gap-3 py-2.5 text-[14px]" data-testid="lp-lock-row">
                  <span className="text-ink tabular-numeric">{fmtUsd(l.amountUsd)}</span>
                  <span className={cn("text-right", open ? "font-medium text-success" : "text-ink-2")}>{open ? "Unlocked" : `Unlocks ${fmtDate(l.unlocksAt)}`}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Accruals({ me }: { me: LpMe }) {
  return (
    <Card data-testid="lp-accruals">
      <CardHeader title="When your money was used" />
      {me.recentAccruals.length === 0 ? (
        <EmptyState title="No earnings yet" description="Each time a payment uses the pool, it shows here with what your share earned." />
      ) : (
        <>
          {/* Table at tablet+; stacked rows on phones. */}
          <table className="hidden w-full text-[14px] sm:table">
            <thead>
              <tr className="border-b border-hairline text-left text-[12px] font-medium text-ink-3">
                <th scope="col" className="px-5 py-2.5 font-medium">Date</th>
                <th scope="col" className="py-2.5 font-medium">Payment</th>
                <th scope="col" className="py-2.5 text-right font-medium">Volume</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">You earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {me.recentAccruals.map((a) => (
                <tr key={a.id} data-testid="lp-accrual-row">
                  <td className="whitespace-nowrap px-5 py-3 text-ink-3">{fmtDate(a.at)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2 text-ink">
                      <Flag iso={currencyMeta(a.corridor).iso} className="h-4 w-4" />
                      {directionLabel(a.direction)} · {a.corridor || "—"}
                    </span>
                  </td>
                  <td className="py-3 text-right text-ink-2 tabular-numeric">{fmtUsd(a.volumeUsd)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-success tabular-numeric">+{fmtUsdSmall(a.amountUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-hairline sm:hidden">
            {me.recentAccruals.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <Flag iso={currencyMeta(a.corridor).iso} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">
                    {directionLabel(a.direction)} · {a.corridor || "—"}
                  </p>
                  <p className="text-[12.5px] text-ink-3">
                    {fmtDate(a.at)} · {fmtUsd(a.volumeUsd)}
                  </p>
                </div>
                <span className="text-[14px] font-semibold text-success tabular-numeric">+{fmtUsdSmall(a.amountUsd)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function TxLink({ hash, chain }: { hash?: string | null; chain?: string | null }) {
  if (!hash) return null;
  return (
    <a href={explorerTxUrl(hash, chain)} target="_blank" rel="noopener noreferrer" className="font-mono text-[12.5px] text-accent-primary hover:underline">
      {shortHash(hash, 6, 4)}
    </a>
  );
}

type HistoryTab = "deposits" | "payouts" | "withdrawals";

function History({ me }: { me: LpMe }) {
  const [tab, setTab] = useState<HistoryTab>("deposits");
  const Row = ({ title, sub, amount, status, testId }: { title: ReactNode; sub: ReactNode; amount: ReactNode; status: string; testId: string }) => (
    <li className="flex items-center gap-3 px-5 py-3" data-testid={testId}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{title}</p>
        <p className="truncate text-[12.5px] text-ink-3">{sub}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[14px] font-semibold text-ink tabular-numeric">{amount}</span>
        <Pill s={status} />
      </div>
    </li>
  );
  const empty = (t: string) => <p className="px-5 py-8 text-center text-[14px] text-ink-3">{t}</p>;
  return (
    <Card data-testid="lp-history">
      <div className="border-b border-hairline px-5 py-3">
        <Segmented<HistoryTab>
          label="History"
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: "deposits", label: "Deposits", testId: "lp-tab-deposits" },
            { value: "payouts", label: "Payouts", testId: "lp-tab-payouts" },
            { value: "withdrawals", label: "Withdrawals", testId: "lp-tab-withdrawals" },
          ]}
        />
      </div>
      {tab === "deposits" &&
        (me.deposits.length === 0 ? (
          empty("No deposits yet.")
        ) : (
          <ul className="divide-y divide-hairline">
            {me.deposits.map((d) => (
              <Row
                key={d.id}
                testId="lp-deposit-row"
                title={d.source === "fiat" ? `Local money · ${d.fiatCurrency ?? ""}` : `${d.asset ?? "Stablecoin"} on ${chainLabel(d.chain)}`}
                sub={
                  <>
                    {fmtDate(d.creditedAt ?? d.createdAt)}
                    {d.lockedUntil ? ` · unlocks ${fmtDate(d.lockedUntil)}` : ""}
                    {d.txHash ? (
                      <>
                        {" · "}
                        <TxLink hash={d.txHash} chain={d.chain} />
                      </>
                    ) : null}
                  </>
                }
                amount={d.amountUsd !== null ? fmtUsd(d.amountUsd) : d.fiatAmount ? `${d.fiatAmount.toLocaleString()} ${d.fiatCurrency ?? ""}` : "—"}
                status={d.status}
              />
            ))}
          </ul>
        ))}
      {tab === "payouts" &&
        (me.payouts.length === 0 ? (
          empty("No payouts yet. Earnings are paid at the start of each month.")
        ) : (
          <ul className="divide-y divide-hairline">
            {me.payouts.map((p) => (
              <Row
                key={p.id}
                testId="lp-payout-row"
                title={fmtPeriod(p.period)}
                sub={p.paidAt ? <>Paid {fmtDate(p.paidAt)} {p.txHash && <TxLink hash={p.txHash} />}</> : "Scheduled"}
                amount={fmtUsd(p.amountUsd)}
                status={p.status}
              />
            ))}
          </ul>
        ))}
      {tab === "withdrawals" &&
        (me.withdrawals.length === 0 ? (
          empty("No withdrawals yet.")
        ) : (
          <ul className="divide-y divide-hairline">
            {me.withdrawals.map((w) => (
              <Row
                key={w.id}
                testId="lp-withdrawal-row"
                title={`${w.asset ?? ""} to ${shortHash(w.toAddress ?? "", 6, 4)} on ${chainLabel(w.chain)}`}
                sub={
                  <>
                    Requested {fmtDate(w.requestedAt)}
                    {w.txHash ? (
                      <>
                        {" · "}
                        <TxLink hash={w.txHash} chain={w.chain} />
                      </>
                    ) : null}
                    {w.note ? ` · ${w.note}` : ""}
                  </>
                }
                amount={fmtUsd(w.amountUsd)}
                status={w.status}
              />
            ))}
          </ul>
        ))}
    </Card>
  );
}

export function Dashboard({ session, pool }: { session: LpSession; pool?: LpPool }) {
  const { data: me, isLoading, isError, error, refetch } = useLpMe(session);
  const [action, setAction] = useState<Action | null>(null);
  const [gateFor, setGateFor] = useState<Action | null>(null);
  const termsVersion = pool?.termsVersion ?? LP_TERMS_VERSION;
  const accepted = hasAcceptedTerms(me, termsVersion);

  // Deposits are gated on the current terms; withdrawals are not.
  const start = (a: Action) => {
    if (a !== "withdraw" && !accepted) setGateFor(a);
    else setAction(a);
  };

  if (isLoading)
    return (
      <div className="space-y-4" role="status" aria-label="Loading your position">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (isError || !me)
    return (
      <Card className="px-5 py-10 text-center" data-testid="lp-me-error">
        <p className="text-[14px] text-ink-3">
          {(error as any)?.message || "Couldn't load your position."}{" "}
          <button type="button" onClick={() => refetch()} className="cursor-pointer font-medium text-accent-primary hover:underline">
            Retry
          </button>
        </p>
      </Card>
    );

  const heldForTerms = me.deposits.filter((d) => d.status === "held_terms");

  return (
    <div className="space-y-4" data-testid="lp-dashboard">
      {!accepted && (
        <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid="lp-terms-banner">
          <div>
            <p className="text-[14.5px] font-semibold text-ink">Accept the LP Terms to deposit</p>
            <p className="text-[13px] text-ink-3">
              {heldForTerms.length
                ? `${heldForTerms.length} deposit${heldForTerms.length > 1 ? "s are" : " is"} waiting. They're credited once you accept.`
                : "Read how the pool works and what the risks are, then accept once."}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setGateFor("crypto")} data-testid="lp-review-terms">
            Review terms
          </Button>
        </div>
      )}

      <Card as="div" className="overflow-hidden">
        <dl className="grid grid-cols-2 gap-px bg-hairline lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
          <Figure label="Your deposit" value={fmtUsd(me.principalUsd)} strong testId="lp-principal" className="col-span-2 lg:col-span-1" />
          <Figure label="Pool share" value={me.sharePct !== null ? `${me.sharePct.toFixed(2)}%` : "—"} testId="lp-share" />
          <Figure label="Earned in total" value={fmtUsd(me.earnedTotalUsd)} testId="lp-earned-total" />
          <Figure label="This month" value={fmtUsd(me.earnedThisMonthUsd)} testId="lp-earned-month" />
          <Figure label="Not yet paid" value={fmtUsd(me.unpaidUsd)} sub={`Next payout ${fmtDate(nextPayoutDate())}`} testId="lp-unpaid" />
        </dl>
        <div className="flex flex-col gap-2 border-t border-hairline bg-card px-5 py-4 sm:flex-row">
          <Button onClick={() => start("crypto")} data-testid="lp-deposit-crypto">
            <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            Deposit crypto
          </Button>
          <Button variant="secondary" onClick={() => start("fiat")} data-testid="lp-deposit-fiat">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            Deposit local money
          </Button>
          <Button variant="secondary" onClick={() => start("withdraw")} data-testid="lp-withdraw" className="sm:ml-auto">
            <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
            Withdraw
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Accruals me={me} />
          <History me={me} />
        </div>
        <div className="space-y-4">
          <LockSchedule me={me} />
        </div>
      </div>

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
      <CryptoDepositSheet open={action === "crypto"} onClose={() => setAction(null)} session={session} pool={pool} me={me} />
      <FiatDepositSheet open={action === "fiat"} onClose={() => setAction(null)} session={session} />
      <WithdrawSheet open={action === "withdraw"} onClose={() => setAction(null)} session={session} pool={pool} me={me} />
    </div>
  );
}
