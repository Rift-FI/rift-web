/**
 * Single source of truth for the app's backend base URL.
 *
 * Precedence (highest wins):
 *   VITE_RIFT_API_BASE  — explicit sandbox / staging override (added for v3)
 *   VITE_API_URL        — legacy prod override
 *   https://payment.riftfi.xyz  — historical prod default
 *
 * Every raw `fetch` in the app should build its URL off `getApiBase()` so
 * a sandbox build hits sandbox and only sandbox — no accidental leaks to
 * prod that would 401 (auth token mismatch) or CORS-fail.
 */
export function getApiBase(): string {
  const explicit =
    (import.meta.env.VITE_RIFT_API_BASE as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "https://payment.riftfi.xyz";
  return explicit.replace(/\/$/, "");
}
