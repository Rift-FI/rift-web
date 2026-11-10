/**
 * Beneficiary name lookup (POST /v1/payouts/validate) before paying, so the
 * user sees "Paying JOHN DOE" and can't send to a mistyped number.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
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
  | { state: "invalid"; message: string }
  /** Lookup not available (endpoint missing / network) — don't block. */
  | { state: "unavailable" };

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
        const { data } = await riftRequest<any>("POST", "/v1/payouts/validate", input);
        if (cancelled) return;
        const d = data?.data ?? data;
        if (d?.valid === true && d?.accountName) setV({ state: "valid", name: String(d.accountName) });
        else if (d?.valid === false) setV({ state: "invalid", message: d?.message || "We couldn't find this account. Check the details." });
        else setV({ state: "unavailable" });
      } catch (e: any) {
        if (cancelled) return;
        // 4xx with a reason = a real "not found"; anything else = lookup unavailable.
        if (e?.status === 400 || e?.status === 422) setV({ state: "invalid", message: e?.message || "We couldn't find this account. Check the details." });
        else setV({ state: "unavailable" });
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
  if (validation.state === "invalid")
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-tint-danger px-4 py-3 text-[13.5px] text-danger" role="alert" data-testid="beneficiary">
        <XCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        {validation.message}
      </p>
    );
  return null;
}
