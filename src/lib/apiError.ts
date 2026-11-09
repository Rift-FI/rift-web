/**
 * Turn backend / SDK errors into short, user-facing messages.
 *
 * Contract notes (backend chore/bank-readiness-hardening):
 *   - 429 is returned for OTP lockout ("Too many failed verification
 *     attempts…") and for rate limits.
 *   - 500 bodies are sanitised to `{ message: "Internal server error",
 *     error, requestId }`; the requestId is the only useful detail.
 *   - 503 `{ error: "parent-proxy overloaded" }` means the signer is busy.
 *   - OTP failures are 400 with `requiresOTP: true`.
 *
 * Errors arrive in three shapes: the SDK's ApiError `{ message, error,
 * status }`, axios-style `{ response: { status, data } }`, and the
 * `ApiResponseError` thrown by `apiErrorFromResponse()` below for direct
 * fetch() calls.
 */

export interface ApiErrorInfo {
  status?: number;
  message?: string;
  requestId?: string;
  requiresOTP?: boolean;
}

export class ApiResponseError extends Error {
  status: number;
  requestId?: string;
  requiresOTP?: boolean;
  code?: string;
  constructor(message: string, info: { status: number; requestId?: string; requiresOTP?: boolean; code?: string }) {
    super(message);
    this.name = "ApiResponseError";
    this.status = info.status;
    this.requestId = info.requestId;
    this.requiresOTP = info.requiresOTP;
    this.code = info.code;
  }
}

type Bag = Record<string, unknown>;

const asBag = (v: unknown): Bag =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Bag) : {};
const str = (v: unknown): string | undefined =>
  typeof v === "string" && v ? v : undefined;

/** Read the status / message / requestId out of any of the error shapes. */
export function apiErrorInfo(err: unknown): ApiErrorInfo {
  if (!err || typeof err !== "object") {
    return typeof err === "string" ? { message: err } : {};
  }
  const e = asBag(err);
  const response = asBag(e.response);
  const data = asBag(response.data ?? e.data);
  const status: number | undefined =
    typeof e.status === "number"
      ? e.status
      : typeof response.status === "number"
        ? response.status
        : undefined;
  const message =
    str(data.message) ?? str(e.message) ?? str(data.error) ?? str(e.error);
  const requestId = str(e.requestId) ?? str(data.requestId);
  const requiresOTP = e.requiresOTP === true || data.requiresOTP === true;
  return { status, message, requestId, requiresOTP };
}

/**
 * A friendly message for the error, or `undefined` when there's nothing
 * better than the caller's generic fallback (so existing default copy
 * like "Something went wrong! Try again." keeps showing).
 */
export function friendlyApiErrorMessage(
  err: unknown,
  opts: { otp?: boolean } = {}
): string | undefined {
  const { status, message, requestId, requiresOTP } = apiErrorInfo(err);

  if (status === 429) {
    if (message && /too many/i.test(message)) return message;
    return opts.otp
      ? "Too many attempts. Please wait a few minutes and request a new code."
      : "Too many requests. Please wait a moment and try again.";
  }
  if (status === 500) {
    return requestId
      ? `Something went wrong on our side. Please try again. (Ref: ${requestId})`
      : "Something went wrong on our side. Please try again.";
  }
  if (status === 503) {
    return "Service is busy right now. Please try again in a moment.";
  }
  if (
    opts.otp &&
    (requiresOTP ||
      ((status === 400 || status === 401) &&
        !!message &&
        /otp|code|verif|expired/i.test(message)))
  ) {
    return "That code is invalid or has expired. Check it or request a new one.";
  }
  return undefined;
}

/**
 * Build an ApiResponseError from a failed fetch() Response. Prefers the
 * body's `error` / `message` for 4xx and maps 5xx to friendly text,
 * carrying `requestId` (body or X-Request-Id header) for support.
 */
export async function apiErrorFromResponse(
  res: Response,
  fallback: string
): Promise<ApiResponseError> {
  let body: Bag = {};
  try {
    body = asBag(await res.json());
  } catch {
    body = {};
  }
  const requestId =
    str(body.requestId) ?? res.headers?.get?.("x-request-id") ?? undefined;
  const info = {
    status: res.status,
    requestId: requestId || undefined,
    requiresOTP: body.requiresOTP === true,
    code: typeof body.code === "string" ? body.code : undefined,
  };
  const friendly = friendlyApiErrorMessage({
    ...info,
    message: str(body.message) ?? str(body.error),
  });
  const raw = str(body.error) ?? str(body.message) ?? `${fallback} (${res.status})`;
  return new ApiResponseError(res.status >= 500 || res.status === 429 ? friendly ?? raw : raw, info);
}
