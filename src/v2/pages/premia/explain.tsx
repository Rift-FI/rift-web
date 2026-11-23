/**
 * "What am I actually trading?" — answered on the page, not in a disclosure.
 *
 * The market's question is "will Nigeria's street-dollar premium spike?", and
 * until now the page answered it with the word "index" and a percentage. Those
 * are the two things a newcomer cannot decode, so this builds the chain in
 * front of them with live numbers in it:
 *
 *     street ₦ ÷ official ₦  →  premium  →  − baseline  →  stress  →  payout
 *
 * and then draws the payout band so "stress rises, the index rises, the thing
 * starts paying" is a picture rather than a sentence.
 */
import { useEffect, useState } from "react";
import { ArrowDown, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { addressUrl } from "@/v2/lib/premia/config";
import { fmtPoints } from "@/v2/lib/premia/format";
import { DAILY_POINT_CAP, POINTS_RULE } from "@/v2/lib/premia/points";
import type { HistorySeries } from "@/v2/lib/premia/history";
import type { MarketSnapshot } from "@/v2/lib/premia/types";

const pct = (v: number, dp = 2) => `${v.toFixed(dp)}%`;
const naira = (v: number) => `₦${Math.round(v).toLocaleString("en-US")}`;

/* ── the chain, with live numbers ──────────────────────────────────────── */

function Step({
  n,
  label,
  value,
  children,
}: {
  n: number;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle text-[11px] font-semibold text-ink-3"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[13px] font-semibold text-ink">{label}</span>
          {/* proportional, not tabular: these are standalone figures, not a column */}
          <span className="text-[15px] font-semibold text-ink">{value}</span>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{children}</p>
      </div>
    </div>
  );
}

function Rung() {
  return (
    <div aria-hidden="true" className="ml-2.5 flex h-4 items-center">
      <ArrowDown className="h-3.5 w-3.5 text-ink-3" />
    </div>
  );
}

/**
 * Where the index sits between "pays nothing" and "pays everything".
 *
 * The band is the payout function I = clamp((X−F)/(C−F), 0, 1) drawn to
 * scale: everything left of the floor is dead, the ramp is live, and the pin
 * is today. It is the only place on the page that makes the floor feel like a
 * distance rather than a footnote.
 */
function PayoutBand({ index, floor, cap }: { index: number; floor: number; cap: number }) {
  const span = Math.max(cap, index * 1.1, floor * 1.5);
  const frac = (v: number) => Math.min(100, Math.max(0, (v / span) * 100));
  const at = (v: number) => `${frac(v)}%`;
  const paying = index > floor;
  /**
   * A centred label on a pin near either end hangs off the track. A calm
   * market sits at index 0, which is exactly the left end — so the label
   * anchors to the edge it is near instead of straddling it.
   */
  const pinAt = frac(index);
  const pinAnchor = pinAt < 10 ? "left-0 translate-x-0" : pinAt > 90 ? "right-0 translate-x-0" : "left-1/2 -translate-x-1/2";
  return (
    <div className="mt-1">
      {/* top padding leaves room for the pin's value label */}
      <div className="relative mt-5 h-9">
        {/* dead zone / live ramp, split at the floor */}
        <div className="absolute inset-x-0 top-3 h-2.5 overflow-hidden rounded-full bg-surface-subtle">
          <div
            className="absolute inset-y-0 left-0 bg-surface"
            style={{ width: at(floor) }}
            aria-hidden="true"
          />
          {/* The ramp has to be visible AT the floor, not fade in from it —
              "a unit starts paying the moment this is crossed" is the point. */}
          <div
            className="absolute inset-y-0 bg-gradient-to-r from-success/25 to-success"
            style={{ left: at(floor), right: `calc(100% - ${at(cap)})` }}
            aria-hidden="true"
          />
        </div>
        {/* floor + cap ticks */}
        {[
          { v: floor, t: `Pays above ${pct(floor, 0)}` },
          { v: cap, t: `Max ${pct(cap, 0)}` },
        ].map((m) => (
          <div key={m.t} className="absolute top-1.5 -translate-x-1/2" style={{ left: at(m.v) }}>
            <span aria-hidden="true" className="block h-5 w-px bg-hairline-strong" />
          </div>
        ))}
        {/* today */}
        <div className="absolute top-0 -translate-x-1/2" style={{ left: at(index) }}>
          <span
            aria-hidden="true"
            className={cn("block h-8 w-[3px] rounded-full", paying ? "bg-success" : "bg-accent-primary")}
          />
          <span
            className={cn(
              "absolute -top-[3px] -translate-y-full whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold text-white",
              pinAnchor,
              paying ? "bg-success" : "bg-accent-primary"
            )}
          >
            {pct(index)}
          </span>
        </div>
      </div>
      <div className="relative mt-1 h-4 text-[11.5px] text-ink-3">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: at(floor) }}>
          {pct(floor, 0)} floor
        </span>
        <span className="absolute right-0">{pct(cap, 0)} cap</span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        {paying ? (
          <>
            The index has cleared the floor, so every unit is paying{" "}
            <span className="font-semibold text-ink">{pct(((index - floor) / (cap - floor)) * 100, 0)}</span> of its $1
            right now.
          </>
        ) : (
          <>
            It needs another{" "}
            <span className="font-semibold text-ink">{pct(floor - index)}</span> of stress before a unit pays anything
            at all. Below the floor, {`▲`} Rise settles at zero.
          </>
        )}
      </p>
    </div>
  );
}

export function WhatYouAreTrading({
  snap,
  hist,
  className,
}: {
  snap: MarketSnapshot;
  hist: HistorySeries | null;
  className?: string;
}) {
  const { def } = snap;
  const floor = snap.floorPct ?? def.floorPct;
  const cap = snap.capPct ?? def.capPct;
  const last = hist?.points.at(-1);
  /**
   * The chain has to ADD UP. An earlier version showed today's raw premium,
   * the baseline, and then the on-chain index — three numbers from two
   * different series, so step 2 minus step 3 visibly did not equal step 4.
   * Every rung now comes from the same reconstruction, and the on-chain
   * reading is stated beside it rather than smuggled into the arithmetic.
   */
  const index = last ? last.index * 100 : snap.live ? snap.premium : 0;
  const onChain = snap.live ? snap.premium : null;
  const [open, setOpen] = useState(false);

  return (
    <section className={cn("rounded-lg border border-hairline bg-card", className)} data-testid="premia-explain">
      {/* COLLAPSED BY DEFAULT. Everything here is reference: someone who
          already knows what a street premium is should see the chart and the
          ticket, not four paragraphs explaining them. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
        data-testid="premia-explain-toggle"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-ink">What you're trading</span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-3">
            Stress, not the naira — and what it takes to get paid
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 flex-shrink-0 text-ink-3 transition-transform duration-150", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {!open ? null : (
      <div className="border-t border-hairline px-5 py-5">
      <p className="text-[13px] leading-relaxed text-ink-2">
        Not the naira, and not the price of a dollar. You're trading how <span className="font-medium text-ink">stressed</span>{" "}
        the naira is — how far the street has pulled away from the official rate, compared with how far it normally sits.
      </p>

      <div className="mt-5 space-y-0">
        <Step
          n={1}
          label="Two prices for one dollar"
          value={last ? `${naira(last.street)} vs ${naira(last.official)}` : "—"}
        >
          Officially a dollar costs one thing. On the street it costs more. Everyone in Lagos knows both numbers.
        </Step>
        <Rung />
        <Step n={2} label="The premium" value={last ? pct(last.rBar * 100) : "—"}>
          The gap between them, as a percentage — averaged over a week, so one odd print can't move the market. Today
          on its own is {last ? pct(last.premium * 100) : "—"}.
        </Step>
        <Rung />
        <Step n={3} label="Minus its normal level" value={last ? pct(last.baseline * 100) : "—"}>
          A premium that has been 5% for a year isn't stress, it's just Tuesday. So the market subtracts a slow-moving
          baseline of where the premium normally sits.
        </Step>
        <Rung />
        <Step n={4} label="Stress index" value={pct(index)}>
          What's left is the stress — the part of today's premium that is genuinely <em>unusual</em>. This is the number
          the market settles on.
        </Step>
      </div>

      {onChain !== null && last && Math.abs(onChain - index) > 0.05 && (
        <p className="mt-4 rounded-md bg-surface-subtle px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-3">
          On chain the index currently reads <span className="font-semibold text-ink-2">{pct(onChain)}</span>. The
          oracle began publishing on 22 Nov, so its baseline is measured against yesterday rather than against a year —
          the figures converge as it accumulates history. The chain's number is the one positions settle on.
        </p>
      )}

      <div className="mt-5 border-t border-hairline pt-4">
        <p className="text-[12px] font-medium text-ink-3">What it pays</p>
        <PayoutBand index={index} floor={floor} cap={cap} />
      </div>

      <div className="mt-5 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
        <div className="rounded-md bg-tint-success px-3.5 py-3">
          <p className="text-[13px] font-semibold text-success">▲ {def.riseLabel} — stress goes up</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            You win if the street pulls further from the official rate. A devaluation scare, a dollar shortage, an
            election wobble.
          </p>
        </div>
        <div className="rounded-md bg-tint-danger px-3.5 py-3">
          <p className="text-[13px] font-semibold text-danger">▼ {def.fallLabel} — stress stays calm</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            You win if it settles back toward normal. This is the side that gets paid while nothing happens.
          </p>
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
        Each unit pays at most $1, and the payout is capped at {pct(cap, 0)}. You can close any time at the live price —
        there is no expiry date and nothing to wait for.
      </p>

      {/* The reference matter that used to sit loose on the page. */}
      <div className="mt-5 space-y-2 border-t border-hairline pt-4 text-[12px] leading-relaxed text-ink-3">
        {hist && (
          <p>
            <span className="font-medium text-ink-2">History:</span> over the last {hist.days} days the premium peaked
            at {pct(hist.peak.premium * 100)} and sat above the {pct(floor, 0)} floor on {hist.daysAboveFloor} of them.
          </p>
        )}
        <p>
          <span className="font-medium text-ink-2">Points:</span> {POINTS_RULE} Capped at {fmtPoints(DAILY_POINT_CAP)}{" "}
          per wallet per day. The conversion rate at launch is not yet set.
        </p>
        <p>
          <span className="font-medium text-ink-2">Sources:</span> street price from Quidax, official rate FX-derived
          via CoinGecko — a reconstruction for context. The index positions settle on is the one published on chain.
        </p>
        {snap.address && (
          <p>
            Market{" "}
            <a
              href={addressUrl(snap.address)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-accent-primary hover:underline"
              data-testid="market-address"
            >
              {snap.address.slice(0, 10)}…{snap.address.slice(-6)}
            </a>{" "}
            on Base. Positions are in test tokens with no monetary value.
          </p>
        )}
      </div>
      </div>
      )}
    </section>
  );
}

/* ── first-visit walkthrough ───────────────────────────────────────────── */

const TOUR_KEY = "premia.tour.v1";

const STEPS = [
  {
    title: "This isn't a currency bet",
    body: "You're not betting on the naira's price. You're betting on how stressed it is — how far the street dollar has pulled away from the official rate.",
  },
  {
    title: "The index is the unusual part",
    body: "A premium that's been sitting at 5% for a year is normal, not stress. The market subtracts a slow baseline and trades whatever is left over.",
  },
  {
    title: "Rise or Fall, and you can leave",
    body: "Rise wins if stress climbs. Fall wins if it stays calm. There is no expiry — close at the live price whenever you want.",
  },
  {
    title: "The holding cost is funding",
    body: "Whichever side is favoured pays the other a small amount each day. Your position row shows it as a per-day figure, so you always know what sitting still costs.",
  },
];

/** True once, on a device that has never opened a PREMIA market before. */
function useFirstVisit(): [boolean, () => void] {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) setOpen(true);
    } catch {
      /* blocked storage — just never show it rather than show it every load */
    }
  }, []);
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(TOUR_KEY, String(Date.now()));
    } catch {
      /* nothing to do; the tour simply isn't suppressed next time */
    }
  };
  return [open, close];
}

export function FirstVisitTour() {
  const [open, close] = useFirstVisit();
  const [i, setI] = useState(0);
  if (!open) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premia-tour-title"
      data-testid="premia-tour"
    >
      <div className="w-full max-w-[420px] rounded-xl border border-hairline bg-card p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] font-medium text-ink-3">
            New here · {i + 1} of {STEPS.length}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Skip the introduction"
            className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors duration-150 hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="premia-tour-title" className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.01em] text-ink">
          {step.title}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{step.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div aria-hidden="true" className="flex gap-1.5">
            {STEPS.map((s, n) => (
              <span
                key={s.title}
                className={cn("h-1.5 rounded-full transition-all duration-200", n === i ? "w-5 bg-ink-2" : "w-1.5 bg-surface")}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (last ? close() : setI((v) => v + 1))}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent-primary px-4 text-[13px] font-semibold text-white transition-opacity duration-150 hover:opacity-90 cursor-pointer"
            data-testid="premia-tour-next"
          >
            {last ? (
              <>
                <Check className="h-3.5 w-3.5" /> Got it
              </>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
