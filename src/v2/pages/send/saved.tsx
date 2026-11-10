/**
 * Saved beneficiaries in Send: a quick-pick list at the top of the recipient
 * step, and a "Save as beneficiary" offer after a successful send.
 */
import { useState } from "react";
import { Check, Landmark, Loader2, Receipt, Smartphone, Store, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BENEFICIARY_TYPE_LABEL,
  maskIdentifier,
  sameBeneficiary,
  useBeneficiaries,
  useSaveBeneficiary,
  type Beneficiary,
  type BeneficiaryType,
  type NewBeneficiary,
} from "@/v2/lib/beneficiaries";
import { Button, INPUT_CLASS } from "@/v2/ui";
import { Monogram } from "@/v2/ui/picker";

const TYPE_ICON: Record<BeneficiaryType, typeof Wallet> = { wallet: Wallet, mobile: Smartphone, till: Store, paybill: Receipt, bank: Landmark };

export function BeneficiaryTypeIcon({ type, className }: { type: BeneficiaryType; className?: string }) {
  const Icon = TYPE_ICON[type] ?? Wallet;
  return <Icon className={cn("h-3.5 w-3.5", className)} aria-hidden="true" />;
}

export function BeneficiaryAvatar({ b, className }: { b: Pick<Beneficiary, "label" | "type">; className?: string }) {
  return (
    <span className={cn("relative flex-shrink-0", className)}>
      <Monogram text={b.label} className="h-10 w-10 text-[13px]" />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-card text-ink-2 ring-1 ring-hairline">
        <BeneficiaryTypeIcon type={b.type} className="h-[11px] w-[11px]" />
      </span>
    </span>
  );
}

/** "Recent & saved": tap one to fill in the recipient. */
export function SavedBeneficiaries({
  types,
  currency,
  selectedId,
  onPick,
  limit = 5,
}: {
  types: BeneficiaryType[];
  currency?: string;
  selectedId?: string;
  onPick: (b: Beneficiary) => void;
  limit?: number;
}) {
  const { beneficiaries } = useBeneficiaries();
  const list = beneficiaries.filter((b) => types.includes(b.type) && (!currency || !b.currency || b.currency === currency)).slice(0, limit);
  if (!list.length) return null;
  return (
    <section aria-label="Recent and saved" className="mb-5" data-testid="saved-beneficiaries">
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Recent &amp; saved</h3>
      <ul className="-mx-2 space-y-0.5">
        {list.map((b) => {
          const active = b.id === selectedId;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onPick(b)}
                aria-pressed={active}
                data-testid="saved-beneficiary"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors cursor-pointer",
                  active ? "bg-teal-50 ring-1 ring-accent-primary/40" : "hover:bg-surface-subtle"
                )}
              >
                <BeneficiaryAvatar b={b} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-ink">{b.label}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">
                    {b.bankName ?? b.network ?? BENEFICIARY_TYPE_LABEL[b.type]} · {maskIdentifier(b)}
                  </span>
                </span>
                {active && <Check className="h-4 w-4 flex-shrink-0 text-accent-primary" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** After a successful send: offer to save the recipient (unless already saved). */
export function SaveBeneficiaryOffer({ draft, alreadySavedId }: { draft: NewBeneficiary | null; alreadySavedId?: string }) {
  const { beneficiaries, available } = useBeneficiaries();
  const save = useSaveBeneficiary();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(draft?.accountName ?? draft?.label ?? "");
  const [done, setDone] = useState(false);

  if (!draft || !available) return null;
  const exists = alreadySavedId || beneficiaries.some((b) => sameBeneficiary(b, draft));
  if (exists && !done) return null;

  if (done)
    return (
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[13.5px] font-medium text-success" role="status" data-testid="beneficiary-saved">
        <Check className="h-4 w-4" aria-hidden="true" />
        Saved as {label.trim() || draft.label}
      </p>
    );

  if (!open)
    return (
      <Button variant="secondary" block className="mt-3" onClick={() => setOpen(true)} data-testid="save-beneficiary">
        Save as beneficiary
      </Button>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save.mutateAsync({ ...draft, label: label.trim() || draft.label });
      setDone(true);
    } catch {
      /* error shown below */
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl bg-surface-subtle p-3" data-testid="save-beneficiary-form">
      <label htmlFor="beneficiary-label" className="mb-1.5 block text-[13px] font-medium text-ink-2">
        Nickname
      </label>
      <div className="flex gap-2">
        <input id="beneficiary-label" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus maxLength={60} className={cn(INPUT_CLASS, "min-w-0 flex-1")} />
        <Button type="submit" disabled={save.isPending || !label.trim()}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save
        </Button>
      </div>
      {save.isError && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {(save.error as Error)?.message || "Couldn't save. Try again."}
        </p>
      )}
    </form>
  );
}
