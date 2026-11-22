import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { MarketSnapshot } from "@/v2/lib/premia/types";
import { fmtPct, fmtPrmCompact } from "@/v2/lib/premia/format";
import { OddsBar, MarketStateChip } from "./components";

/**
 * One market: the question leads, the odds sit under it, everything else is a
 * single quiet line. A market that isn't open yet says so plainly — that is a
 * deliberate state, not a fault.
 */
export function MarketCard({ snap }: { snap: MarketSnapshot }) {
  const { def } = snap;
  const soon = !!snap.notDeployed;
  const live = !!snap.live && !soon;
  const blocked = live && (!!snap.marksUnavailable || (snap.marketState ?? 0) !== 0);
  const reason = snap.blockedReason ?? snap.error ?? "Not deployed on Base yet.";

  return (
    <Link
      to={`/app/markets/${def.id}`}
      data-testid={`market-card-${def.id}`}
      className={cn(
        "group flex flex-col rounded-xl border border-hairline bg-card p-4 transition-all duration-150",
        "hover:border-hairline-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
        (soon || blocked) && "opacity-75"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-subtle text-[20px]" aria-hidden="true">
          {def.flag}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-3">{def.tag}</span>
            {soon ? (
              <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                Soon
              </span>
            ) : (
              <MarketStateChip snap={snap} />
            )}
          </div>
          {/* the question is the card */}
          <p className="mt-1 text-[15.5px] font-semibold leading-snug text-ink group-hover:text-accent-primary">
            {def.question}
          </p>
        </div>
      </div>

      {/* the per-market blurb used to sit here; the question is the card */}
      {soon || blocked ? (
        <p className="mt-3 rounded-md bg-surface-subtle px-2.5 py-2 text-[12px] leading-relaxed text-ink-3" data-testid={`market-blocked-${def.id}`}>
          {reason}
        </p>
      ) : (
        <div className="mt-3">
          <OddsBar snap={snap} size="sm" />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2.5 text-[11.5px] text-ink-3 tabular-numeric">
        <span>
          {soon || snap.marksUnavailable ? "Awaiting data" : `Index ${fmtPct(snap.premium, 2)}`}
        </span>
        <span>{live ? `${fmtPrmCompact(snap.oiCap ?? 0, false)} cap` : ""}</span>
      </div>
    </Link>
  );
}
