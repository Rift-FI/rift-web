import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { authHeaders } from "@/lib/nonCustodial";
import {
  DEVICE_MESSAGE,
  DEVICE_NOT_TRUSTED_EVENT,
  deviceLabel,
  recentlyBlocked,
  registerDevice,
  resetDeviceKey,
} from "@/lib/device";
import { effectiveStatus, formatWhen, startRecovery, useCountdownTo, useDevicePolicy, useDevices, useThisDevice, verifyRecovery } from "@/v2/lib/devices";
import { Button, INPUT_CLASS } from "@/v2/ui";

/* A blocked money action already shows the calm panel: drop its error toast. */
const originalError = toast.error;
(toast as unknown as { error: typeof toast.error }).error = ((message: unknown, data?: unknown) => {
  if (message === DEVICE_MESSAGE || recentlyBlocked()) return "";
  return originalError(message as string, data as Parameters<typeof toast.error>[1]);
}) as typeof toast.error;

type Stage = "choose" | "otp" | "cooling" | "approved" | "revoked";

const SESSION_KEY = "rift_device_panel_seen";

/**
 * Registers this device on app start and, when it isn't trusted yet, offers
 * the "Approve this device" panel. Viewing never waits on this.
 */
export function DeviceGate() {
  const device = useThisDevice();
  const { enforced } = useDevicePolicy();
  const [open, setOpen] = useState(false);
  const status = effectiveStatus(device);
  const waiting = status === "pending" || status === "cooling_off" || status === "revoked";

  useEffect(() => {
    registerDevice(() => authHeaders());
  }, []);

  // A new pending device: show the panel once per session when the server enforces.
  useEffect(() => {
    if (!enforced || !waiting) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* storage blocked */
    }
    setOpen(true);
  }, [enforced, waiting]);

  // The server refused a money action from this device.
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(DEVICE_NOT_TRUSTED_EVENT, on);
    return () => window.removeEventListener(DEVICE_NOT_TRUSTED_EVENT, on);
  }, []);

  return (
    <>
      {waiting && !open && (enforced || status === "revoked") && <DeviceStrip status={status!} coolingOffUntil={device.coolingOffUntil} onOpen={() => setOpen(true)} />}
      {open && <ApproveDevicePanel onClose={() => setOpen(false)} />}
    </>
  );
}

function DeviceStrip({ status, coolingOffUntil, onOpen }: { status: string; coolingOffUntil?: string; onOpen: () => void }) {
  const cd = useCountdownTo(status === "cooling_off" ? coolingOffUntil : undefined);
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="device-strip"
      className="flex w-full flex-shrink-0 items-center gap-2.5 border-b border-hairline bg-surface-subtle px-4 py-2.5 text-left text-[13.5px] text-ink transition-colors hover:bg-teal-50 sm:px-6 cursor-pointer"
    >
      <ShieldCheck className="h-4 w-4 flex-shrink-0 text-accent-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        {status === "cooling_off" && cd ? `This device can send money in ${cd.short}` : status === "revoked" ? "This device was removed" : "Approve this device to send money"}
      </span>
      <span className="flex-shrink-0 font-semibold text-accent-primary">{status === "cooling_off" ? "Details" : "Approve"}</span>
    </button>
  );
}

export function ApproveDevicePanel({ onClose }: { onClose: () => void }) {
  const device = useThisDevice();
  const status = effectiveStatus(device);
  const initial: Stage = status === "trusted" ? "approved" : status === "cooling_off" ? "cooling" : status === "revoked" ? "revoked" : "choose";
  const [stage, setStage] = useState<Stage>(initial);
  const panelRef = useRef<HTMLDivElement>(null);
  // Watch for an approval from the other device.
  useDevices({ poll: stage === "choose" || stage === "cooling" ? 5000 : false });

  useEffect(() => {
    if (status === "trusted" && (stage === "choose" || stage === "cooling")) setStage("approved");
    if (status === "revoked") setStage("revoked");
    if (status === "pending" && stage === "revoked") setStage("choose");
  }, [status]);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
      <div className="rift-fade-in absolute inset-0 bg-[#0b1214]/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-panel-title"
        data-testid="device-panel"
        className="rift-sheet-in relative flex h-[100dvh] w-full flex-col overflow-y-auto bg-card text-ink focus:outline-none sm:h-auto sm:max-h-[90dvh] sm:max-w-[460px] sm:rounded-[28px] sm:shadow-modal"
      >
        <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] sm:pt-5">
          {stage === "otp" ? (
            <button type="button" onClick={() => setStage("choose")} aria-label="Back" className="-ml-2 rounded-full p-2 text-ink-2 hover:bg-surface-subtle cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-ink-3 hover:bg-surface-subtle cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-2 sm:pb-7">
          {stage === "choose" && <Choose onLost={() => setStage("otp")} />}
          {stage === "otp" && device.id && <Otp deviceId={device.id} onDone={() => setStage("cooling")} />}
          {stage === "cooling" && <Cooling until={device.coolingOffUntil} onClose={onClose} />}
          {stage === "approved" && <Approved onClose={onClose} />}
          {stage === "revoked" && <Revoked />}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Heading({ icon, title, body }: { icon: React.ReactNode; title: string; body?: React.ReactNode }) {
  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-accent-primary">{icon}</span>
      <h2 id="device-panel-title" className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      {body && <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{body}</p>}
    </div>
  );
}

function Choose({ onLost }: { onLost: () => void }) {
  const { label } = deviceLabel();
  return (
    <>
      <Heading icon={<ShieldCheck className="h-6 w-6" />} title="Approve this device" body="Money only moves from devices you've approved. You can still see your balance and activity here." />
      <div className="mt-6 rounded-2xl bg-surface-subtle p-5" data-testid="approve-elsewhere">
        <p className="text-[15px] font-semibold">Approve from your other device</p>
        <ol className="mt-3 space-y-2.5 text-[14.5px] text-ink-2">
          {["Open Rift on your other device", "Go to Settings → Devices", `Approve “${label}”`].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-card text-[12px] font-semibold text-accent-primary ring-1 ring-hairline">{i + 1}</span>
              <span className="pt-0.5">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-3" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Waiting for approval
        </p>
      </div>
      <div className="mt-auto pt-6">
        <Button variant="secondary" block size="lg" onClick={onLost} data-testid="device-lost">
          I don't have my other device
        </Button>
      </div>
    </>
  );
}

function Otp({ deviceId, onDone }: { deviceId: string; onDone: () => void }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setNote(null);
    try {
      const r = await startRecovery(deviceId);
      setSentTo(r.sentTo ?? null);
    } catch (e: any) {
      setNote(e?.message || "We couldn't send a code. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    send();
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      await verifyRecovery(deviceId, code.trim());
      onDone();
    } catch (err: any) {
      setNote(err?.message && !/failed \(/.test(err.message) ? err.message : "That code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={verify} className="flex flex-1 flex-col">
      <Heading
        icon={<Smartphone className="h-6 w-6" />}
        title="Enter the code"
        body={sending ? "Sending a code…" : sentTo ? <>We sent a code to <span className="font-medium text-ink">{sentTo}</span>.</> : "We sent you a code."}
      />
      <label htmlFor="device-otp" className="sr-only">
        Code
      </label>
      <input
        id="device-otp"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="000000"
        className={cn(INPUT_CLASS, "mt-6 !h-14 text-center text-[24px] font-semibold tracking-[0.4em] tabular-numeric")}
        data-testid="device-otp"
      />
      {note && (
        <p className="mt-3 text-[13.5px] text-ink-2" role="status">
          {note}
        </p>
      )}
      <p className="mt-4 text-[13.5px] text-ink-3">After you verify, this device can move money in 24 hours. We'll email you so you can stop it if it wasn't you.</p>
      <div className="mt-auto space-y-2 pt-6">
        <Button type="submit" size="lg" block disabled={code.length < 4 || busy} data-testid="device-otp-verify">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Verify
        </Button>
        <Button type="button" variant="ghost" block onClick={send} disabled={sending}>
          Send a new code
        </Button>
      </div>
    </form>
  );
}

function Cooling({ until, onClose }: { until?: string; onClose: () => void }) {
  const cd = useCountdownTo(until);
  return (
    <>
      <Heading icon={<Clock3 className="h-6 w-6" />} title="Almost there" body={<>This device can move money after <span className="font-medium text-ink">{formatWhen(until)}</span>.</>} />
      <div className="mt-6 rounded-2xl bg-surface-subtle px-5 py-6 text-center" data-testid="device-cooling">
        <p className="text-[13px] text-ink-3">Time left</p>
        <p className="mt-1 text-[36px] font-semibold tracking-[-0.02em] tabular-numeric" data-testid="device-countdown">
          {cd?.text ?? "—"}
        </p>
      </div>
      <p className="mt-4 text-[13.5px] text-ink-3">We emailed you a link to stop this if it wasn't you. Approving from another device skips the wait.</p>
      <div className="mt-auto pt-6">
        <Button size="lg" block onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}

function Approved({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Heading icon={<CheckCircle2 className="h-6 w-6" />} title="This device is approved" body="You can send money from here now." />
      <div className="mt-auto pt-6">
        <Button size="lg" block onClick={onClose} data-testid="device-approved-continue">
          Continue
        </Button>
      </div>
    </>
  );
}

function Revoked() {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Heading icon={<ShieldCheck className="h-6 w-6" />} title="This device was removed" body="Set it up again to ask for approval. Your balance and activity stay visible." />
      <div className="mt-auto pt-6">
        <Button
          size="lg"
          block
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await resetDeviceKey();
            await registerDevice(() => authHeaders());
            setBusy(false);
          }}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Set up this device again
        </Button>
      </div>
    </>
  );
}
