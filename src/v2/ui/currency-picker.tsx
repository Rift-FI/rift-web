import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Picker } from "./picker";

export interface CurrencyMeta {
  code: string;
  name: string;
  iso: string; // flag (ISO 3166 alpha-2)
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: "USD", name: "US Dollar", iso: "us" },
  { code: "KES", name: "Kenyan Shilling", iso: "ke" },
  { code: "NGN", name: "Nigerian Naira", iso: "ng" },
  { code: "UGX", name: "Ugandan Shilling", iso: "ug" },
  { code: "TZS", name: "Tanzanian Shilling", iso: "tz" },
  { code: "CDF", name: "Congolese Franc", iso: "cd" },
  { code: "MWK", name: "Malawian Kwacha", iso: "mw" },
  { code: "BRL", name: "Brazilian Real", iso: "br" },
  { code: "GHS", name: "Ghanaian Cedi", iso: "gh" },
  { code: "ETB", name: "Ethiopian Birr", iso: "et" },
];

export const currencyMeta = (code: string) => CURRENCIES.find((c) => c.code === code) ?? { code, name: code, iso: "un" };

export function Flag({ iso, className }: { iso: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      aria-hidden="true"
      className={cn("h-5 w-5 flex-shrink-0 rounded-full bg-surface-subtle object-cover ring-1 ring-hairline", className)}
    />
  );
}

/**
 * Currency / country picker on the shared picker surface: a bottom sheet on
 * mobile, a popover on desktop, with search and flags.
 */
export function CurrencyPicker({
  value,
  onChange,
  codes,
  items,
  label = "Currency",
  variant = "field",
  testId,
}: {
  value: string;
  onChange: (code: string) => void;
  codes?: string[];
  /** Custom rows (e.g. country names) instead of the currency table. */
  items?: CurrencyMeta[];
  label?: string;
  /** "field" = full-width input look; "chip" = small inline trigger. */
  variant?: "field" | "chip";
  testId?: string;
}) {
  const rows = useMemo(() => items ?? (codes ? codes.map(currencyMeta) : CURRENCIES), [codes, items]);
  const options = useMemo(() => rows.map((c) => ({ value: c.code, label: c.name, description: c.code, icon: <Flag iso={c.iso} className="h-7 w-7" /> })), [rows]);
  const current = rows.find((o) => o.code === value) ?? currencyMeta(value);
  return (
    <Picker
      value={value}
      onChange={onChange}
      options={options}
      label={label}
      searchable
      variant={variant}
      testId={testId}
      panelTestId="currency-picker"
      triggerIcon={<Flag iso={current.iso} className={variant === "chip" ? "h-4 w-4" : undefined} />}
      triggerText={variant === "field" && items ? `${current.name} · ${current.code}` : current.code}
      className={cn(variant === "chip" && "pl-1.5")}
    />
  );
}
