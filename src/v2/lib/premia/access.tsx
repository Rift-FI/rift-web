/**
 * Session-scoped PREMIA access.
 *
 * One fetch of `GET /v1/premia/beta/status` per page load, shared by the nav,
 * the mobile tab bar and the routes so they can never disagree. Held in
 * memory only — see beta.ts for why it is not persisted.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchBetaStatus, type BetaStatus } from "./beta";
import { FEATURE_PREMIA } from "./flag";

interface AccessCtx extends BetaStatus {
  /** The status request is still in flight — treat as "no" until it lands. */
  loading: boolean;
  /** Re-check, e.g. straight after redeeming an invite. */
  refresh: () => Promise<void>;
  /** Access granted locally after a successful redeem, before the re-fetch. */
  grant: (status: BetaStatus) => void;
}

const Ctx = createContext<AccessCtx>({
  hasAccess: false,
  loading: false,
  refresh: async () => {},
  grant: () => {},
});

/** In-memory for this page load only. Cleared by a reload, never written to disk. */
let sessionStatus: BetaStatus | null = null;

export function PremiaAccessProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BetaStatus>(sessionStatus ?? { hasAccess: false });
  const [loading, setLoading] = useState(FEATURE_PREMIA && !sessionStatus);

  const refresh = useCallback(async () => {
    if (!FEATURE_PREMIA) return;
    setLoading(true);
    const next = await fetchBetaStatus();
    sessionStatus = next;
    setStatus(next);
    setLoading(false);
  }, []);

  const grant = useCallback((next: BetaStatus) => {
    sessionStatus = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    // The build-level kill switch short-circuits the request entirely.
    if (!FEATURE_PREMIA) {
      setLoading(false);
      return;
    }
    if (sessionStatus) {
      setStatus(sessionStatus);
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ ...status, loading, refresh, grant }}>{children}</Ctx.Provider>;
}

export function usePremiaAccess(): AccessCtx {
  return useContext(Ctx);
}

/**
 * The single question every surface asks. Both gates must pass: the build
 * flag AND a redeemed invite. While the check is in flight the answer is no,
 * so PREMIA never flashes into the nav and then disappears.
 */
export function usePremiaVisible(): boolean {
  const { hasAccess, loading } = usePremiaAccess();
  return FEATURE_PREMIA && hasAccess && !loading;
}

/** Test seam: lets the Playwright suite start from a known state. */
export function __resetPremiaAccessForTests() {
  sessionStatus = null;
}
