/**
 * The backend's app-facing status vocabulary (see the onramp/ledger
 * contract) plus a mapper for older feeds that still send provider or
 * legacy strings.
 */
export type AppStatus =
  | "awaiting_payment"
  | "processing"
  | "completed"
  | "refunding"
  | "refunded"
  | "expired"
  | "cancelled"
  | "failed";

export const APP_STATUSES: AppStatus[] = ["awaiting_payment", "processing", "completed", "refunding", "refunded", "expired", "cancelled", "failed"];

export const STATUS_LABEL: Record<AppStatus, string> = {
  awaiting_payment: "Awaiting payment",
  processing: "Processing",
  completed: "Completed",
  refunding: "Refunding",
  refunded: "Refunded",
  expired: "Expired",
  cancelled: "Cancelled",
  failed: "Failed",
};

export type StatusTone = "success" | "progress" | "waiting" | "danger" | "muted";
export const STATUS_TONE: Record<AppStatus, StatusTone> = {
  awaiting_payment: "waiting",
  processing: "progress",
  completed: "success",
  refunding: "waiting",
  refunded: "muted",
  expired: "muted",
  cancelled: "muted",
  failed: "danger",
};

/** True when nothing will change any more. */
export const isFinal = (s: AppStatus) => s !== "awaiting_payment" && s !== "processing" && s !== "refunding";

/**
 * Map any status string to the app vocabulary. App statuses pass through;
 * Paycrest provider statuses and legacy order strings are translated.
 * Payouts stay "processing" until settled.
 */
export function toAppStatus(raw?: string | null, fallback: AppStatus = "processing"): AppStatus {
  const v = String(raw ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!v) return fallback;
  if ((APP_STATUSES as string[]).includes(v)) return v as AppStatus;
  if (v === "initiated" || v === "awaiting" || v === "unpaid") return "awaiting_payment";
  if (/^(settled|complete|completed|success|successful|succeeded|paid|confirmed|done|fulfilled)$/.test(v)) return "completed";
  if (/refunding|reversing/.test(v)) return "refunding";
  if (/refunded|reversed/.test(v)) return "refunded";
  if (/expire/.test(v)) return "expired";
  if (/cancel/.test(v)) return "cancelled";
  if (/fail|reject|declin|error/.test(v)) return "failed";
  // deposited, pending, fulfilling, validated, settling, compliance_hold, processing…
  return "processing";
}
