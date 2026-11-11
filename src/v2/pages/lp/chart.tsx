import { useEffect, useRef, useState } from "react";
import { ColorType, CrosshairMode, createChart, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { cn } from "@/lib/utils";
import { fmtUsd, useLpHistory, type LpHistoryDay, type LpHistoryRange } from "@/v2/lib/lp";

export type ChartMetric = "pool" | "volume" | "fees";

const METRICS: { id: ChartMetric; label: string }[] = [
  { id: "pool", label: "Pool size" },
  { id: "volume", label: "Volume" },
  { id: "fees", label: "LP earnings" },
];
const RANGES: { id: LpHistoryRange; label: string }[] = [
  { id: 30, label: "30D" },
  { id: 90, label: "90D" },
  { id: 365, label: "1Y" },
];

/** Theme colours from the console tokens (re-read when html.dark flips). */
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const dark = document.documentElement.classList.contains("dark");
  return {
    bg: v("--color-card", dark ? "#141b1d" : "#ffffff"),
    text: v("--color-ink-3", "#93a1a4"),
    grid: v("--color-hairline", dark ? "#263133" : "#e3e7e8"),
    accent: dark ? "#3fb8b0" : "#23757e",
    accentFill: dark ? "rgba(63,184,176,0.28)" : "rgba(35,117,126,0.22)",
    accentFade: dark ? "rgba(63,184,176,0.02)" : "rgba(35,117,126,0.02)",
    bar: dark ? "rgba(63,184,176,0.75)" : "rgba(35,117,126,0.7)",
  };
}

function valueOf(d: LpHistoryDay, m: ChartMetric) {
  return m === "pool" ? d.poolUsd : m === "volume" ? d.volumeUsd : d.lpFeesUsd;
}

const compactUsd = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 10_000 ? `$${(n / 1_000).toFixed(1)}K` : n > 0 && n < 1 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString("en-US")}`;

function useDarkClass() {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function Plot({ days, metric }: { days: LpHistoryDay[]; metric: ChartMetric }) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Area"> | ISeriesApi<"Histogram"> | null>(null);
  const dark = useDarkClass();

  // One chart per mount; resized with its box.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const p = palette();
    const c = createChart(el, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: p.text, fontSize: 11, fontFamily: "inherit", attributionLogo: false },
      grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
      rightPriceScale: { borderVisible: false, entireTextOnly: true, scaleMargins: { top: 0.12, bottom: 0.04 } },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true, rightOffset: 0, lockVisibleTimeRangeOnResize: true },
      crosshair: { mode: CrosshairMode.Magnet },
      handleScroll: false,
      handleScale: false,
      localization: { priceFormatter: compactUsd },
    });
    chart.current = c;
    return () => {
      c.remove();
      chart.current = null;
      series.current = null;
    };
  }, []);

  // Re-theme without rebuilding.
  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const p = palette();
    c.applyOptions({ layout: { textColor: p.text }, grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } } });
    const s = series.current as any;
    if (!s) return;
    if (metric === "pool") s.applyOptions({ lineColor: p.accent, topColor: p.accentFill, bottomColor: p.accentFade });
    else s.applyOptions({ color: p.bar });
  }, [dark, metric]);

  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    if (series.current) {
      c.removeSeries(series.current as any);
      series.current = null;
    }
    const p = palette();
    const data = days.map((d) => ({ time: d.date as Time, value: valueOf(d, metric) }));
    const s =
      metric === "pool"
        ? c.addAreaSeries({ lineColor: p.accent, topColor: p.accentFill, bottomColor: p.accentFade, lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
        : c.addHistogramSeries({ color: p.bar, priceLineVisible: false, lastValueVisible: false });
    s.setData(data as any);
    series.current = s as any;
    c.timeScale().fitContent();
  }, [days, metric]);

  return <div ref={host} className="absolute inset-0" />;
}

/** Pool size / volume / LP earnings over 30D · 90D · 1Y. Real data only. */
export function ChartPanel({ className }: { className?: string }) {
  const [metric, setMetric] = useState<ChartMetric>("pool");
  const [range, setRange] = useState<LpHistoryRange>(30);
  const q = useLpHistory(range);
  const days = q.data ?? [];
  const latest = days.length ? days[days.length - 1] : null;
  const total = days.reduce((s, d) => s + valueOf(d, metric), 0);
  const empty = !q.isLoading && !q.isError && days.every((d) => valueOf(d, metric) === 0);
  const headline = metric === "pool" ? (latest ? fmtUsd(latest.poolUsd, 0) : "—") : fmtUsd(total, metric === "fees" ? 2 : 0);
  const caption = metric === "pool" ? "now" : `last ${RANGES.find((r) => r.id === range)?.label}`;

  return (
    <section className={cn("flex min-w-0 flex-col border-b border-hairline", className)} aria-label="Pool charts" data-testid="lp-chart">
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3">
        <div role="tablist" aria-label="Chart" className="flex min-w-0 overflow-x-auto">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={metric === m.id}
              data-testid={`lp-chart-${m.id}`}
              onClick={() => setMetric(m.id)}
              className={cn(
                "relative h-10 cursor-pointer whitespace-nowrap px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary",
                metric === m.id ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent-primary" : "text-ink-3 hover:text-ink"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Time range" className="flex flex-shrink-0 items-center gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              data-testid={`lp-range-${r.id}`}
              onClick={() => setRange(r.id)}
              className={cn(
                "h-7 cursor-pointer rounded px-2 text-[12px] font-medium tabular-numeric transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
                range === r.id ? "bg-surface-subtle text-accent-primary" : "text-ink-3 hover:text-ink"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-2 px-4 pt-3">
        <span className="text-[18px] font-semibold tracking-[-0.01em] text-ink tabular-numeric" data-testid="lp-chart-headline">
          {q.isLoading ? "…" : headline}
        </span>
        <span className="text-[12px] text-ink-3">{caption}</span>
      </div>
      <div className="relative h-[260px] w-full sm:h-[320px] lg:h-[360px]" role="img" aria-label={`${METRICS.find((m) => m.id === metric)?.label} chart, ${RANGES.find((r) => r.id === range)?.label}`}>
        {!q.isError && <Plot days={days} metric={metric} />}
        {q.isError && (
          <div className="absolute inset-0 flex items-center justify-center" data-testid="lp-chart-error">
            <p className="text-[13px] text-ink-3">
              Chart unavailable.{" "}
              <button type="button" onClick={() => q.refetch()} className="cursor-pointer font-medium text-accent-primary hover:underline">
                Retry
              </button>
            </p>
          </div>
        )}
        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" data-testid="lp-chart-empty">
            <span className="rounded bg-card/80 px-2 py-1 text-[12px] text-ink-3">No activity yet</span>
          </div>
        )}
      </div>
    </section>
  );
}
