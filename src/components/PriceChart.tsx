import { JSX, useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CandlestickData,
} from "lightweight-charts";
import { colors } from "../constants";

interface chartProps {
  data: CandlestickData[];
}

export const CoinPriceChart = ({ data }: chartProps): JSX.Element => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: colors.primary },
          textColor: colors.textprimary,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: colors.primary },
          horzLines: { color: colors.primary },
        },
        crosshair: {
          mode: 0,
        },
        timeScale: {
          visible: false,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: colors.success,
        downColor: colors.danger,
        borderUpColor: colors.success,
        borderDownColor: colors.danger,
        wickUpColor: colors.success,
        wickDownColor: colors.danger,
      });

      candlestickSeriesRef.current = candlestickSeries;
      chartRef.current = chart;

      return () => chart.remove();
    }
  }, []);

  useEffect(() => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(data);
    }
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "20rem", margin: "1rem 0" }}
    />
  );
};
