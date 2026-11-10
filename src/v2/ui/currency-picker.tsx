import { useMemo } from "react";
import {
  AO, BI, BJ, BR, BW, CD, CI, CM, EG, ET, GH, KE, MA, MW, MZ, NG, RW, SN, SS, TZ, UG, US, ZA, ZM, ZW,
} from "country-flag-icons/react/3x2";
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
];

export const currencyMeta = (code: string) => CURRENCIES.find((c) => c.code === code) ?? { code, name: code, iso: "un" };

const COUNTRY_ISO: Record<string, string> = {
  kenya: "ke", nigeria: "ng", uganda: "ug", tanzania: "tz", ghana: "gh", malawi: "mw", ethiopia: "et",
  rwanda: "rw", zambia: "zm", "south africa": "za", zimbabwe: "zw", cameroon: "cm", senegal: "sn",
  benin: "bj", mozambique: "mz", botswana: "bw", egypt: "eg", morocco: "ma", angola: "ao", burundi: "bi",
  brazil: "br", "united states": "us", "dr congo": "cd", "democratic republic of the congo": "cd",
  "congo (drc)": "cd", "côte d'ivoire": "ci", "ivory coast": "ci", "south sudan": "ss",
};

/** Flag code for a payout country row: the API's `country` is a name ("Kenya"), not an ISO code. */
export function isoFor(country: string | undefined, currency: string): string {
  const c = String(country ?? "").trim();
  if (/^[a-z]{2}$/i.test(c)) return c.toLowerCase();
  return COUNTRY_ISO[c.toLowerCase()] ?? currencyMeta(currency).iso;
}

// Bundled SVG flags (no network): a CDN image used to fail on slow or
// filtering networks and leave an empty circle. Unknown codes fall back
// to a two-letter badge.
const FLAGS: Record<string, typeof KE> = {
  us: US, ke: KE, ng: NG, ug: UG, tz: TZ, cd: CD, mw: MW, br: BR, gh: GH, et: ET,
  rw: RW, zm: ZM, za: ZA, zw: ZW, cm: CM, ci: CI, sn: SN, bj: BJ, mz: MZ, bw: BW, eg: EG, ma: MA, ao: AO, bi: BI, ss: SS,
};

export function Flag({ iso, className }: { iso: string; className?: string }) {
  const Svg = FLAGS[iso?.toLowerCase()];
  const base = cn("h-5 w-5 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-hairline", className);
  if (!Svg) {
    return (
      <span aria-hidden="true" className={cn(base, "inline-flex items-center justify-center bg-surface-subtle text-[8px] font-semibold uppercase text-ink-3")}>
        {(iso || "").slice(0, 2)}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn(base, "inline-block")} data-flag={iso}>
      <Svg className="h-full w-full scale-[1.5] object-cover" />
    </span>
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
  compact,
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
  /** Show only flag + code in the closed field (narrow columns). */
  compact?: boolean;
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
      triggerText={variant === "field" && items && !compact ? `${current.name} · ${current.code}` : current.code}
      className={cn(variant === "chip" && "pl-1.5")}
    />
  );
}
