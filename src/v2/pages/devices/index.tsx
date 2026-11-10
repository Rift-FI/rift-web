import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Fingerprint, Laptop, Loader2, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDeviceBlock } from "@/lib/device";
import {
  approveDevice,
  effectiveStatus,
  formatWhen,
  removeDevice,
  useCountdownTo,
  useDevices,
  useInvalidateDevices,
  useThisDevice,
  type DeviceRow,
} from "@/v2/lib/devices";
import { Button, Card, EmptyState, Page, PageHeader, SkeletonRows, StatusPill } from "@/v2/ui";
import { ApproveDevicePanel } from "./approve-panel";

const PILL: Record<string, { status: "completed" | "awaiting_payment" | "processing" | "cancelled"; label: string }> = {
  trusted: { status: "completed", label: "Trusted" },
  pending: { status: "awaiting_payment", label: "Pending" },
  cooling_off: { status: "processing", label: "Waiting period" },
  revoked: { status: "cancelled", label: "Removed" },
};

function PlatformIcon({ platform }: { platform?: string }) {
  const Icon = platform === "ios" || platform === "android" ? Smartphone : platform === "macos" ? Laptop : Monitor;
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-ink-2">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

const ago = (iso?: string) => {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "Active now";
  if (s < 3600) return `Active ${Math.round(s / 60)} min ago`;
  if (s < 86400) return `Active ${Math.round(s / 3600)} h ago`;
  return `Active ${new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
};

/** Settings → Devices: which phones and computers can move money. */
export default function Devices() {
  const navigate = useNavigate();
  const { devices, isLoading, isError, refetch } = useDevices({ poll: 15_000 });
  const me = useThisDevice();
  const [panel, setPanel] = useState(false);
  const list = devices.filter((d) => d.status !== "revoked");
  const current = list.find((d) => d.current);
  const currentTrusted = current ? effectiveStatus(current) === "trusted" : effectiveStatus(me) === "trusted";

  return (
    <Page width="narrow">
      <button type="button" onClick={() => navigate("/app/settings")} className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-3 hover:text-ink cursor-pointer">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Settings
      </button>
      <PageHeader title="Devices" description="Money only moves from devices you trust." />

      {current && !currentTrusted && (
        <button
          type="button"
          onClick={() => setPanel(true)}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-teal-50 px-4 py-3.5 text-left text-[14px] text-ink cursor-pointer"
          data-testid="this-device-callout"
        >
          <span>This device isn't approved yet.</span>
          <span className="font-semibold text-accent-primary">Approve</span>
        </button>
      )}

      <Card>
        {isLoading ? (
          <div className="p-5">
            <SkeletonRows rows={2} />
          </div>
        ) : isError ? (
          <EmptyState title="Couldn't load your devices" description="Check your connection and try again." action={<Button variant="secondary" onClick={() => refetch()}>Try again</Button>} />
        ) : list.length === 0 ? (
          <EmptyState title="No devices yet" description="This device appears here after it's set up." />
        ) : (
          <ul className="divide-y divide-hairline" data-testid="device-list">
            {list.map((d) => (
              <DeviceItem key={d.id} d={d} canApprove={currentTrusted && !d.current} onOpenPanel={() => setPanel(true)} />
            ))}
          </ul>
        )}
      </Card>
      {panel && <ApproveDevicePanel onClose={() => setPanel(false)} />}
    </Page>
  );
}

function DeviceItem({ d, canApprove, onOpenPanel }: { d: DeviceRow; canApprove: boolean; onOpenPanel: () => void }) {
  const invalidate = useInvalidateDevices();
  const status = effectiveStatus(d) ?? "unknown";
  const pill = PILL[status] ?? { status: "cancelled" as const, label: "Unknown" };
  const cd = useCountdownTo(status === "cooling_off" ? d.coolingOffUntil : undefined);
  const [busy, setBusy] = useState<"approve" | "remove" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const approve = async () => {
    setBusy("approve");
    setNote(null);
    try {
      await approveDevice(d.id);
      await invalidate();
    } catch (e: any) {
      if (!isDeviceBlock(e)) setNote(e?.message || "Couldn't approve. Try again.");
    } finally {
      setBusy(null);
    }
  };
  const remove = async () => {
    setBusy("remove");
    setNote(null);
    try {
      await removeDevice(d.id);
      await invalidate();
    } catch (e: any) {
      if (isDeviceBlock(e)) return;
      setNote(e?.code === "LAST_TRUSTED_DEVICE" || e?.status === 409 ? "This is your only trusted device. Approve another one before removing it." : e?.message || "Couldn't remove. Try again.");
    } finally {
      setBusy(null);
      setConfirm(false);
    }
  };

  return (
    <li className="px-5 py-4" data-testid="device-row" data-status={status}>
      <div className="flex items-center gap-3">
        <PlatformIcon platform={d.platform} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14.5px] font-medium text-ink">
            <span className="truncate">{d.label}</span>
            {d.current && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11.5px] font-semibold text-accent-primary" data-testid="this-device">This device</span>}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
            {status === "cooling_off" && cd ? (
              <span data-testid="device-row-countdown">Can move money in {cd.text}</span>
            ) : status === "pending" ? (
              `Added ${formatWhen(d.createdAt)}`
            ) : (
              ago(d.lastSeenAt) || `Added ${formatWhen(d.createdAt)}`
            )}
          </p>
        </div>
        <span className="hidden flex-shrink-0 sm:inline-flex">
          <StatusPill status={pill.status} label={pill.label} />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-[52px]">
        <span className="sm:hidden">
          <StatusPill status={pill.status} label={pill.label} />
        </span>
        {(status === "pending" || status === "cooling_off") && canApprove && (
          <Button size="sm" onClick={approve} disabled={!!busy} data-testid="approve-device">
            {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />}
            Approve
          </Button>
        )}
        {d.current && status !== "trusted" && (
          <Button size="sm" variant="secondary" onClick={onOpenPanel}>
            Options
          </Button>
        )}
        {confirm ? (
          <>
            <Button size="sm" variant="danger" onClick={remove} disabled={!!busy} data-testid="confirm-remove-device">
              {busy === "remove" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Remove
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" className={cn("!text-ink-3 hover:!text-danger")} onClick={() => setConfirm(true)} aria-label={`Remove ${d.label}`}>
            Remove
          </Button>
        )}
      </div>
      {note && (
        <p className="mt-2 pl-[52px] text-[13px] text-ink-2" role="status">
          {note}
        </p>
      )}
    </li>
  );
}
