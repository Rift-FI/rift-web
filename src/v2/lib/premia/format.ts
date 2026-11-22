/**
 * PREMIA display formatting. Numbers use tabular figures in the UI.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THERE IS DELIBERATELY NO "$" FORMATTER IN THIS FILE.
 *
 * Every quantity PREMIA shows is denominated in prmUSD — a 6-decimal TEST
 * token with an open faucet and no monetary value. Rendering it as "$1,000"
 * would let a user believe they made or lost real money, so money formatting
 * is not available at all: the helpers below always carry the prmUSD unit, or
 * return a bare number for a cell whose own label carries it.
 *
 * The old fmtUsd / fmtUsdSigned / fmtUsdSignedSmart / fmtCompactUsd helpers
 * were REMOVED rather than deprecated, so any call site that still wants a
 * dollar sign fails to compile instead of shipping one.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** The collateral token's ticker. Never "USD", never "$". */
export const UNIT = "prmUSD";

/* ── percentages ────────────────────────────────────────────────────────── */

export const fmtPct = (p: number, dp = 1) => `${p.toFixed(dp)}%`;
export const fmtPctSigned = (p: number, dp = 1) =>
  `${p >= 0 ? "+" : "−"}${Math.abs(p).toFixed(dp)}%`;

/* ── the mark / odds ────────────────────────────────────────────────────── */

/**
 * The mark M is a PRICE PER UNIT in prmUSD, between 0 and 1 — Rise and Fall
 * always sum to exactly 1.0000. Shown as that price rather than in "¢",
 * which would imply cents of a real dollar.
 *
 * The precision adapts across regimes on purpose: today's calm market quotes
 * a millionth of a unit, and the λ_ref recalibration will move the mark into
 * ordinary fractions. Both must read correctly without a special case.
 */
export const fmtMark = (m: number): string => {
  if (m === 0) return "0.0000";
  if (m === 1) return "1.0000";
  /**
   * Precision is chosen from the distance to the NEAREST edge (0 or 1), not
   * from the magnitude, for two reasons:
   *
   *  - the sides stay symmetric. A Rise of 0.00000100 must not sit opposite a
   *    Fall rounded to "1.0000", which would read as if Rise were zero.
   *  - it holds up across regimes. The mark has been a millionth of a unit
   *    while λ_ref was a placeholder and moves into low cents once the
   *    calibrated M^ref table lands, so 0.00954 must keep its significant
   *    figures without 0.3700 growing a tail of zeros.
   */
  const edge = Math.min(Math.abs(m), Math.abs(1 - m));
  if (edge >= 0.1) return m.toFixed(4); // 0.3700
  if (edge >= 0.001) return m.toFixed(5); // 0.00954  (0.954¢)
  if (edge >= 1e-5) return m.toFixed(7); // 0.0000954
  if (edge >= 1e-8) return m.toFixed(9); // 0.000001000
  return m.toFixed(12);
};

/** The mark with its unit spelled out, for standalone use. */
export const fmtMarkUnit = (m: number) => `${fmtMark(m)} ${UNIT}`;

/**
 * The mark as a price in CENTS of a unit — the prediction-market convention,
 * and how the outcome buttons read: `Rise 0.95¢` / `Fall 99.05¢`.
 *
 * "¢" here is a hundredth of ONE UNIT, and a unit settles between 0 and
 * 1 prmUSD. It is not a cent of a real dollar; the outcome buttons carry a
 * "per unit · pays 100¢ max" caption so that is never ambiguous, and prmUSD
 * balances elsewhere always render with their explicit unit.
 *
 * Precision keys off the distance to the NEAREST edge so both extremes of a
 * pair stay readable and visibly sum to 100¢:
 *
 *   75 / 25      → "75¢"      "25¢"
 *   0.954 / 99.046 → "0.95¢"  "99.05¢"
 *   0.0001 / 99.9999 → "0.0001¢" "99.9999¢"
 *
 * Never rounds a live price to "0¢" — a side that costs something must show
 * that it costs something.
 */
export const fmtCents = (m: number): string => {
  const c = m * 100;
  if (c <= 0) return "0¢";
  if (c >= 100) return "100¢";
  const edge = Math.min(c, 100 - c);
  /**
   * Tolerant comparison. The two sides are computed as M and 1−M, so at a
   * threshold the subtraction can land one of them a few ulps below it — which
   * rendered the pair as "0.10¢ / 99.9000¢", with different precision on each
   * side of the same market. The epsilon keeps a pair on the same rung.
   */
  const atLeast = (t: number) => edge >= t * (1 - 1e-9);
  if (atLeast(10)) return `${c.toFixed(0)}¢`;
  if (atLeast(1)) return `${c.toFixed(1)}¢`;
  if (atLeast(0.1)) return `${c.toFixed(2)}¢`;
  if (atLeast(0.001)) return `${c.toFixed(4)}¢`;
  if (atLeast(1e-6)) return `${c.toFixed(6)}¢`;
  return `${c.toExponential(2)}¢`;
};

/** Cents without the symbol, for a cell whose column header carries it. */
export const fmtCentsBare = (m: number) => fmtCents(m).replace("¢", "");

/* ── prmUSD quantities ──────────────────────────────────────────────────── */

/** A bare number — ONLY for cells whose label already says prmUSD. */
export const fmtNum = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** "1,000.00 prmUSD". The default for any balance or amount. */
export const fmtPrm = (n: number, dp = 2) => `${fmtNum(n, dp)} ${UNIT}`;

/**
 * A prmUSD amount that keeps sub-cent magnitudes honest. A calm market moves
 * in millionths, and printing a real loss as "0.00" is worse than more digits.
 */
export const fmtPrmSmart = (n: number, withUnit = true): string => {
  const a = Math.abs(n);
  const body = a === 0 ? "0.00" : a >= 0.01 ? fmtNum(n) : a >= 1e-6 ? fmtNum(n, 6) : n.toExponential(2);
  return withUnit ? `${body} ${UNIT}` : body;
};

/** Signed prmUSD, e.g. "+12.50 prmUSD" / "−3.10 prmUSD". */
export const fmtPrmSigned = (n: number, dp = 2) =>
  `${n >= 0 ? "+" : "−"}${fmtNum(Math.abs(n), dp)} ${UNIT}`;

/** Signed prmUSD with the sub-cent precision of {@link fmtPrmSmart}. */
export const fmtPrmSignedSmart = (n: number, withUnit = true): string => {
  const a = Math.abs(n);
  const sign = n >= 0 ? "+" : "−";
  if (a === 0) return withUnit ? `0.00 ${UNIT}` : "0.00";
  const body = a >= 0.01 ? fmtNum(a) : a >= 1e-6 ? fmtNum(a, 6) : a.toExponential(2);
  return withUnit ? `${sign}${body} ${UNIT}` : `${sign}${body}`;
};

/** Compact prmUSD for capacity / depth figures: "630.0K prmUSD". */
export const fmtPrmCompact = (n: number, withUnit = true): string => {
  const a = Math.abs(n);
  const body =
    a >= 1_000_000
      ? `${(n / 1_000_000).toFixed(2)}M`
      : a >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : Math.round(n).toLocaleString("en-US");
  return withUnit ? `${body} ${UNIT}` : body;
};

/* ── exposure ───────────────────────────────────────────────────────────── */

/** Units of exposure. One unit is backed by, and pays at most, 1 prmUSD. */
export const fmtUnits = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 2 : 0 });

/* ── funding ────────────────────────────────────────────────────────────── */

/** Funding rate as a signed %/day. */
export const fmtFunding = (dailyPct: number) =>
  `${dailyPct >= 0 ? "+" : "−"}${Math.abs(dailyPct).toFixed(3)}%/day`;

/* ── points (beta rewards — NOT a currency, NOT convertible yet) ─────────── */

/** Points are whole-ish numbers; never show them with a currency marker. */
export const fmtPoints = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 1 : 0 });

/* ── tone ───────────────────────────────────────────────────────────────── */

export const toneForPnl = (n: number) =>
  n > 0.0001 ? "text-success" : n < -0.0001 ? "text-danger" : "text-ink-2";
