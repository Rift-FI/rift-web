/**
 * React binding for the reconstructed premium series.
 *
 * Kept apart from `history.ts` so that module stays pure and testable without
 * React. Safe to call from several components at once: `fetchHistory`
 * de-duplicates in-flight requests and caches to sessionStorage, so the chart
 * and the explainer asking at the same moment make one pair of network calls.
 */
import { useEffect, useState } from "react";
import { fetchHistory, type HistorySeries } from "./history";

export type HistoryState = "loading" | "ready" | "failed";

export function useHistory(floorPct: number): { data: HistorySeries | null; state: HistoryState } {
  const [data, setData] = useState<HistorySeries | null>(null);
  const [state, setState] = useState<HistoryState>("loading");

  useEffect(() => {
    // The shared fetch is not cancelled on unmount (see history.ts `legs`);
    // a late result is simply dropped.
    let alive = true;
    void fetchHistory(floorPct).then((h) => {
      if (!alive) return;
      setData(h);
      setState(h ? "ready" : "failed");
    });
    return () => {
      alive = false;
    };
  }, [floorPct]);

  return { data, state };
}
