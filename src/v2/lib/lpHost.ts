/**
 * Yield (LP pool) lives only on lp.riftfi.com: invite-only, not part of the
 * wallet app. The same build serves both hosts:
 *
 *   lp.riftfi.com      → "/" Yield, "/terms", "/auth" (Rift sign-in). Nothing else.
 *   wallet.riftfi.com  → no Yield anywhere; old /lp and /app/yield links go to lp.riftfi.com.
 *   localhost/previews → Yield stays reachable at /lp for development and tests.
 */
export const LP_ORIGIN = String(import.meta.env.VITE_LP_ORIGIN || "https://lp.riftfi.com").replace(/\/$/, "");

const host = () => (typeof window === "undefined" ? "" : window.location.hostname.toLowerCase());

/** True when this page is served from the Yield host (lp.riftfi.com). */
export function isLpHost(h = host()): boolean {
  if (h.startsWith("lp.")) return true;
  try {
    return h === new URL(LP_ORIGIN).hostname.toLowerCase();
  } catch {
    return false;
  }
}

/** Production wallet host: Yield links leave for LP_ORIGIN instead of rendering here. */
export function isProdWalletHost(h = host()): boolean {
  return !isLpHost(h) && (h === "riftfi.com" || h.endsWith(".riftfi.com"));
}

/** In-app path for a Yield page ("/" or "/terms"), correct for the current host. */
export function lpPath(p: "/" | "/terms" = "/"): string {
  if (isLpHost()) return p;
  return p === "/" ? "/lp" : `/lp${p}`;
}
