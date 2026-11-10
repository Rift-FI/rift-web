/**
 * Saved beneficiaries (GET/POST/PATCH/DELETE /v1/beneficiaries). Sends accept
 * an optional beneficiaryId. When the endpoint isn't available the list is
 * empty and nothing else changes.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authHeaders, backendBaseUrl, riftRequest } from "@/lib/nonCustodial";

export type BeneficiaryType = "wallet" | "mobile" | "till" | "paybill" | "bank";

export interface Beneficiary {
  id: string;
  label: string;
  type: BeneficiaryType;
  country?: string;
  currency?: string;
  network?: string;
  bankCode?: string;
  bankName?: string;
  identifier: string;
  /** Paybill account number (identifier is the paybill). */
  accountNumber?: string;
  accountName?: string;
  lastUsedAt?: string;
  useCount?: number;
}

export type NewBeneficiary = Omit<Beneficiary, "id" | "lastUsedAt" | "useCount">;

const KEY = ["beneficiaries"];
const unwrap = (d: any) => d?.data ?? d;

function normalise(raw: any): Beneficiary | null {
  if (!raw?.id || !raw?.identifier) return null;
  return { ...raw, id: String(raw.id), label: String(raw.label ?? raw.accountName ?? raw.identifier), identifier: String(raw.identifier) } as Beneficiary;
}

export function useBeneficiaries() {
  const q = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Beneficiary[]> => {
      const { data } = await riftRequest<any>("GET", "/v1/beneficiaries");
      const d = unwrap(data);
      const list = Array.isArray(d) ? d : d?.beneficiaries ?? [];
      return (list as any[])
        .map(normalise)
        .filter(Boolean)
        .sort((a, b) => String(b!.lastUsedAt ?? "").localeCompare(String(a!.lastUsedAt ?? "")) || (b!.useCount ?? 0) - (a!.useCount ?? 0)) as Beneficiary[];
    },
    // A network blip must not hide the feature: retry, and only treat a
    // missing endpoint (404) as "not available".
    retry: (count, err: any) => count < 2 && err?.status !== 404,
    staleTime: 60_000,
  });
  const missing = (q.error as any)?.status === 404;
  return { beneficiaries: q.data ?? [], isLoading: q.isLoading, available: !missing };
}

async function send(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) {
  const res = await fetch(`${backendBaseUrl()}${path}`, { method, headers: authHeaders(), body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Couldn't save. Try again.");
  return unwrap(json);
}

export function useSaveBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: NewBeneficiary) => send("POST", "/v1/beneficiaries", b) as Promise<Beneficiary>,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRenameBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => send("PATCH", `/v1/beneficiaries/${encodeURIComponent(id)}`, { label }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => send("DELETE", `/v1/beneficiaries/${encodeURIComponent(id)}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Beneficiary[]>(KEY);
      qc.setQueryData<Beneficiary[]>(KEY, (l) => (l ?? []).filter((b) => b.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** "•••• 5678" style masking; wallet addresses as 0x12…abcd. */
export function maskIdentifier(b: Pick<Beneficiary, "type" | "identifier">) {
  const id = b.identifier.trim();
  if (b.type === "wallet") return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
  if (b.type === "till" || b.type === "paybill") return id;
  const digits = id.replace(/\s/g, "");
  return digits.length > 4 ? `•••• ${digits.slice(-4)}` : digits;
}

export const BENEFICIARY_TYPE_LABEL: Record<BeneficiaryType, string> = {
  wallet: "Wallet",
  mobile: "Mobile money",
  till: "Till",
  paybill: "Paybill",
  bank: "Bank",
};

export const sameBeneficiary = (a: Pick<Beneficiary, "type" | "identifier" | "accountNumber">, b: Pick<Beneficiary, "type" | "identifier" | "accountNumber">) =>
  a.type === b.type &&
  a.identifier.replace(/\s/g, "").toLowerCase() === b.identifier.replace(/\s/g, "").toLowerCase() &&
  (a.accountNumber ?? "") === (b.accountNumber ?? "");
