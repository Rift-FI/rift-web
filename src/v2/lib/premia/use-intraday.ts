import { useEffect, useState } from "react";
import { fetchStreetBars, isIntraday, type TimedBar, type Timeframe } from "./intraday";

export type IntradayState = "idle" | "loading" | "ready" | "failed";

/** Street bars for an intraday timeframe; idle for 1D / 1W, which come from the daily series. */
export function useIntraday(tf: Timeframe): { bars: TimedBar[] | null; state: IntradayState } {
  const [res, setRes] = useState<{ tf: Timeframe; bars: TimedBar[] | null; failed: boolean } | null>(null);
  useEffect(() => {
    if (!isIntraday(tf)) return;
    let alive = true;
    fetchStreetBars(tf).then(
      (bars) => {
        if (alive) setRes({ tf, bars, failed: false });
      },
      () => {
        if (alive) setRes({ tf, bars: null, failed: true });
      }
    );
    return () => {
      alive = false;
    };
  }, [tf]);
  // A result for a different timeframe is stale, never shown as the current one.
  if (!isIntraday(tf)) return { bars: null, state: "idle" };
  if (!res || res.tf !== tf) return { bars: null, state: "loading" };
  return { bars: res.bars, state: res.failed ? "failed" : "ready" };
}
