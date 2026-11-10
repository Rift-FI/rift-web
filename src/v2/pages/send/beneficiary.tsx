/**
 * Beneficiary name lookup (POST /v1/payouts/validate) before paying, so the
 * user sees "Paying JOHN DOE". Not every number or account resolves to a
 * name, so a miss never blocks: the user is asked to double-check instead.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { riftRequest } from "@/lib/nonCustodial";

export interface ValidateInput {
  currency: string;
  type: "mobile" | "till" | "paybill" | "bank";
  phone?: string;
  network?: string;
  till?: string;
  paybill?: string;
  accountNumber?: string;
  bankCode?: string;
}

export type Validation =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; name: string }
  /** No name found, or the lookup is unavailable. Never blocks sending. */
  | { state: "unconfirmed" };

const LOOKUP_TIMEOUT_MS = 8000;

export function useBeneficiary(input: ValidateInput | null): Validation {
  const key = input ? JSON.stringify(input) : "";
  const [v, setV] = useState<Validation>({ state: "idle" });

  useEffect(() => {
    if (!input) {
      setV({ state: "idle" });
      return;
    }
    // Wait until the number looks complete.
    const id = input.phone ?? input.till ?? input.paybill ?? input.accountNumber ?? "";
    if (id.replace(/\D/g, "").length < (input.type === "mobile" ? 9 : 4)) {
      setV({ state: "idle" });
      return;
    }
    let cancelled = false;
    setV({ state: "checking" });
    const t = setTimeout(async () => {
      try {
        const { data } = await Promise.race([
          riftRequest<any>("POST", "/v1/payouts/validate", input),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), LOOKUP_TIMEOUT_MS)),
        ]);
        if (cancelled) return;
        const d = data?.data ?? data;
        setV(d?.valid === true && d?.accountName ? { state: "valid", name: String(d.accountName) } : { state: "unconfirmed" });
      } catch {
        if (!cancelled) setV({ state: "unconfirmed" });
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key]);

  return v;
}

export function BeneficiaryStatus({ validation }: { validation: Validation }) {
  if (validation.state === "checking")
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-surface-subtle px-4 py-3 text-[13.5px] text-ink-3" role="status" data-testid="beneficiary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Checking account…
      </p>
    );
  if (validation.state === "valid")
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-tint-success px-4 py-3 text-[14px] text-ink" role="status" data-testid="beneficiary">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" aria-hidden="true" />
        <span>
          Paying <strong className="font-semibold uppercase tracking-wide">{validation.name}</strong>
        </span>
      </p>
    );
  if (validation.state === "unconfirmed")
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-tint-warning px-4 py-3 text-[13.5px] text-ink-2" role="status" data-testid="beneficiary">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" aria-hidden="true" />
        <span>We couldn’t confirm the recipient’s name. Double-check the number or account before you send.</span>
      </p>
    );
  return null;
}
