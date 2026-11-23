/**
 * PREMIA display formatting.
 *
 * ── On the dollar sign ───────────────────────────────────────────────────
 * Amounts render as ordinary dollars: `$500`, `$52,631`, `$408.6K`.
 *
 * They are prmUSD, a free test token with no monetary value — and that is
 * disclosed structurally rather than by a unit suffix on every figure. PREMIA
 * is invite-only, and every user has passed a terms page stating in bold that
 * the token is worthless and positions are not redeemable, and ticked a box
 * to proceed. The `BETA` badge stands on every surface and the line under the
 * Trade button repeats it. Suffixing `prmUSD` onto each number as well cost
 * real legibility for a warning already delivered, more forcefully, elsewhere.
 * ─────────────────────────────────────────────────────────────────────────
 */

/* ── percentages ────────────────────────────────────────────────────────── */

export const fmtPct = (p: number, dp = 1) => `${p.toFixed(dp)}%`;
export const fmtPctSigned = (p: number, dp = 1) =>
  `${p >= 0 ? "+" : "−"}${Math.abs(p).toFixed(dp)}%`;

/* ── the mark, as odds ──────────────────────────────────────────────────── */

/**
 * The mark as a PERCENT — the odds this side is priced at.
 *
 * Cents were tried and failed: `0.95¢` is sub-cent at the calibrated mark and
 * `0.000100¢` at the placeholder, and the glyph was not recognised. The mark
 * is a probability; percent is read universally and survives both extremes.
 *
 * Precision keys off the distance to the NEAREST edge, so the two sides of a
 * pair render at matching precision and visibly sum to 100%:
 *
 *   75 / 25          → "75%"      "25%"
 *   0.954 / 99.046   → "0.95%"    "99.05%"
 *   0.0001 / 99.9999 → "0.0001%"  "99.9999%"
 *
 * Never rounds a live price to "0%" — a side that costs something must show
 * that it costs something.
 */
export const fmtOddsPct = (m: number): string => {
  const c = m * 100;
  if (c <= 0) return "0%";
  if (c >= 100) return "100%";
  const edge = Math.min(c, 100 - c);
  // Tolerant: M and 1−M can land a few ulps apart at a threshold, which would
  // otherwise render one side "0.10%" and the other "99.9000%".
  const atLeast = (t: number) => edge >= t * (1 - 1e-9);
  if (atLeast(10)) return `${c.toFixed(0)}%`;
  if (atLeast(1)) return `${c.toFixed(1)}%`;
  if (atLeast(0.1)) return `${c.toFixed(2)}%`;
  if (atLeast(0.001)) return `${c.toFixed(4)}%`;
  if (atLeast(1e-6)) return `${c.toFixed(6)}%`;
  return `${c.toExponential(2)}%`;
};

/* ── money ──────────────────────────────────────────────────────────────── */

/** A bare number, for a cell whose column header carries the unit. */
export const fmtNum = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** "$1,000.00" */
export const fmtUsd = (n: number, dp = 2) => `$${fmtNum(n, dp)}`;

/**
 * Money that keeps sub-cent magnitudes honest. A calm market moves in
 * millionths, and printing a real loss as "$0.00" is worse than more digits.
 */
export const fmtUsdSmart = (n: number, withSymbol = true): string => {
  const a = Math.abs(n);
  const body = a === 0 ? "0.00" : a >= 0.01 ? fmtNum(n) : a >= 1e-6 ? fmtNum(n, 6) : n.toExponential(2);
  return withSymbol ? `$${body}` : body;
};

/** "+$12.50" / "−$3.10" */
export const fmtUsdSigned = (n: number, dp = 2) =>
  `${n >= 0 ? "+" : "−"}$${fmtNum(Math.abs(n), dp)}`;

/** Signed money with the sub-cent precision of {@link fmtUsdSmart}. */
export const fmtUsdSignedSmart = (n: number, withSymbol = true): string => {
  const a = Math.abs(n);
  const sign = n >= 0 ? "+" : "−";
  if (a === 0) return withSymbol ? "$0.00" : "0.00";
  const body = a >= 0.01 ? fmtNum(a) : a >= 1e-6 ? fmtNum(a, 6) : a.toExponential(2);
  return withSymbol ? `${sign}$${body}` : `${sign}${body}`;
};

/** Compact money for capacity / depth: "$408.6K", "$5.00M". */
export const fmtUsdCompact = (n: number, withSymbol = true): string => {
  const a = Math.abs(n);
  const body =
    a >= 1_000_000
      ? `${(n / 1_000_000).toFixed(2)}M`
      : a >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : Math.round(n).toLocaleString("en-US");
  return withSymbol ? `$${body}` : body;
};

/* ── exposure ───────────────────────────────────────────────────────────── */

/** Units of exposure. One unit is backed by, and pays at most, $1. */
export const fmtUnits = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 2 : 0 });

/* ── funding ────────────────────────────────────────────────────────────── */

export const fmtFunding = (dailyPct: number) =>
  `${dailyPct >= 0 ? "+" : "−"}${Math.abs(dailyPct).toFixed(3)}%/day`;

/* ── points (beta rewards — not a currency, not convertible yet) ─────────── */

export const fmtPoints = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 1 : 0 });

/* ── tone ───────────────────────────────────────────────────────────────── */

export const toneForPnl = (n: number) =>
  n > 0.0001 ? "text-success" : n < -0.0001 ? "text-danger" : "text-ink-2";
