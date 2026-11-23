/**
 * The market chart.
 *
 * ONE AXIS PER VIEW. The previous build drew the mark and the index on two
 * price scales at once, which put the index's 0.59% at the height where the
 * left axis read 1.30% — the single most reliable way to make a chart lie.
 * Measures in different units now live in different tabs instead, which is
 * also how a trader actually reads them: "what is the premium doing" and
 * "what do the odds cost" are two questions, not one picture.
 *
 * The four views answer, in order, the four things someone has to know before
 * they can have an opinion:
 *   Premium   what the market's question is literally asking about
 *   Rates     where that premium comes from — two prices for one dollar
 *   Stress    how the premium becomes the number that pays
 *   Odds      what a bet on it costs
 *
 * Colors are the validated categorical slots 1 and 2 (blue, orange), stepped
 * per mode and checked against Rift's own card surfaces in both — never the
 * reserved success/warning/danger tokens, which mean state, not identity.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  LineType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { cn } from "@/lib/utils";
import { Segmented } from "@/v2/ui";
import type { HistorySeries } from "@/v2/lib/premia/history";
import type { HistoryState } from "@/v2/lib/premia/use-history";
import type { MarketSnapshot } from "@/v2/lib/premia/types";

/* ── palette ───────────────────────────────────────────────────────────── */

/**
 * Categorical slots 1–2. Both modes validated against Rift's card surfaces
 * (#ffffff / #141b1d): lightness band, chroma floor, CVD separation ΔE 24.7
 * light / 26.8 dark, normal-vision ΔE 33.6 / 31.8, contrast ≥ 3:1 — all pass.
 * The dark column is the same two hues stepped for a dark surface, not a flip.
 */
const SERIES = {
  light: { a: "#2a78d6", b: "#eb6834" },
  dark: { a: "#3987e5", b: "#d95926" },
};

function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  const dark = document.documentElement.classList.contains("dark");
  return {
    text: v("--color-ink-3", dark ? "#93a1a4" : "#566265"),
    grid: v("--color-hairline", dark ? "#263133" : "#e3e7e8"),
    ...(dark ? SERIES.dark : SERIES.light),
  };
}

function useDark() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ── shapes ────────────────────────────────────────────────────────────── */

type TabId = "premium" | "rates" | "stress" | "odds";
type Range = "1M" | "3M" | "1Y";

const RANGE_DAYS: Record<Range, number> = { "1M": 30, "3M": 90, "1Y": 366 };

interface Row {
  t: number;
  v: number;
}

interface Line {
  key: string;
  label: string;
  /** "a" = subject, "b" = the thing it is measured against. */
  slot: "a" | "b";
  rows: Row[];
  /** Step rather than slope — true for anything that only moves on an event. */
  step?: boolean;
}

interface RefLine {
  price: number;
  label: string;
}

interface View {
  id: TabId;
  tab: string;
  heading: string;
  value: string;
  /** Second reading that would otherwise contradict the headline. */
  sub?: string;
  caption: string;
  unit: "pct" | "ngn";
  lines: Line[];
  refs?: RefLine[];
  /** Points land at a time of day, not on a day — show the clock on the axis. */
  intraday?: boolean;
  note?: string;
  /** Shown instead of the plot when there is nothing honest to draw. */
  empty?: string;
}

/* ── formatting ────────────────────────────────────────────────────────── */

const pct = (v: number, dp = 2) => `${v.toFixed(dp)}%`;
const naira = (v: number) => `₦${Math.round(v).toLocaleString("en-US")}`;
const fmtFor = (unit: "pct" | "ngn", dp: number) => (unit === "ngn" ? naira : (v: number) => pct(v, dp));

/** Decimal places that suit how much the series actually moves. */
function dpFor(vals: number[]): number {
  if (!vals.length) return 2;
  const span = Math.max(...vals) - Math.min(...vals) || Math.abs(vals[0]) || 1;
  return span >= 10 ? 0 : span >= 1 ? 1 : span >= 0.1 ? 2 : 3;
}

/**
 * Window to the range without dropping the line.
 *
 * Cutting everything before the cutoff empties a 1M view whenever the last
 * event was five weeks ago — but "unchanged since then" is a fact, so the last
 * value before the window is carried to its left edge. Duplicate timestamps
 * collapse, because the series has to be strictly increasing in time.
 */
function clip(rows: Row[], cutoff: number): Row[] {
  const by = new Map<number, number>();
  for (const r of rows) if (Number.isFinite(r.t) && Number.isFinite(r.v)) by.set(r.t, r.v);
  const all = [...by.entries()].map(([t, v]) => ({ t, v })).sort((a, b) => a.t - b.t);
  const inside = all.filter((r) => r.t >= cutoff);
  const before = all.filter((r) => r.t < cutoff).pop();
  if (before && (!inside.length || inside[0].t > cutoff)) inside.unshift({ t: cutoff, v: before.v });
  return inside;
}

/* ── views ─────────────────────────────────────────────────────────────── */

/**
 * Build every view from the snapshot plus the reconstruction. Each one is a
 * single unit on a single axis; nothing here can produce a two-scale plot.
 */
function buildViews(snap: MarketSnapshot, hist: HistorySeries | null, histFailed: boolean): View[] {
  const { def } = snap;
  const floor = snap.floorPct ?? def.floorPct;
  const cap = snap.capPct ?? def.capPct;
  const pts = hist?.points ?? [];
  const last = pts.at(-1);

  const unavailable = histFailed
    ? "The public price feeds behind this view aren't reachable right now."
    : "Still loading a year of prints…";

  /* 1 — the premium itself: what the market's question is about. */
  const premium: View = {
    id: "premium",
    tab: "Premium",
    heading: "Street-dollar premium",
    value: last ? pct(last.premium * 100) : "—",
    caption: "How much more a dollar costs on the street than at the official rate.",
    unit: "pct",
    lines: last
      ? [{ key: "premium", label: "Premium", slot: "a", rows: pts.map((p) => ({ t: p.t, v: p.premium * 100 })) }]
      : [],
    // The cap sits far off the top of this scale, so a line for it would be
    // invisible and pull the axis precision with it. It is drawn to scale in
    // the payout band below the chart instead.
    refs: [{ price: floor, label: `Pays above ${pct(floor, 0)}` }],
    note: hist
      ? `Over the last ${hist.days} days it peaked at ${pct(hist.peak.premium * 100)} and sat above the ${pct(
          floor,
          0
        )} floor on ${hist.daysAboveFloor} of them. Payout is capped at ${pct(cap, 0)}.`
      : undefined,
    empty: last ? undefined : unavailable,
  };

  /* 2 — where the premium comes from. Two prices, one unit, one axis. */
  const rates: View = {
    id: "rates",
    tab: "Rates",
    heading: "What a dollar costs",
    value: last ? `${naira(last.street)} / ${naira(last.official)}` : "—",
    caption: "Street price against the official rate. The gap between the lines is the premium.",
    unit: "ngn",
    lines: last
      ? [
          { key: "street", label: "Street", slot: "a", rows: pts.map((p) => ({ t: p.t, v: p.street })) },
          { key: "official", label: "Official", slot: "b", rows: pts.map((p) => ({ t: p.t, v: p.official })) },
        ]
      : [],
    empty: last ? undefined : unavailable,
  };

  /* 3 — how the premium turns into the number that pays. */
  const settled = hist ? pts.slice(hist.settledFrom) : [];
  const stressLast = settled.at(-1);
  const stress: View = {
    id: "stress",
    tab: "Stress",
    heading: "Stress index",
    // The headline must agree with the picture under it. The chart is the
    // reconstruction, so the headline is too — and the on-chain reading, which
    // is the one with money on it, sits beside it rather than silently
    // replacing it.
    value: stressLast ? pct(stressLast.index * 100) : snap.live ? pct(snap.premium) : "—",
    sub: stressLast && snap.live ? `${pct(snap.premium)} on chain` : undefined,
    caption: "How far the premium has pulled above its own slow baseline. This is what you trade.",
    unit: "pct",
    lines: stressLast
      ? [
          { key: "rbar", label: "Premium (7-day avg)", slot: "a", rows: settled.map((p) => ({ t: p.t, v: p.rBar * 100 })) },
          { key: "base", label: "Baseline", slot: "b", rows: settled.map((p) => ({ t: p.t, v: p.baseline * 100 })) },
        ]
      : [],
    refs: [{ price: floor, label: `Pays above ${pct(floor, 0)}` }],
    note: stressLast
      ? `The gap between the two lines is the index. On chain it reads ${pct(
          snap.premium
        )} instead, because the oracle's own baseline only began on 22 Nov — it is measuring against yesterday, not against a year. The two converge as it accumulates history.`
      : undefined,
    empty: stressLast ? undefined : unavailable,
  };

  /* 4 — the price of a bet. On-chain fills only; never reconstructed. */
  const marks = snap.markSeries ?? [];
  const odds: View = {
    id: "odds",
    tab: "Odds",
    heading: `${def.riseLabel} odds`,
    value: snap.marksUnavailable ? "—" : pct(snap.oddsRise * 100),
    caption: `What one unit of ${def.riseLabel} costs. It only moves when somebody trades.`,
    unit: "pct",
    intraday: true,
    lines: marks.length
      ? [{ key: "mark", label: `${def.riseLabel} odds`, slot: "a", step: true, rows: marks.map((m) => ({ t: m.t, v: m.mark * 100 })) }]
      : [],
    empty: marks.length ? undefined : "No trades yet, so the odds have no history to draw.",
  };

  return [premium, rates, stress, odds];
}

/* ── plot ──────────────────────────────────────────────────────────────── */

function Plot({ view, range }: { view: View; range: Range }) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Line">[]>([]);
  const dark = useDark();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const p = palette();
    const c = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: p.text,
        fontSize: 11,
        fontFamily: "inherit",
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: p.grid, style: LineStyle.Solid } },
      // ONE scale. The left is never enabled — that is the whole point.
      rightPriceScale: { borderVisible: false, entireTextOnly: true, scaleMargins: { top: 0.14, bottom: 0.12 } },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        // Daily prints: a date reads better than a clock, and mixing the two
        // produced the "10:43 · 23 · 07:46" axis nobody could parse.
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: p.text, width: 1, style: LineStyle.Dotted, labelVisible: true },
        horzLine: { color: p.text, width: 1, style: LineStyle.Dotted, labelVisible: true },
      },
      handleScroll: false,
      handleScale: false,
    });
    chart.current = c;
    return () => {
      c.remove();
      chart.current = null;
      series.current = [];
    };
  }, []);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const p = palette();
    for (const s of series.current) c.removeSeries(s);
    series.current = [];

    const cutoff = Math.floor(Date.now() / 1000) - RANGE_DAYS[range] * 86_400;
    const drawn = view.lines.map((l) => ({ ...l, rows: clip(l.rows, cutoff) })).filter((l) => l.rows.length);
    if (!drawn.length) return;

    // One precision for the whole axis, taken from every series on it — a
    // ladder reading 1.3% / 1.2% / 1.0000% looks like three different things.
    // Reference lines are deliberately EXCLUDED: a threshold far outside the
    // plotted range (the 30% cap over a 2–8% premium) inflates the span and
    // rounds every real label to a whole number.
    const all = drawn.flatMap((l) => l.rows.map((r) => r.v));

    /**
     * A SERIES THAT HAS NOT MOVED STILL NEEDS A READABLE AXIS.
     *
     * The odds only change when somebody trades, so between fills the series
     * is perfectly flat — and lightweight-charts autoscales a zero-span series
     * to a hair's width, which rounds every gridline to the same text ("1.0%"
     * seven times). Widening the range around the value fixes the labels and
     * tells the truth: the line is flat because nothing happened.
     */
    const span = all.length ? Math.max(...all) - Math.min(...all) : 0;
    const flat = all.length > 0 && span <= Math.max(1e-9, Math.abs(all[0]) * 1e-6);
    const pad = flat ? Math.max(Math.abs(all[0]) * 0.25, 1e-4) : 0;
    const dp = dpFor(flat ? [all[0] - pad, all[0] + pad] : all);
    const fmt = fmtFor(view.unit, dp);

    // Daily prints read better as dates; fills need the clock, or two trades
    // three hours apart both render as "23".
    c.timeScale().applyOptions({ timeVisible: !!view.intraday });

    for (const l of drawn) {
      const s = c.addLineSeries({
        color: l.slot === "a" ? p.a : p.b,
        lineWidth: 2,
        lineStyle: l.slot === "a" ? LineStyle.Solid : LineStyle.Dashed,
        priceScaleId: "right",
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        // A daily print and a fill are both piecewise constant; a smooth
        // climb between two samples renders a trend that never happened.
        lineType: l.step ? LineType.WithSteps : LineType.Simple,
        pointMarkersVisible: l.rows.length <= 12,
        priceFormat: { type: "custom", minMove: 1e-8, formatter: fmt },
      });
      if (flat) {
        const v = all[0];
        s.applyOptions({
          autoscaleInfoProvider: () => ({ priceRange: { minValue: v - pad, maxValue: v + pad } }),
        });
      }
      s.setData(l.rows.map((r) => ({ time: r.t as Time, value: r.v })));
      series.current.push(s);
    }

    // Thresholds are not series: recessive, dashed, labelled in words.
    const host = series.current[0];
    for (const r of view.refs ?? []) {
      host.createPriceLine({
        price: r.price,
        color: p.text,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: r.label,
      });
    }

    c.timeScale().fitContent();
  }, [view, range, dark]);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const p = palette();
    c.applyOptions({ layout: { textColor: p.text }, grid: { horzLines: { color: p.grid, style: LineStyle.Solid } } });
  }, [dark]);

  return <div ref={host} className="absolute inset-0" data-testid="premia-chart-plot" />;
}

/* ── the card ──────────────────────────────────────────────────────────── */

export function PremiaChart({
  snap,
  hist,
  histState,
  className,
}: {
  snap: MarketSnapshot;
  hist: HistorySeries | null;
  histState: HistoryState;
  className?: string;
}) {
  const data = hist;
  const state = histState;
  const [tab, setTab] = useState<TabId>("premium");
  const [range, setRange] = useState<Range>("3M");
  const dark = useDark();
  const colors = typeof document !== "undefined" ? palette() : SERIES.light;
  void dark;

  const views = useMemo(() => buildViews(snap, data, state === "failed"), [snap, data, state]);
  const view = views.find((v) => v.id === tab) ?? views[0];

  return (
    <section className={cn("rounded-lg border border-hairline bg-card", className)} data-testid="premia-chart">
      {/* tabs + range, one row, filters above the plot */}
      {/* Side by side where there is room; stacked on a phone, because four
          tabs sharing a row with the range picker truncates them to "P… R…". */}
      <div className="flex flex-col gap-2.5 border-b border-hairline px-5 py-3.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 sm:flex-1">
          <Segmented
            label="Chart"
            value={tab}
            onChange={(v) => setTab(v as TabId)}
            size="sm"
            options={views.map((v) => ({ value: v.id, label: v.tab }))}
          />
        </div>
        <div className="w-full sm:w-[150px] sm:flex-shrink-0">
          <Segmented
            label="Range"
            value={range}
            onChange={(v) => setRange(v as Range)}
            size="sm"
            options={(["1M", "3M", "1Y"] as Range[]).map((r) => ({ value: r, label: r }))}
          />
        </div>
      </div>

      <div className="px-5 pt-4">
        <p className="text-[12px] font-medium text-ink-3">{view.heading}</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {view.value}
          {view.sub && <span className="text-[13px] font-medium text-ink-3">{view.sub}</span>}
        </p>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-2">{view.caption}</p>
      </div>

      {view.empty ? (
        <p className="px-5 py-14 text-center text-[13px] text-ink-3">{view.empty}</p>
      ) : (
        <>
          <div className="relative mt-3 h-[260px] w-full sm:h-[300px]">
            <Plot view={view} range={range} />
          </div>
          {/* Identity is never colour alone: a legend whenever there are two,
              and the thresholds are named here because a bare dashed line on
              the plot says nothing about what crossing it means. */}
          {(view.lines.length > 1 || view.refs?.length) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 pt-3">
              {view.lines.length > 1 &&
                view.lines.map((l) => (
                  <span key={l.key} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
                    <span
                      aria-hidden="true"
                      className="h-0.5 w-4 rounded-full"
                      style={{ backgroundColor: l.slot === "a" ? colors.a : colors.b }}
                    />
                    {l.label}
                  </span>
                ))}
              {view.refs?.map((r) => (
                <span key={r.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
                  <span
                    aria-hidden="true"
                    className="h-0 w-4 border-t border-dashed border-current opacity-80"
                  />
                  {r.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="pb-4" />
    </section>
  );
}
