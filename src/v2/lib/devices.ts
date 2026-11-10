/**
 * Trusted devices: the client half of DEVICE-BINDING-CONTRACT.
 * The device key + header live in src/lib/device.ts; this file is the
 * React state and the /v1/devices calls.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authHeaders, riftRequest, signTicket } from "@/lib/nonCustodial";
import { getApiBase } from "@/lib/apiBase";
import { DEVICE_STATE_EVENT, deviceLabel, readDeviceState, writeDeviceState, type DeviceState, type DeviceStatus } from "@/lib/device";

export interface DeviceRow {
  id: string;
  label: string;
  platform?: string;
  status: DeviceStatus;
  trustedAt?: string;
  lastSeenAt?: string;
  createdAt?: string;
  coolingOffUntil?: string;
  current: boolean;
}

const unwrap = (d: any) => d?.data ?? d;

/* ── this device ──────────────────────────────────────────────────── */

let snapshot: DeviceState = readDeviceState();
let snapshotKey = JSON.stringify(snapshot);
function subscribe(cb: () => void) {
  const on = () => {
    const next = readDeviceState();
    const key = JSON.stringify(next);
    if (key !== snapshotKey) {
      snapshot = next;
      snapshotKey = key;
    }
    cb();
  };
  window.addEventListener(DEVICE_STATE_EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(DEVICE_STATE_EVENT, on);
    window.removeEventListener("storage", on);
  };
}

export function useThisDevice(): DeviceState {
  return useSyncExternalStore(subscribe, () => snapshot);
}

/** Cooling-off is over once the time passes (the server agrees lazily). */
export function effectiveStatus(s: { status?: DeviceStatus; coolingOffUntil?: string }, now = Date.now()): DeviceStatus | undefined {
  if (s.status === "cooling_off" && s.coolingOffUntil && new Date(s.coolingOffUntil).getTime() <= now) return "trusted";
  return s.status;
}

/* ── policy + list ────────────────────────────────────────────────── */

export function useDevicePolicy() {
  const q = useQuery({
    queryKey: ["device-policy"],
    queryFn: async () => {
      const { data } = await riftRequest<any>("GET", "/v1/devices/policy");
      return { enforced: !!unwrap(data)?.enforced };
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
  return { enforced: q.data?.enforced ?? false, isLoading: q.isLoading };
}

function normalise(raw: any): DeviceRow | null {
  if (!raw?.id) return null;
  return {
    id: String(raw.id),
    label: String(raw.label || (raw.current ? deviceLabel().label : "Unnamed device")),
    platform: raw.platform ?? undefined,
    status: (raw.status as DeviceStatus) ?? "unknown",
    trustedAt: raw.trustedAt ?? undefined,
    lastSeenAt: raw.lastSeenAt ?? undefined,
    createdAt: raw.createdAt ?? undefined,
    coolingOffUntil: raw.coolingOffUntil ?? undefined,
    current: !!raw.current,
  };
}

export function useDevices(opts: { poll?: number | false; enabled?: boolean } = {}) {
  const q = useQuery({
    queryKey: ["devices"],
    queryFn: async (): Promise<DeviceRow[]> => {
      const { data } = await riftRequest<any>("GET", "/v1/devices");
      const d = unwrap(data);
      const list = (Array.isArray(d) ? d : d?.devices ?? []).map(normalise).filter(Boolean) as DeviceRow[];
      // Keep this device's cached status in step with the server.
      const mine = list.find((x) => x.current);
      const prev = readDeviceState();
      if (mine && (mine.status !== prev.status || mine.coolingOffUntil !== prev.coolingOffUntil)) {
        writeDeviceState({ ...prev, id: prev.id ?? mine.id, status: mine.status, coolingOffUntil: mine.coolingOffUntil });
      }
      return list;
    },
    enabled: opts.enabled ?? true,
    refetchInterval: opts.poll ?? false,
    retry: false,
  });
  return { devices: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/* ── actions ──────────────────────────────────────────────────────── */

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.map((x: any) => (typeof x === "string" ? x : x?.id)).filter(Boolean) : []);

/** Approve a pending device from this (trusted) one with the passkey. */
export async function approveDevice(id: string) {
  const { data: ch } = await riftRequest<any>("POST", `/v1/devices/${encodeURIComponent(id)}/approve/challenge`, {});
  const c = unwrap(ch);
  const authProof = await signTicket({ hashToSign: c.hashToSign, allowCredentials: ids(c.allowCredentials) });
  const { data } = await riftRequest<any>("POST", `/v1/devices/${encodeURIComponent(id)}/approve`, { challengeId: c.challengeId, authProof });
  return unwrap(data) as { status: DeviceStatus };
}

export async function removeDevice(id: string) {
  await riftRequest("DELETE", `/v1/devices/${encodeURIComponent(id)}`);
}

export async function startRecovery(id: string): Promise<{ sentTo?: string }> {
  const { data } = await riftRequest<any>("POST", `/v1/devices/${encodeURIComponent(id)}/recover/start`, {});
  return unwrap(data) ?? {};
}

export async function verifyRecovery(id: string, otpCode: string): Promise<{ status: DeviceStatus; coolingOffUntil?: string }> {
  const { data } = await riftRequest<any>("POST", `/v1/devices/${encodeURIComponent(id)}/recover/verify`, { otpCode });
  const d = unwrap(data);
  writeDeviceState({ ...readDeviceState(), status: d.status, coolingOffUntil: d.coolingOffUntil });
  return d;
}

/** From the emailed link: no sign-in needed. */
export async function cancelDevice(id: string, token: string): Promise<{ status: DeviceStatus }> {
  const res = await fetch(`${getApiBase()}/v1/devices/${encodeURIComponent(id)}/recover/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeaders(null)["x-api-key"] ? { "x-api-key": authHeaders(null)["x-api-key"] } : {}) },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json?.message || "This link has expired or was already used."), { status: res.status, code: json?.error });
  return unwrap(json);
}

export function useInvalidateDevices() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["devices"] });
}

/* ── countdown ────────────────────────────────────────────────────── */

export function useCountdownTo(until?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const ms = Math.max(0, new Date(until).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { ms, text: `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`, short: h > 0 ? `${h}h ${m}m` : `${m}m ${s}s` };
}

export const formatWhen = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
