import { useState } from "react";
import { useSearchParams } from "react-router";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { cancelDevice } from "@/v2/lib/devices";
import { Button } from "@/v2/ui";

/**
 * /devices/cancel?d=<deviceId>&t=<token>: the "Not you? Cancel" link from
 * the new-device email. Works without signing in.
 */
export default function CancelDevice() {
  const [params] = useSearchParams();
  const id = params.get("d") || "";
  const token = params.get("t") || "";
  const [state, setState] = useState<"ask" | "busy" | "done" | "error">(id && token ? "ask" : "error");
  const [message, setMessage] = useState("This link is incomplete. Open it again from the email.");

  const cancel = async () => {
    setState("busy");
    try {
      await cancelDevice(id, token);
      setState("done");
    } catch (e: any) {
      setMessage(e?.message || "This link has expired or was already used.");
      setState("error");
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-10 text-ink">
      <div className="w-full max-w-[420px] rounded-[28px] bg-card p-7 ring-1 ring-hairline" data-testid="device-cancel">
        <img src="/rift.png" alt="Rift" className="mb-6 h-8 w-8" onError={(e) => (e.currentTarget.style.display = "none")} />
        {state === "done" ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
            <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">Device blocked</h1>
            <p className="mt-2 text-[15px] text-ink-3">It can't move money from your account. Your other devices aren't affected.</p>
          </>
        ) : state === "error" ? (
          <>
            <ShieldAlert className="h-10 w-10 text-ink-3" aria-hidden="true" />
            <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">Link not valid</h1>
            <p className="mt-2 text-[15px] text-ink-3" role="status">
              {message}
            </p>
          </>
        ) : (
          <>
            <ShieldAlert className="h-10 w-10 text-accent-primary" aria-hidden="true" />
            <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">Block this new device?</h1>
            <p className="mt-2 text-[15px] text-ink-3">A new device is being added to your Rift account. If this wasn't you, block it now. Nothing else changes.</p>
            <Button size="lg" block className="mt-6" onClick={cancel} disabled={state === "busy"} data-testid="device-cancel-confirm">
              {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Block device
            </Button>
            <p className="mt-3 text-center text-[13px] text-ink-3">If it was you, you can close this page.</p>
          </>
        )}
      </div>
    </div>
  );
}
