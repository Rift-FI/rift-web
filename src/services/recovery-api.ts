/**
 * Identifier-recovery API (formerly "recovery-api").
 *
 * These endpoints reset or add the account's *primary identifier* — the
 * email / phone / externalId used to sign in. They DO NOT recover the
 * wallet's signing key. For v3 (device-bound) wallets, "wallet recovery"
 * means enrolling an additional Passkey or OIDC method on the sealed
 * envelope — that flow will live under /wallet/methods (backend WIP).
 *
 * Backend routes were renamed from /recovery/* → /identifier-recovery/*
 * to make the semantic distinction explicit. The old /recovery alias
 * stays for a migration window.
 */
import { getApiBase } from "@/lib/apiBase";
const API_URL = getApiBase();
const API_KEY = import.meta.env.VITE_SDK_API_KEY;

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data as T;
}

// --- Types ---

export interface RecoveryOptions {
  email: string | null;
  phone: string | null;
}

export interface ValidateTokenResponse {
  valid: boolean;
  type: "PASSWORD_RESET" | "ACCOUNT_RECOVERY";
  expiresAt?: string;
  message?: string;
}

// --- Password Reset (token-based) ---

export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  const res = await fetch(`${API_URL}/identifier-recovery/validate-token/${token}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse<ValidateTokenResponse>(res);
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/reset-password`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ token, newPassword }),
  });
  return handleResponse<{ message: string }>(res);
}

// --- Account Recovery ---

export async function getRecoveryOptionsByIdentifier(
  identifier: string,
  identifierType: "email" | "phone"
): Promise<{ recoveryOptions: RecoveryOptions }> {
  const params = new URLSearchParams({ identifier, identifierType });
  const res = await fetch(
    `${API_URL}/identifier-recovery/options-by-identifier?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );
  return handleResponse<{ recoveryOptions: RecoveryOptions }>(res);
}

export async function requestAccountRecoveryLink(
  identifier: string,
  identifierType: "email" | "phone",
  method: "emailRecovery" | "phoneRecovery"
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/request-account-recovery`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ identifier, identifierType, method }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function recoverAccount(
  token: string,
  newIdentifier: string,
  identifierType: "email" | "phone",
  otpCode: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/recover-account`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ token, newIdentifier, identifierType, otpCode }),
  });
  return handleResponse<{ message: string }>(res);
}

// --- OTP ---

export async function sendOtp(
  identifier: string,
  type: "email" | "phone"
): Promise<{ status: string; message: string }> {
  const body = type === "email" ? { email: identifier } : { phone: identifier };
  const res = await fetch(`${API_URL}/otp/send`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<{ status: string; message: string }>(res);
}

// --- Recovery Setup (JWT-authenticated) ---

export async function createRecoveryWithJwt(data: {
  emailRecovery?: string;
  phoneRecovery?: string;
  otpCode?: string;
  phoneNumber?: string;
  email?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(res);
}

export async function addRecoveryMethodWithJwt(data: {
  method: "emailRecovery" | "phoneRecovery";
  value: string;
  externalId?: string;
  password?: string;
  otpCode?: string;
  phoneNumber?: string;
  email?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/add-method`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(res);
}

export async function updateRecoveryMethodWithJwt(data: {
  method: "emailRecovery" | "phoneRecovery";
  value: string;
  externalId?: string;
  password?: string;
  otpCode?: string;
  phoneNumber?: string;
  email?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/update-method`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(res);
}

export async function getMyRecoveryMethods(externalId?: string): Promise<{
  recovery: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}> {
  const res = await fetch(`${API_URL}/identifier-recovery/my-methods`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(externalId ? { externalId } : {}),
  });
  return handleResponse(res);
}

export async function removeRecoveryMethod(data: {
  externalId?: string;
  method: "emailRecovery" | "phoneRecovery";
  otpCode?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/remove-method`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(res);
}

export async function deleteAllRecoveryMethods(data: {
  externalId?: string;
  otpCode?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/identifier-recovery/delete-all`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(res);
}
