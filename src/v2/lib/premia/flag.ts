/**
 * PREMIA feature flag — the BUILD-LEVEL switch.
 *
 *   VITE_FEATURE_PREMIA="false" (or "0") -> off
 *   anything else, or unset              -> on
 *
 * This defaults ON, which is a reversal of the original default, and the
 * reason is that it is no longer the thing protecting anyone. When this file
 * was written the flag was the ONLY gate, so "on" meant every signed-in Rift
 * user got a Markets tab quoting a valueless instrument. Access is now gated
 * server-side by a redeemed invite (GET /v1/premia/beta/status): without one
 * there is no nav item, no mobile tab, and the /app/markets routes redirect.
 * All this flag now decides is whether the public /premia invite page exists
 * at all — and that page shows nothing useful without a valid code.
 *
 * It defaults on because production reads its env from a dashboard this repo
 * cannot set, so "unset" has to mean the shipping configuration. Setting
 * VITE_FEATURE_PREMIA="false" still removes the section completely: with it
 * off the nav item and routes are never registered and the code is tree-shaken
 * out of the bundle entirely (verified: zero occurrences of "Trade the
 * premium" in a build made with the var set to false).
 *
 * One cost of defaulting on: the access provider now issues one
 * /v1/premia/beta/status call per signed-in session for every user, including
 * those who will never use PREMIA. Set the var to "false" to take that away.
 */
const raw = import.meta.env.VITE_FEATURE_PREMIA as string | undefined;

export const FEATURE_PREMIA: boolean = raw !== "false" && raw !== "0";
