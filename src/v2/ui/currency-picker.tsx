import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useDesktopDetection from "@/hooks/use-desktop-detection";

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
 * Currency picker: a bottom sheet on mobile, a popover on desktop. Search,
 * flags, name + code, a check on the current one.
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
  const isDesktop = useDesktopDetection();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const options = useMemo(() => items ?? (codes ? codes.map(currencyMeta) : CURRENCIES), [codes, items]);
  const filtered = options.filter((c) => !q || `${c.code} ${c.name}`.toLowerCase().includes(q.toLowerCase()));
  const current = options.find((o) => o.code === value) ?? currencyMeta(value);

  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (isDesktop && !wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, isDesktop]);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const panel = (
    <div
      role="dialog"
      aria-label={`Choose ${label.toLowerCase()}`}
      data-testid="currency-picker"
      className={cn(
        "flex flex-col bg-card text-ink",
        isDesktop
          ? "absolute left-0 top-full z-[75] mt-2 w-80 overflow-hidden rounded-2xl shadow-lg ring-1 ring-hairline animate-in fade-in zoom-in-95 duration-150"
          : "fixed inset-x-0 bottom-0 z-[90] max-h-[80dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-modal animate-in slide-in-from-bottom duration-200"
      )}
    >
      {!isDesktop && (
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-hairline-strong" />
          <h2 className="pt-3 text-[16px] font-semibold">{label}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="mt-3 rounded-full p-1.5 text-ink-3 hover:bg-surface-subtle cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="px-3 pb-2 pt-3">
        <label className="relative block">
          <span className="sr-only">Search currencies</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-10 w-full rounded-xl bg-surface-subtle pl-9 pr-3 text-[14.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          />
        </label>
      </div>
      <ul id={listId} role="listbox" aria-label={label} className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.map((c) => {
          const selected = c.code === value;
          return (
            <li key={c.code}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(c.code)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer", selected ? "bg-teal-50" : "hover:bg-surface-subtle")}
              >
                <Flag iso={c.iso} className="h-7 w-7" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-ink">{c.name}</span>
                  <span className="block text-[12.5px] text-ink-3">{c.code}</span>
                </span>
                {selected && <Check className="h-4 w-4 text-accent-primary" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="px-3 py-6 text-center text-[13.5px] text-ink-3">No match</li>}
      </ul>
    </div>
  );

  return (
    <div ref={wrapRef} className={cn("relative", variant === "field" ? "w-full" : "inline-block")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${current.code}`}
        data-testid={testId}
        className={cn(
          "flex items-center gap-2 transition-colors cursor-pointer",
          variant === "field"
            ? "h-11 w-full rounded-md border border-hairline-strong bg-card px-3 text-left text-[15px] text-ink hover:border-ink-3 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
            : "h-8 rounded-full bg-surface-subtle px-2.5 text-[13px] font-medium text-ink-2 hover:text-ink"
        )}
      >
        <Flag iso={current.iso} className={variant === "chip" ? "h-4 w-4" : undefined} />
        <span className={variant === "field" ? "flex-1 truncate font-medium" : ""}>
          {variant === "field" && items ? `${current.name} · ${current.code}` : current.code}
        </span>
        <ChevronDown className="h-4 w-4 text-ink-3" aria-hidden="true" />
      </button>
      {open &&
        (isDesktop
          ? panel
          : createPortal(
              <div className="fixed inset-0 z-[89]">
                <div className="absolute inset-0 bg-[#0b1214]/45 animate-in fade-in duration-150" onClick={() => setOpen(false)} aria-hidden="true" />
                {panel}
              </div>,
              document.body
            ))}
    </div>
  );
}
