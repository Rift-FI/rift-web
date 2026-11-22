/**
 * Human-readable ABIs for the PREMIA contracts the app touches, transcribed
 * from vomma/contracts/src (IPerpMarket, ICollateralVault, IOracleAdapter,
 * IMarketFactory, mocks/PrmUSD). Used with ethers for both reads and calldata.
 *
 * Units: WAD (1e18) everywhere in the public ABI; prmUSD is 6-dp like USDC and
 * is scaled at the vault boundary (×1e12). q/deltaQ are WAD units — 1 unit is
 * backed by, and pays at most, 1 prmUSD. Index values (X, floor F, cap C, μ) are WAD
 * FRACTIONS, so a 6% floor is 0.06e18.
 */

export const PERP_MARKET_ABI = [
  // ── trade ────────────────────────────────────────────────────────────────
  "function modifyPosition(int256 deltaQ, uint256 worstMarkWad) returns (int256 costWad, uint256 feeWad, int256 newQ)",
  "function quote(int256 deltaQ) view returns (int256 costWad, uint256 markAfterWad)",
  // ── curve / payout / funding ─────────────────────────────────────────────
  "function markPrice() view returns (uint256 mWad)",
  "function referenceMark() view returns (uint256 mRefWad)",
  "function payoutNow() view returns (uint256 iWad)",
  "function netInventory() view returns (int256 n)",
  "function curveDepth() view returns (uint256 bWad)",
  "function fundingIndex() view returns (int256 cumFundingWad)",
  "function budgetConsumedPerUnit() view returns (uint256 pWad)",
  // ── position ─────────────────────────────────────────────────────────────
  "function positionOf(address account) view returns (tuple(int256 q, int256 fundingSnapshot, uint256 lockedCollateral))",
  "function accountValue(address account) view returns (int256 valueWad)",
  "function pendingRepriceCharge(address account) view returns (uint256 chargeWad)",
  // ── security / state ─────────────────────────────────────────────────────
  "function openInterestCap() view returns (uint256 capWad)",
  "function sourceFakeCost() view returns (uint256 kappaSecurityWad)",
  "function sourceAttestation() view returns (uint32 liveSources, bytes32 evidenceHash)",
  "function state() view returns (uint8)",
  "function stressAge() view returns (uint32)",
  "function marketId() view returns (bytes32)",
  "function oracle() view returns (address)",
  "function vault() view returns (address)",
  "function config() view returns (tuple(int256 mu, int256 floorF, int256 capC, uint32 tau, uint32 w, uint256 depthCoefficient, uint256 rho, uint32 hAge, uint256 cMin, uint256 kAttacker, uint16 clusterId))",
  "function jumpConfig() view returns (tuple(uint32 windowW, int256 deltaD, int256 deltaW))",
  // ── events (real fill history → real cost basis / P&L) ───────────────────
  "event PositionModified(address indexed account, int256 deltaQ, int256 newQ, uint256 markWad, int256 costWad, uint256 feeWad)",
] as const;

export const COLLATERAL_VAULT_ABI = [
  "function deposit(uint256 amountUSDC)",
  "function withdraw(uint256 amountUSDC)",
  "function freeBalance(address account) view returns (uint256 wad)",
  "function lockedBalance(bytes32 marketId, address account) view returns (uint256 wad)",
  "function totalEquity() view returns (uint256 wad)",
  "function totalLocked() view returns (uint256 wad)",
  "function marketCapital(bytes32 marketId) view returns (uint256 wad)",
] as const;

export const MARKET_FACTORY_ABI = [
  "function marketOf(bytes32 marketId) view returns (address)",
  "function allMarkets() view returns (bytes32[])",
] as const;

/** PushOracleAdapter — the index feed the markets read. */
export const ORACLE_ADAPTER_ABI = [
  "function latest(bytes32 marketId) view returns (tuple(int256 x, int256 xBar, int256 lambdaRef, uint32 sources, uint64 day, uint64 publishedAt))",
  "function isStale(bytes32 marketId) view returns (bool)",
  "function status(bytes32 marketId) view returns (uint8)",
  "function liveSources(bytes32 marketId) view returns (uint32)",
  "function configOf(bytes32 marketId) view returns (tuple(uint64 maxAgeSeconds, int256 xMin, int256 xMax, int256 maxMovePerPush, uint32 nMin, uint32 kMin))",
  "event IndexPushed(bytes32 indexed marketId, uint64 indexed day, int256 x, int256 xBar, int256 lambdaRef, uint32 sources, uint64 publishedAt)",
] as const;

/** prmUSD (PREMIA Mock USD) — 6-dp test ERC-20 + a public rate-limited faucet. */
export const PRMUSD_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  // faucet: mints a FIXED FAUCET_AMOUNT to the caller, once per
  // FAUCET_COOLDOWN. Both are `constant` in the deployed contract — there is
  // no setter and no variable-amount entrypoint (a `drip(uint256)` was once
  // listed here and does NOT exist on chain; calling it would revert with no
  // reason). The only way to dispense a different amount is the owner-only
  // `mint`, which needs a human passkey tap per user.
  "function faucet()",
  "function FAUCET_AMOUNT() view returns (uint256)",
  "function FAUCET_COOLDOWN() view returns (uint256)",
  "function lastFaucet(address account) view returns (uint256)",
  "function isProtocol(address account) view returns (bool)",
] as const;

/** PremiaTypes.MarketState */
export const MARKET_STATE = ["Active", "Closing only", "Frozen"] as const;
/** IOracleAdapter.OracleStatus */
export const ORACLE_STATUS = ["Healthy", "Degraded", "Halted"] as const;
