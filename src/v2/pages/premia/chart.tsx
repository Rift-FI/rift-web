/**
 * The probability chart.
 *
 * Polymarket's shape: a thin bright line on a quiet background, faint dotted
 * gridlines, the percentage axis on the RIGHT, an endpoint dot, a legend of
 * coloured dots above, and timeframe pills. No candlesticks and no volume
 * histogram — this is a probability over time, not a price series.
 *
 * Two series, both real: the mark (what Rise costs) and the index level
 * (how far the premium sits above its baseline). The index is what the mark
 * is tracking, so seeing them together is the whole story of the market.
 *
 * Built on TradingView lightweight-charts v4, styled from the console theme
 * tokens exactly like the Yield chart so it reads as native Rift.
 */
import { useEffect, useRef, useState } from "react";
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
import type { MarketSnapshot } from "@/v2/lib/premia/types";
import { fmtOddsPct, fmtPct } from "@/v2/lib/premia/format";

/** Segmented is typed to string values, so the range is a key, not a count. */
type Range = "1D" | "1W" | "1M" | "ALL";
const RANGES: { id: Range; label: string }[] = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "ALL", label: "All" },
];
const RANGE_DAYS: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, ALL: 120 };

function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  const dark = document.documentElement.classList.contains("dark");
  return {
    text: v("--color-ink-3", "#93a1a4"),
    grid: v("--color-hairline", dark ? "#263133" : "#e3e7e8"),
    // The two series must not read as the same line in two shades. The mark
    // is the subject (bright green, solid, 2px); the index is the context it
    // tracks (a cool slate, dashed, 1px). Side by side in teal and green they
    // were indistinguishable.
    mark: dark ? "#4cc38a" : "#1d7a4c",
    index: dark ? "#8da2c0" : "#5b6b8c",
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

interface Row {
  t: number;
  v: number;
}

/**
 * Window a step series to `cutoff` without losing the line.
 *
 * Dropping everything before the cutoff would make a 1D chart empty whenever
 * the last fill was two days ago — but "unchanged since then" is a fact, so
 * the last value before the window is carried forward to its left edge.
 * Duplicate timestamps are collapsed (several fills can share a block) because
 * the series must be strictly increasing in time.
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

function Plot({ snap, range }: { snap: MarketSnapshot; range: Range }) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const markSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const indexSeries = useRef<ISeriesApi<"Line"> | null>(null);
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
      // faint dotted horizontal gridlines only
      grid: {
        vertLines: { visible: false },
        horzLines: { color: p.grid, style: LineStyle.Dotted },
      },
      /**
       * TWO scales, because the series are not commensurable: the mark is a
       * mark is an odds percent (today ~0.0001%) and the index another percent
       * on a different scale entirely (0-4%).
       * On one axis the mark flatlines on the floor and tells you nothing.
       * Index keeps the right-hand percentage axis; the mark gets the left.
       */
      rightPriceScale: { borderVisible: false, entireTextOnly: true, scaleMargins: { top: 0.12, bottom: 0.1 } },
      leftPriceScale: { visible: true, borderVisible: false, entireTextOnly: true, scaleMargins: { top: 0.12, bottom: 0.1 } },
      // Fills happen at a time of day, not on a day, so the axis is a real
      // timestamp axis rather than a business-day one.
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: p.text, width: 1, style: LineStyle.Dotted, labelBackgroundColor: p.index },
        horzLine: { color: p.text, width: 1, style: LineStyle.Dotted, labelBackgroundColor: p.index },
      },
      handleScroll: false,
      handleScale: false,
    });
    chart.current = c;
    return () => {
      c.remove();
      chart.current = null;
      markSeries.current = null;
      indexSeries.current = null;
    };
  }, []);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const p = palette();
    for (const ref of [markSeries, indexSeries]) {
      if (ref.current) {
        c.removeSeries(ref.current);
        ref.current = null;
      }
    }

    const cutoff = Math.floor(Date.now() / 1000) - RANGE_DAYS[range] * 86_400;

    /**
     * The index is a daily oracle push; the mark is a step at every fill.
     * Both are plotted on one timestamp axis so they can be read together.
     */
    const idxRows = clip(
      snap.history.map((d) => ({ t: Math.floor(Date.parse(`${d.date}T00:00:00Z`) / 1000), v: d.premium })),
      cutoff
    );
    /**
     * REAL mark history, one point per on-chain fill. The fallback repeats the
     * current mark across the daily points, which is what this used to draw
     * for every market — a flat line that never happened. It is only reached
     * in mock mode now.
     */
    const markRows = clip(
      snap.markSeries?.length
        ? snap.markSeries.map((m) => ({ t: m.t, v: m.mark * 100 }))
        : snap.history.map((d) => ({
            t: Math.floor(Date.parse(`${d.date}T00:00:00Z`) / 1000),
            v: d.oddsRise * 100,
          })),
      cutoff
    );
    if (!idxRows.length && !markRows.length) return;

    /**
     * One precision per axis, chosen from how much that series actually moves.
     * Deciding per value produced a ladder reading 1.3% / 1.2% / 1.0000% /
     * 0.9000%, which looks like three different quantities.
     */
    const dpFor = (vals: number[]) => {
      if (!vals.length) return 2;
      const span = Math.max(...vals) - Math.min(...vals) || Math.abs(vals[0]) || 1;
      return span >= 1 ? 1 : span >= 0.1 ? 2 : span >= 0.01 ? 3 : 4;
    };

    const line = (
      color: string,
      priceScaleId: "left" | "right",
      formatter: (v: number) => string,
      sparse: boolean,
      quiet = false
    ) =>
      c.addLineSeries({
        color,
        lineWidth: quiet ? 1 : 2,
        lineStyle: quiet ? LineStyle.Dashed : LineStyle.Solid,
        priceScaleId,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        /**
         * STEPS, not a straight line between samples.
         *
         * Both series are genuinely piecewise constant: the oracle publishes
         * once a day, and the mark only moves when someone trades. A plain
         * line drawn through two samples renders a smooth climb that never
         * happened — it reads as a trend when it is two facts. Markers stay on
         * while a series is short so each reading is visibly an observation.
         */
        lineType: LineType.WithSteps,
        pointMarkersVisible: sparse,
        // per-series so each axis reads in its own unit, and so neighbouring
        // gridlines never collapse to the same label
        priceFormat: { type: "custom", minMove: 1e-8, formatter },
      });

    /**
     * The axis must be VISIBLE whenever a mark line is drawn: a line floating
     * at an unlabelled height reads against the other series' axis and means
     * nothing. The old failure was the opposite one — a pinned mark autoscales
     * to a hair's width, so every gridline rounds to the same text ("0.0001%"
     * seven times). Both are fixed by widening the scale around a flat series
     * instead of hiding it.
     */
    const markVals = markRows.map((r) => r.v);
    const markSpan = markVals.length ? Math.max(...markVals) - Math.min(...markVals) : 0;
    const flat = markVals.length > 0 && markSpan <= Math.max(1e-9, Math.abs(markVals[0]) * 1e-6);
    c.applyOptions({ leftPriceScale: { visible: markRows.length > 0 } });

    // the mark, as odds percent, on the left
    if (markRows.length) {
      // widened below when the series is flat, so label precision follows the
      // range actually shown rather than the data's zero span
      const dpMark = dpFor(flat ? [markVals[0] * 0.75, markVals[0] * 1.25] : markVals);
      const m = line(p.mark, "left", (v) => `${v.toFixed(dpMark)}%`, markRows.length <= 10);
      if (flat) {
        const v = markVals[0];
        const pad = Math.max(Math.abs(v) * 0.25, 1e-4);
        m.applyOptions({
          autoscaleInfoProvider: () => ({ priceRange: { minValue: v - pad, maxValue: v + pad } }),
        });
      }
      m.setData(markRows.map((r) => ({ time: r.t as Time, value: r.v })));
      markSeries.current = m;
    }

    // the index, in percent, on the right — quieter, because it is the thing
    // the mark is tracking rather than the price being traded
    if (idxRows.length) {
      const dpIdx = dpFor(idxRows.map((r) => r.v));
      const i = line(p.index, "right", (v) => `${v.toFixed(dpIdx)}%`, idxRows.length <= 10, true);
      i.setData(idxRows.map((r) => ({ time: r.t as Time, value: r.v })));
      indexSeries.current = i;
    }

    c.timeScale().fitContent();
  }, [snap, range]);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const p = palette();
    c.applyOptions({ layout: { textColor: p.text }, grid: { horzLines: { color: p.grid, style: LineStyle.Dotted } } });
    markSeries.current?.applyOptions({ color: p.mark });
    indexSeries.current?.applyOptions({ color: p.index });
  }, [dark]);

  return <div ref={host} className="absolute inset-0" data-testid="premia-chart-plot" />;
}

export function PremiaChart({ snap, className }: { snap: MarketSnapshot; className?: string }) {
  const [range, setRange] = useState<Range>("1M");
  const dark = useDark();
  const p = typeof document !== "undefined" ? palette() : { mark: "#1d7a4c", index: "#23757e", text: "", grid: "" };
  void dark;

  // The band gauge stays for a market with nothing to plot — but a market
  // with real fills has a mark line even if the oracle has published once.
  const thin = snap.history.length < 2 && (snap.markSeries?.length ?? 0) < 2;

  return (
    <section className={cn("min-w-0 rounded-lg border border-hairline bg-card", className)} aria-label="Market chart" data-testid="premia-chart">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="flex flex-wrap items-center gap-5">
          {/* Two percentages that mean completely different things: one is
              the price of a side, the other is the underlying reading. Say
              so, or they are indistinguishable. */}
          <Legend
            color={p.mark}
            label={`${snap.def.riseLabel} odds`}
            value={snap.marksUnavailable ? "—" : fmtOddsPct(snap.oddsRise)}
            hint="What a Rise unit costs right now, as a probability."
          />
          <Legend
            color={p.index}
            label="Index level"
            value={snap.marksUnavailable ? "—" : fmtPct(snap.premium, 2)}
            hint="The underlying reading the market settles on."
          />
        </div>
        <div className="w-[196px]">
          <Segmented
            label="Timeframe"
            size="sm"
            value={range}
            onChange={setRange}
            options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
          />
        </div>
      </div>

      <div className={cn("relative w-full", thin ? "h-auto" : "h-[300px] sm:h-[340px]")}>
        {thin ? <BandGauge snap={snap} /> : <Plot snap={snap} range={range} />}
      </div>
    </section>
  );
}

function Legend({ color, label, value, hint }: { color: string; label: string; value: string; hint?: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 text-[13px] text-ink-3" title={hint}>
      <span className="h-2 w-2 translate-y-[-1px] rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
      <span className="font-semibold text-ink tabular-numeric">{value}</span>
    </span>
  );
}

/**
 * The honest sparse state.
 *
 * The oracle publishes once per UTC day and has published once, so there is
 * no series to draw — and a candle needs an open, high and low that a single
 * daily value simply does not have. Rather than fake a line or draw a
 * degenerate candle, show the one real reading against the band that decides
 * whether it pays: the floor it must clear and the cap it tops out at.
 *
 * That turns "no chart yet" into the explanation for why Rise is priced the
 * way it is. It becomes a real series as pushes accumulate.
 */
function BandGauge({ snap }: { snap: MarketSnapshot }) {
  const floor = snap.floorPct ?? snap.def.floorPct;
  const cap = snap.capPct ?? snap.def.capPct;
  const x = snap.marksUnavailable ? 0 : snap.premium;
  // Scale so the whole band plus a little headroom is visible.
  const span = Math.max(cap * 1.15, x * 1.15, 1);
  const pos = (v: number) => `${Math.min(100, Math.max(0, (v / span) * 100))}%`;
  const paying = x > floor;

  return (
    <div className="px-5 py-6">
      <p className="text-[12px] font-medium text-ink-3">Index today</p>
      <p className="mt-1 text-[32px] font-semibold leading-none text-ink tabular-numeric">
        {snap.marksUnavailable ? "—" : fmtPct(x, 2)}
      </p>

      <div className="mt-6">
        <div className="relative h-2.5 w-full rounded-full bg-surface-subtle">
          {/* the paying band: floor → cap */}
          <div
            className="absolute inset-y-0 rounded-full bg-success/25"
            style={{ left: pos(floor), right: `calc(100% - ${pos(cap)})` }}
            aria-hidden="true"
          />
          {/* where today's reading sits */}
          {!snap.marksUnavailable && (
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-ink shadow-xs"
              style={{ left: pos(x) }}
              aria-hidden="true"
            />
          )}
        </div>
        <div className="relative mt-2 h-4 text-[12px] text-ink-3 tabular-numeric">
          <span className="absolute left-0">0%</span>
          <span className="absolute -translate-x-1/2" style={{ left: pos(floor) }}>
            {fmtPct(floor, 0)}
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: pos(cap) }}>
            {fmtPct(cap, 0)}
          </span>
        </div>
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-ink-2">
        {paying
          ? `Above the ${fmtPct(floor, 0)} floor — this market is paying out.`
          : `Pays nothing until the index clears ${fmtPct(floor, 0)}, which is why ${snap.def.riseLabel} is cheap.`}
      </p>
      <p className="mt-1 text-[12px] text-ink-3">
        {snap.history.length === 0
          ? "No readings published yet."
          : "One daily reading so far. The chart fills in as the oracle publishes."}
      </p>
    </div>
  );
}
