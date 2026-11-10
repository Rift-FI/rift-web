import { useState } from "react";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BENEFICIARY_TYPE_LABEL, maskIdentifier, useBeneficiaries, useDeleteBeneficiary, useRenameBeneficiary, type Beneficiary } from "@/v2/lib/beneficiaries";
import { BeneficiaryAvatar } from "@/v2/pages/send/saved";
import { Card, INPUT_CLASS } from "@/v2/ui";

/** Settings → Beneficiaries: rename or delete saved recipients. */
export function BeneficiariesCard() {
  const { beneficiaries, isLoading } = useBeneficiaries();
  return (
    <Card aria-labelledby="settings-beneficiaries-title" data-testid="settings-beneficiaries">
      <div className="border-b border-hairline px-5 py-4">
        <h2 id="settings-beneficiaries-title" className="text-[15px] font-semibold text-ink">
          Beneficiaries
        </h2>
      </div>
      {isLoading ? (
        <p className="px-5 py-4 text-[13.5px] text-ink-3">Loading…</p>
      ) : beneficiaries.length === 0 ? (
        <p className="px-5 py-4 text-[13.5px] text-ink-3">None saved yet. After a send, choose “Save as beneficiary”.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {beneficiaries.map((b) => (
            <BeneficiaryRow key={b.id} b={b} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function BeneficiaryRow({ b }: { b: Beneficiary }) {
  const rename = useRenameBeneficiary();
  const del = useDeleteBeneficiary();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [label, setLabel] = useState(b.label);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || label.trim() === b.label) return setEditing(false);
    try {
      await rename.mutateAsync({ id: b.id, label: label.trim() });
      setEditing(false);
    } catch {
      /* shown below */
    }
  };

  return (
    <li className="flex items-center gap-3 px-5 py-3" data-testid="beneficiary-row">
      <BeneficiaryAvatar b={{ ...b, label: editing ? label || b.label : b.label }} />
      {editing ? (
        <form onSubmit={save} className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor={`rename-${b.id}`} className="sr-only">
            Nickname
          </label>
          <input id={`rename-${b.id}`} value={label} onChange={(e) => setLabel(e.target.value)} autoFocus maxLength={60} className={cn(INPUT_CLASS, "!h-9 min-w-0 flex-1 text-[14px]")} />
          <button type="submit" aria-label="Save name" disabled={rename.isPending} className="rounded-full p-2 text-accent-primary transition-colors hover:bg-teal-50 cursor-pointer">
            {rename.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setLabel(b.label);
              setEditing(false);
            }}
            className="rounded-full p-2 text-ink-3 transition-colors hover:bg-surface-subtle cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-ink">{b.label}</span>
            <span className="block truncate text-[12.5px] text-ink-3">
              {BENEFICIARY_TYPE_LABEL[b.type]}
              {b.bankName || b.network ? ` · ${b.bankName ?? b.network}` : ""} · {maskIdentifier(b)}
            </span>
          </span>
          {confirming ? (
            <span className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => del.mutate(b.id)}
                disabled={del.isPending}
                className="h-8 rounded-full bg-tint-danger px-3 text-[13px] font-semibold text-danger transition-colors cursor-pointer"
              >
                Delete
              </button>
              <button type="button" aria-label="Keep" onClick={() => setConfirming(false)} className="rounded-full p-2 text-ink-3 transition-colors hover:bg-surface-subtle cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </span>
          ) : (
            <span className="flex flex-shrink-0 items-center">
              <button type="button" aria-label={`Rename ${b.label}`} onClick={() => setEditing(true)} className="rounded-full p-2 text-ink-3 transition-colors hover:bg-surface-subtle hover:text-ink cursor-pointer">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" aria-label={`Delete ${b.label}`} onClick={() => setConfirming(true)} className="rounded-full p-2 text-ink-3 transition-colors hover:bg-tint-danger hover:text-danger cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          )}
        </>
      )}
      {rename.isError && editing && <span className="sr-only" role="alert">Couldn't rename</span>}
    </li>
  );
}
