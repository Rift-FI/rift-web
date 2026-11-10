/**
 * Download statement: date range + format + delivery → passkey approval
 * (POST /v1/statements/challenge → sign hashToSign → POST /v1/statements).
 */
import { useMemo, useState } from "react";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { CheckCircle2, Fingerprint, Loader2 } from "lucide-react";
import { authHeaders, backendBaseUrl, riftRequest, signTicket } from "@/lib/nonCustodial";
import { cn } from "@/lib/utils";
import { Button, Field, INPUT_CLASS, Segmented, SideSheet } from "@/v2/ui";

type Format = "pdf" | "csv";
type Delivery = "download" | "email";
type Stage = "form" | "signing" | "done";

const PRESETS = [
  { id: "this-month", label: "This month", range: () => [startOfMonth(new Date()), new Date()] as const },
  { id: "last-month", label: "Last month", range: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] as const },
  { id: "90d", label: "Last 90 days", range: () => [subDays(new Date(), 90), new Date()] as const },
];

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

function credIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: any) => (typeof c === "string" ? c : c?.id ?? c?.credentialId ?? c?.cred_id_b64)).filter(Boolean);
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function StatementSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [from, setFrom] = useState(ymd(startOfMonth(new Date())));
  const [to, setTo] = useState(ymd(new Date()));
  const [fmt, setFmt] = useState<Format>("pdf");
  const [delivery, setDelivery] = useState<Delivery>("download");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const rangeError = useMemo(() => {
    if (!from || !to) return "Pick both dates";
    if (from > to) return "The start date is after the end date";
    if (to > ymd(new Date())) return "The end date is in the future";
    return null;
  }, [from, to]);

  const reset = () => {
    setStage("form");
    setError(null);
    setSentTo(null);
  };

  const submit = async () => {
    if (rangeError) return;
    setError(null);
    setStage("signing");
    try {
      const { data: ch } = await riftRequest<any>("POST", "/v1/statements/challenge", {});
      const c = ch?.data ?? ch;
      const authProof = await signTicket({ hashToSign: c.hashToSign, allowCredentials: credIds(c.allowCredentials) });
      const body = { challengeId: c.challengeId, authProof, from, to, format: fmt, delivery };
      const res = await fetch(`${backendBaseUrl()}/v1/statements`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const type = res.headers.get("content-type") || "";
      if (!res.ok) {
        const j = type.includes("json") ? await res.json().catch(() => ({})) : {};
        throw new Error(j?.message || j?.error || (res.status === 429 ? "Too many statements requested. Try again later." : "Couldn't create the statement"));
      }
      const name = `rift-statement-${from}-to-${to}.${fmt}`;
      if (type.includes("json")) {
        const j = await res.json();
        const d = j?.data ?? j;
        if (delivery === "email") {
          setSentTo(d?.to ?? null);
        } else if (d?.downloadUrl) {
          const file = await fetch(d.downloadUrl);
          save(await file.blob(), name);
        }
      } else {
        save(await res.blob(), name);
      }
      setStage("done");
    } catch (e: any) {
      setError(e?.message || "Couldn't create the statement");
      setStage("form");
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Statement"
      testId="statement-sheet"
      footer={
        stage === "done" ? (
          <Button
            block
            variant="secondary"
            onClick={() => {
              onClose();
              reset();
            }}
          >
            Done
          </Button>
        ) : (
          <Button block size="lg" onClick={submit} disabled={!!rangeError || stage === "signing"} data-testid="statement-submit">
            {stage === "signing" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-4 w-4" aria-hidden="true" />}
            {stage === "signing" ? "Waiting for passkey…" : "Approve with passkey"}
          </Button>
        )
      }
    >
      {stage === "done" ? (
        <div className="flex flex-col items-center py-10 text-center" role="status" data-testid="statement-done">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          <p className="mt-3 text-[16px] font-semibold text-ink">{delivery === "email" ? "Statement sent" : "Statement downloaded"}</p>
          <p className="mt-1 text-[13.5px] text-ink-3">
            {delivery === "email" ? `We emailed it to ${sentTo ?? "your email"}.` : `${from} to ${to} · ${fmt.toUpperCase()}`}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2" aria-label="Quick ranges">
            {PRESETS.map((p) => {
              const [a, b] = p.range();
              const active = ymd(a) === from && ymd(b) === to;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setFrom(ymd(a));
                    setTo(ymd(b));
                  }}
                  className={cn(
                    "h-8 rounded-full px-3 text-[13px] font-medium cursor-pointer",
                    active ? "bg-teal-50 text-accent-primary ring-1 ring-accent-primary" : "bg-surface-subtle text-ink-2 hover:text-ink"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="statement-from">
              <input id="statement-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="To" htmlFor="statement-to" error={rangeError ?? undefined}>
              <input id="statement-to" type="date" value={to} min={from} max={ymd(new Date())} onChange={(e) => setTo(e.target.value)} className={INPUT_CLASS} />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Format</p>
            <Segmented
              label="Format"
              value={fmt}
              onChange={setFmt}
              options={[
                { value: "pdf", label: "PDF" },
                { value: "csv", label: "CSV" },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Delivery</p>
            <Segmented
              label="Delivery"
              value={delivery}
              onChange={setDelivery}
              options={[
                { value: "download", label: "Download" },
                { value: "email", label: "Email" },
              ]}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-tint-danger px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </SideSheet>
  );
}
