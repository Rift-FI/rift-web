import { StatusPill, shortHash, type Status } from "@/v2/ui";
import { Flag, currencyMeta } from "@/v2/ui/currency-picker";
import { explorerTxUrl } from "@/v2/lib/payments";
import { chainLabel, directionLabel, fmtDate, fmtPeriod, fmtUsd, fmtUsdSmall, type LpMe } from "@/v2/lib/lp";
import { DataTable, KV, timeOf } from "./overview";

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

function nextPayoutDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}

function TxLink({ hash, chain }: { hash?: string | null; chain?: string | null }) {
  if (!hash) return <span className="text-ink-3">—</span>;
  return (
    <a href={explorerTxUrl(hash, chain)} target="_blank" rel="noopener noreferrer" className="font-mono text-[12px] text-accent-primary hover:underline">
      {shortHash(hash, 6, 4)}
    </a>
  );
}

/** Account rows under the ticket (signed in). */
export function AccountRows({ me }: { me: LpMe }) {
  return (
    <dl>
      <KV label="Your deposit" testId="lp-principal" strong>
        {fmtUsd(me.principalUsd)}
      </KV>
      <KV label="Pool share" testId="lp-share">
        {me.sharePct !== null ? `${me.sharePct.toFixed(2)}%` : "—"}
      </KV>
      <KV label="Earned, all time" testId="lp-earned-total">
        {fmtUsd(me.earnedTotalUsd)}
      </KV>
      <KV label="Earned this month" testId="lp-earned-month">
        {fmtUsd(me.earnedThisMonthUsd)}
      </KV>
      <KV label="Not yet paid" testId="lp-unpaid" sub={`Next payout ${fmtDate(nextPayoutDate())}`}>
        {fmtUsd(me.unpaidUsd)}
      </KV>
      <KV label="Withdrawable" testId="lp-withdrawable">
        {fmtUsd(me.withdrawableUsd)}
      </KV>
    </dl>
  );
}

export function EarningsTable({ me }: { me: LpMe }) {
  return (
    <DataTable
      testId="lp-accruals"
      head={["Time", "Payment", "Volume", "Your share", "Earned"]}
      align={["l", "l", "r", "r", "r"]}
      empty={me.recentAccruals.length ? null : "No earnings yet. Each payment that uses the pool shows here."}
    >
      {me.recentAccruals.map((a) => (
        <tr key={a.id} data-testid="lp-accrual-row">
          <td className="text-ink-3">{timeOf(a.at)}</td>
          <td>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Flag iso={currencyMeta(a.corridor).iso} className="h-3.5 w-3.5" />
              {directionLabel(a.direction)} · {a.corridor || "—"}
            </span>
          </td>
          <td className="text-right text-ink-2">{fmtUsd(a.volumeUsd)}</td>
          <td className="text-right text-ink-2">{a.share !== null ? `${(a.share * 100).toFixed(2)}%` : "—"}</td>
          <td className="text-right font-medium text-success">+{fmtUsdSmall(a.amountUsd)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

export function DepositsTable({ me }: { me: LpMe }) {
  return (
    <DataTable testId="lp-deposits" head={["Time", "Source", "Amount", "Unlocks", "Tx", "Status"]} align={["l", "l", "r", "r", "r", "r"]} empty={me.deposits.length ? null : "No deposits yet."}>
      {me.deposits.map((d) => (
        <tr key={d.id} data-testid="lp-deposit-row">
          <td className="text-ink-3">{timeOf(d.creditedAt ?? d.createdAt)}</td>
          <td className="text-ink">{d.source === "fiat" ? `Local money · ${d.fiatCurrency ?? ""}` : `${d.asset ?? "Stablecoin"} · ${chainLabel(d.chain)}`}</td>
          <td className="text-right text-ink">{d.amountUsd !== null ? fmtUsd(d.amountUsd) : d.fiatAmount ? `${d.fiatAmount.toLocaleString()} ${d.fiatCurrency ?? ""}` : "—"}</td>
          <td className="text-right text-ink-2">{d.lockedUntil ? fmtDate(d.lockedUntil) : "—"}</td>
          <td className="text-right">
            <TxLink hash={d.txHash} chain={d.chain} />
          </td>
          <td className="text-right">
            <Pill s={d.status} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

export function WithdrawalsTable({ me }: { me: LpMe }) {
  return (
    <DataTable testId="lp-withdrawals" head={["Requested", "Amount", "To", "Network", "Tx", "Status"]} align={["l", "r", "r", "r", "r", "r"]} empty={me.withdrawals.length ? null : "No withdrawals yet."}>
      {me.withdrawals.map((w) => (
        <tr key={w.id} data-testid="lp-withdrawal-row">
          <td className="text-ink-3">{timeOf(w.requestedAt)}</td>
          <td className="text-right text-ink">
            {fmtUsd(w.amountUsd)} <span className="text-ink-3">{w.asset ?? ""}</span>
          </td>
          <td className="text-right font-mono text-[12px] text-ink-2">{shortHash(w.toAddress ?? "", 6, 4)}</td>
          <td className="text-right text-ink-2">{chainLabel(w.chain)}</td>
          <td className="text-right">
            <TxLink hash={w.txHash} chain={w.chain} />
          </td>
          <td className="text-right">
            <Pill s={w.status} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

export function PayoutsTable({ me }: { me: LpMe }) {
  return (
    <DataTable testId="lp-payouts" head={["Month", "Amount", "Paid", "Tx", "Status"]} align={["l", "r", "r", "r", "r"]} empty={me.payouts.length ? null : "No payouts yet. Earnings are paid at the start of each month."}>
      {me.payouts.map((p) => (
        <tr key={p.id} data-testid="lp-payout-row">
          <td className="text-ink">{fmtPeriod(p.period)}</td>
          <td className="text-right text-ink">{fmtUsd(p.amountUsd)}</td>
          <td className="text-right text-ink-2">{p.paidAt ? fmtDate(p.paidAt) : "Scheduled"}</td>
          <td className="text-right">
            <TxLink hash={p.txHash} />
          </td>
          <td className="text-right">
            <Pill s={p.status} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

export function LocksTable({ me }: { me: LpMe }) {
  const now = Date.now();
  return (
    <DataTable testId="lp-lock-schedule" head={["Amount", "Unlocks", "State"]} align={["l", "r", "r"]} empty={me.lockSchedule.length ? null : "Deposits show here with the date each one unlocks."}>
      {me.lockSchedule.map((l, i) => {
        const open = Date.parse(l.unlocksAt) <= now;
        return (
          <tr key={`${l.unlocksAt}-${i}`} data-testid="lp-lock-row">
            <td className="text-ink">{fmtUsd(l.amountUsd)}</td>
            <td className="text-right text-ink-2">{fmtDate(l.unlocksAt)}</td>
            <td className={open ? "text-right font-medium text-success" : "text-right text-ink-2"}>{open ? "Unlocked" : `Unlocks ${fmtDate(l.unlocksAt)}`}</td>
          </tr>
        );
      })}
    </DataTable>
  );
}
