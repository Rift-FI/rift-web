import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { MarketSnapshot, Side } from "@/v2/lib/premia/types";
import { fmtOddsPct, fmtPct, fmtUsdCompact } from "@/v2/lib/premia/format";
import { MarketStateChip } from "./components";

/**
 * One market. Someone scanning this list should be able to answer four
 * questions without clicking: what is being asked, what are the odds, what do
 * I press, and what do I stand to win.
 *
 * So the hierarchy is deliberate and steep: the question is the loudest thing,
 * each side gets a row with its odds set large and tabular next to its own
 * button, and the metadata footer recedes to 12px ink-3. Previously the odds
 * were small text over a thin bar with nothing to click at all.
 *
 * Built as a <div>, not a <Link> — buttons cannot nest inside an anchor, and
 * the per-side buttons are the point of the card.
 */
export function MarketCard({ snap }: { snap: MarketSnapshot }) {
  const { def } = snap;
  const soon = !!snap.notDeployed;
  const live = !!snap.live && !soon;
  const blocked = live && (!!snap.marksUnavailable || (snap.marketState ?? 0) !== 0);
  const reason = snap.blockedReason ?? snap.error ?? "Not deployed on Base yet.";

  return (
    <article
      data-testid={`market-card-${def.id}`}
      className={cn(
        // `relative` anchors the stretched link below
        "group relative flex flex-col rounded-lg border border-hairline bg-card transition-colors duration-150",
        "hover:border-hairline-strong",
        (soon || blocked) && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3 px-5 pt-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle text-[18px] ring-1 ring-hairline"
        >
          {def.flag}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-ink-3">{def.tag}</span>
            {soon ? (
              <span className="inline-flex h-[22px] items-center rounded-full bg-tint-neutral px-2 text-[12px] font-semibold text-ink-2">
                Soon
              </span>
            ) : (
              <MarketStateChip snap={snap} />
            )}
          </div>
          {/* the question is the card */}
          {/*
            Stretched link: `after:absolute after:inset-0` makes the WHOLE
            card clickable from one anchor, which is what a tile should do,
            while the outcome buttons below sit on a higher layer and stay
            independently clickable. Making the card a plain <div> with only
            the title linked silently broke "click the card".
          */}
          <Link
            to={`/app/markets/${def.id}`}
            className={cn(
              "mt-1.5 block text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink",
              "transition-colors duration-150 group-hover:text-accent-primary",
              "after:absolute after:inset-0 after:rounded-lg after:content-['']",
              "focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent-primary"
            )}
          >
            {def.question}
          </Link>
        </div>
      </div>

      {soon || blocked ? (
        <p
          className="mx-5 mt-4 rounded-md bg-surface-subtle px-3 py-2.5 text-[13px] leading-relaxed text-ink-2"
          data-testid={`market-blocked-${def.id}`}
        >
          {reason}
        </p>
      ) : (
        <div className="mt-4 space-y-2 px-5">
          <OutcomeRow snap={snap} side="rise" />
          <OutcomeRow snap={snap} side="fall" />
        </div>
      )}

      {/* metadata recedes — context, not what you scan for */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline px-5 py-3 text-[12px] text-ink-3 tabular-numeric">
        <span>{soon || snap.marksUnavailable ? "Awaiting data" : `Index ${fmtPct(snap.premium, 2)}`}</span>
        <span>{live ? `${fmtUsdCompact(snap.openInterest ?? 0)} traded · ${fmtUsdCompact(snap.oiCap ?? 0)} cap` : ""}</span>
      </div>
    </article>
  );
}

/**
 * Name, the odds set large, and the button that acts on them — one row.
 * Clicking opens the market with this side already selected.
 */
function OutcomeRow({ snap, side }: { snap: MarketSnapshot; side: Side }) {
  const { def } = snap;
  const rise = side === "rise";
  const price = rise ? snap.oddsRise : snap.oddsFall;
  const label = rise ? def.riseLabel : def.fallLabel;

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <span
        className={cn("ml-auto text-[18px] font-semibold leading-none tabular-numeric", rise ? "text-success" : "text-danger")}
        data-testid={`card-price-${side}`}
      >
        {fmtOddsPct(price)}
      </span>
      <Link
        to={`/app/markets/${def.id}?side=${side}`}
        data-testid={`card-buy-${side}`}
        className={cn(
          // z-10 lifts just the button above the card's stretched link
          "relative z-10 inline-flex h-9 w-[84px] flex-shrink-0 items-center justify-center rounded-md text-[13px] font-semibold",
          "transition-colors duration-150 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          rise
            ? "bg-tint-success text-success hover:bg-success hover:text-white focus-visible:ring-success"
            : "bg-tint-danger text-danger hover:bg-danger hover:text-white focus-visible:ring-danger"
        )}
      >
        {label}
      </Link>
    </div>
  );
}
