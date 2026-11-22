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
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { cn } from "@/lib/utils";
import type { MarketSnapshot } from "@/v2/lib/premia/types";
import { fmtCents, fmtPct } from "@/v2/lib/premia/format";

type Range = 1 | 7 | 30 | 120;
const RANGES: { id: Range; label: string }[] = [
  { id: 1, label: "1D" },
  { id: 7, label: "1W" },
  { id: 30, label: "1M" },
  { id: 120, label: "All" },
];

function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  const dark = document.documentElement.classList.contains("dark");
  return {
    text: v("--color-ink-3", "#93a1a4"),
    grid: v("--color-hairline", dark ? "#263133" : "#e3e7e8"),
    mark: dark ? "#4cc38a" : "#1d7a4c",
    index: dark ? "#3fb8b0" : "#23757e",
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
       * price in cents (today ~0.0001¢) and the index is a percentage (0–4%).
       * On one axis the mark flatlines on the floor and tells you nothing.
       * Index keeps the right-hand percentage axis; the mark gets the left.
       */
      rightPriceScale: { borderVisible: false, entireTextOnly: true, scaleMargins: { top: 0.12, bottom: 0.1 } },
      leftPriceScale: { visible: true, borderVisible: false, entireTextOnly: true, scaleMargins: { top: 0.12, bottom: 0.1 } },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true, lockVisibleTimeRangeOnResize: true },
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

    const hist = snap.history.slice(-range);
    const byTime = new Map<string, { mark: number; index: number }>();
    for (const d of hist) byTime.set(d.date, { mark: d.oddsRise * 100, index: d.premium });
    const rows = [...byTime.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (!rows.length) return;

    const line = (color: string, priceScaleId: "left" | "right", formatter: (v: number) => string) =>
      c.addLineSeries({
        color,
        lineWidth: 2,
        priceScaleId,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        pointMarkersVisible: rows.length === 1,
        // per-series so each axis reads in its own unit, and so neighbouring
        // gridlines never collapse to the same label
        priceFormat: { type: "custom", minMove: 1e-8, formatter },
      });

    /**
     * While the mark is pinned (a placeholder λ_ref, or a dead-calm market)
     * every gridline on its axis rounds to the same label — seven identical
     * "0.0001¢" rows that say nothing. Hide the axis in that case; the legend
     * still carries the live value.
     */
    const markVals = rows.map(([, v]) => v.mark);
    const markSpan = Math.max(...markVals) - Math.min(...markVals);
    const markVaries = markSpan > Math.max(1e-9, Math.abs(markVals[0]) * 1e-6);
    c.applyOptions({ leftPriceScale: { visible: markVaries } });

    // the mark, in cents, on the left
    const m = line(p.mark, "left", (v) => `${v < 1 ? v.toFixed(4) : v.toFixed(1)}¢`);
    m.setData(rows.map(([time, v]) => ({ time: time as Time, value: v.mark })));
    markSeries.current = m;

    // the index, in percent, on the right
    const i = line(p.index, "right", (v) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)}%`);
    i.setData(rows.map(([time, v]) => ({ time: time as Time, value: v.index })));
    indexSeries.current = i;

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

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-[12.5px] text-ink-3">
      <span className="h-2 w-2 translate-y-[-1px] rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
      <span className="font-semibold text-ink tabular-numeric">{value}</span>
    </span>
  );
}

export function PremiaChart({ snap, className }: { snap: MarketSnapshot; className?: string }) {
  const [range, setRange] = useState<Range>(30);
  const dark = useDark();
  const p = typeof document !== "undefined" ? palette() : { mark: "#1d7a4c", index: "#23757e", text: "", grid: "" };
  void dark;

  const thin = snap.history.length < 2;

  return (
    <section className={cn("min-w-0", className)} aria-label="Market chart" data-testid="premia-chart">
      {/* legend + timeframe pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <LegendDot color={p.mark} label={snap.def.riseLabel} value={snap.marksUnavailable ? "—" : fmtCents(snap.oddsRise)} />
          <LegendDot color={p.index} label="Index" value={snap.marksUnavailable ? "—" : fmtPct(snap.premium, 2)} />
        </div>
        <div role="group" aria-label="Timeframe" className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "h-7 cursor-pointer rounded-full px-2.5 text-[12px] font-semibold tabular-numeric transition-colors",
                range === r.id ? "bg-ink text-canvas" : "bg-surface-subtle text-ink-3 hover:text-ink"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("relative mt-3 w-full rounded-xl border border-hairline bg-card", thin ? "h-[180px]" : "h-[300px] sm:h-[340px]")}>
        {thin ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
            <p className="text-[24px] font-semibold leading-none text-ink tabular-numeric">
              {snap.marksUnavailable ? "—" : fmtCents(snap.oddsRise)}
            </p>
            {/* was a sentence explaining why there is no line; the label
                says it in two words and the number carries the rest */}
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
              {snap.history.length === 0 ? "No data" : "One reading"}
            </p>
          </div>
        ) : (
          <Plot snap={snap} range={range} />
        )}
      </div>
    </section>
  );
}
