/**
 * PREMIA feature flag — ADDITIVE and OPT-IN.
 *
 * PREMIA ("trade the premium") is a directional prediction-market section
 * layered on top of the Rift wallet. It is OFF unless a deployment turns it on
 * deliberately:
 *
 *   - VITE_FEATURE_PREMIA="true" (or "1") → on
 *   - anything else, or unset             → OFF
 *
 * OFF IS THE RIGHT DEFAULT, AND NOT JUST CAUTION. The beta is collateralised
 * by prmUSD — a mock ERC-20 with an open faucet and no monetary value — and
 * the mark still runs on the placeholder λ_ref curve rather than the
 * calibrated M^ref table (docs/PREMIA-SPEC.md §2.2). If this shipped on by
 * default, every signed-in Rift user would get a Markets tab quoting a
 * valueless instrument off an uncalibrated curve. Production must opt in.
 *
 * When the flag is off the nav item and routes are never registered and the
 * section is unreachable, so wallet / send / onramp / balances behave exactly
 * as they did before PREMIA existed.
 */
const raw = import.meta.env.VITE_FEATURE_PREMIA as string | undefined;

export const FEATURE_PREMIA: boolean = raw === "true" || raw === "1";
