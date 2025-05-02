import { JSX, useEffect, useRef } from "react";
import { createChart, ISeriesApi, CrosshairMode } from "lightweight-charts";
import { colors } from "@/constants";

interface ChartData {
  time: string;
  value: number;
}

export const PricesChart = (): JSX.Element => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: colors.primary },
        textColor: colors.textprimary,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: colors.divider },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });
    chartRef.current = chart;

    const lineSeries = chart.addLineSeries({
      color: colors.accent,
      lineWidth: 2,
    });
    lineSeriesRef.current = lineSeries;

    const data: ChartData[] = [
      { time: "2025-03-20", value: 0.17 },
      { time: "2025-03-22", value: 0.2 },
      { time: "2025-03-24", value: 0.18 },
      { time: "2025-03-25", value: 0.17 },
      { time: "2025-03-26", value: 0.17 },
      { time: "2025-03-27", value: 0.16 },
      { time: "2025-03-29", value: 0.17 },
      { time: "2025-03-30", value: 0.17 },
      { time: "2025-03-31", value: 0.16 },
      { time: "2025-04-02", value: 0.16 },
      { time: "2025-04-04", value: 0.17 },
      { time: "2025-04-06", value: 0.16 },
      { time: "2025-04-08", value: 0.16 },
      { time: "2025-04-09", value: 0.16 },
      { time: "2025-04-11", value: 0.15 },
      { time: "2025-04-12", value: 0.15 },
      { time: "2025-04-13", value: 0.14 },
      { time: "2025-04-14", value: 0.14 },
      { time: "2025-04-15", value: 0.13 },
      { time: "2025-04-16", value: 0.12 },
      { time: "2025-04-19", value: 0.11 },
      { time: "2025-04-20", value: 0.11 },
      { time: "2025-04-22", value: 0.115 },
      { time: "2025-04-24", value: 0.11 },
      { time: "2025-04-26", value: 0.105 },
      { time: "2025-04-28", value: 0.105 },
      { time: "2025-04-30", value: 0.11 },
    ];

    lineSeries.setData(data);

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current!.clientWidth,
        });
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={chartContainerRef} style={{ margin: "0 -1rem" }} />;
};
