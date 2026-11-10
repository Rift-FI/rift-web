/**
 * The picker family: one surface for every choice in the app. A bottom sheet
 * on mobile, an anchored popover on desktop. Search when the list is long,
 * icons/flags, a check on the current option, keyboard + screen reader
 * support, light and dark.
 */
import { ReactNode, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useDesktopDetection from "@/hooks/use-desktop-detection";

/* ── Surface ──────────────────────────────────────────────────────── */

type Pos = { left: number; width: number; top?: number; bottom?: number; maxHeight: number; side: "top" | "bottom" };

function usePopoverPosition(open: boolean, anchor: React.RefObject<HTMLElement | null>, minWidth: number) {
  const [pos, setPos] = useState<Pos | null>(null);
  const update = useCallback(() => {
    const el = anchor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(r.width, minWidth), vw - 16);
    const left = Math.min(Math.max(8, r.left), vw - width - 8);
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    if (below < 280 && above > below) setPos({ left, width, bottom: vh - r.top + 6, maxHeight: Math.min(420, above), side: "top" });
    else setPos({ left, width, top: r.bottom + 6, maxHeight: Math.min(420, below), side: "bottom" });
  }, [anchor, minWidth]);
  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);
  return pos;
}

export function PickerSurface({
  open,
  onClose,
  anchorRef,
  title,
  testId,
  minWidth = 280,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  testId?: string;
  minWidth?: number;
  children: ReactNode;
}) {
  const isDesktop = useDesktopDetection();
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = usePopoverPosition(open && isDesktop, anchorRef, minWidth);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchor?.contains(t)) return;
      closeRef.current();
    };
    if (isDesktop) document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      // Hand focus back to the trigger.
      if (anchor && (document.activeElement === document.body || panelRef.current?.contains(document.activeElement))) anchor.focus({ preventScroll: true });
    };
  }, [open, isDesktop]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      closeRef.current();
    }
  };

  if (isDesktop) {
    if (!pos) return null;
    return createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-label={title}
        data-testid={testId}
        data-side={pos.side}
        onKeyDown={onKeyDown}
        style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
        className="rift-pop-in fixed z-[95] flex flex-col overflow-hidden rounded-2xl bg-card text-ink shadow-[0_12px_40px_-12px_rgba(11,18,20,0.35)] ring-1 ring-hairline"
      >
        {children}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[95]" onKeyDown={onKeyDown}>
      <div className="rift-fade-in absolute inset-0 bg-[#0b1214]/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        className="rift-sheet-in absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-card pb-[max(env(safe-area-inset-bottom),12px)] text-ink shadow-modal"
      >
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 flex-shrink-0 rounded-full bg-hairline-strong" />
        <div className="flex flex-shrink-0 items-center justify-between px-5 pb-1 pt-2">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 rounded-full p-2 text-ink-3 transition-colors hover:bg-surface-subtle cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Trigger ──────────────────────────────────────────────────────── */

export const TRIGGER_FIELD =
  "flex h-11 w-full items-center gap-2.5 rounded-md border border-hairline-strong bg-card px-3 text-left text-[15px] text-ink transition-colors hover:border-ink-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 aria-expanded:border-accent-primary aria-expanded:ring-2 aria-expanded:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";
export const TRIGGER_CHIP =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 cursor-pointer";

/* ── Picker (single choice) ───────────────────────────────────────── */

export interface PickerOption<V extends string = string> {
  value: V;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Extra search terms. */
  keywords?: string;
  disabled?: boolean;
}

export function Picker<V extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = "Select",
  searchable,
  searchPlaceholder = "Search",
  variant = "field",
  size = "md",
  id,
  testId,
  panelTestId = "picker",
  disabled,
  triggerText,
  hideIconInTrigger,
  triggerIcon,
  className,
  emptyText = "No match",
}: {
  value: V | "" | undefined;
  onChange: (v: V) => void;
  options: PickerOption<V>[];
  /** Accessible name and sheet title. */
  label: string;
  placeholder?: string;
  /** Defaults to on for lists longer than 7. */
  searchable?: boolean;
  searchPlaceholder?: string;
  variant?: "field" | "chip";
  size?: "md" | "sm";
  id?: string;
  testId?: string;
  panelTestId?: string;
  disabled?: boolean;
  /** Override what the closed trigger shows. */
  triggerText?: string;
  hideIconInTrigger?: boolean;
  triggerIcon?: ReactNode;
  className?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const withSearch = searchable ?? options.length > 7;
  const current = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => `${o.label} ${o.description ?? ""} ${o.value} ${o.keywords ?? ""}`.toLowerCase().includes(needle));
  }, [options, q]);

  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const i = Math.max(0, filtered.findIndex((o) => o.value === value));
    setActive(i);
    const t = setTimeout(() => (withSearch ? searchRef.current : listRef.current)?.focus({ preventScroll: true }), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (o: PickerOption<V>) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(filtered.length - 1);
    } else if (e.key === "Enter" || (e.key === " " && !withSearch)) {
      e.preventDefault();
      const o = filtered[active];
      if (o) pick(o);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const listId = `${baseId}-list`;
  const optId = (i: number) => `${baseId}-opt-${i}`;
  const shown = triggerText ?? current?.label ?? placeholder;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label ?? placeholder}`}
        data-testid={testId}
        className={cn(variant === "field" ? TRIGGER_FIELD : TRIGGER_CHIP, variant === "field" && size === "sm" && "h-10 text-[14px]", className)}
      >
        {triggerIcon ?? (!hideIconInTrigger && current?.icon && <span className="flex flex-shrink-0 items-center">{current.icon}</span>)}
        <span className={cn("min-w-0 truncate", variant === "field" && "flex-1", variant === "field" && !current && "text-ink-3")}>{shown}</span>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-ink-3 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>
      <PickerSurface open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} title={label} testId={panelTestId}>
        {withSearch && (
          <div className="flex-shrink-0 px-3 pb-2 pt-3">
            <label className="relative block">
              <span className="sr-only">Search {label.toLowerCase()}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onListKey}
                placeholder={searchPlaceholder}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={filtered[active] ? optId(active) : undefined}
                className="h-10 w-full rounded-xl bg-surface-subtle pl-9 pr-3 text-[14.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
          </div>
        )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={withSearch ? -1 : 0}
          onKeyDown={withSearch ? undefined : onListKey}
          aria-activedescendant={!withSearch && filtered[active] ? optId(active) : undefined}
          className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 focus:outline-none", !withSearch && "pt-2")}
        >
          {filtered.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={optId(i)}
                data-index={i}
                role="option"
                aria-selected={selected}
                aria-disabled={o.disabled || undefined}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(o)}
                className={cn(
                  "flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer",
                  i === active && "bg-surface-subtle",
                  selected && "bg-teal-50",
                  o.disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {o.icon && <span className="flex flex-shrink-0 items-center">{o.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-ink">{o.label}</span>
                  {o.description && <span className="block truncate text-[12.5px] text-ink-3">{o.description}</span>}
                </span>
                <Check className={cn("h-4 w-4 flex-shrink-0 text-accent-primary transition-opacity", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
              </li>
            );
          })}
          {filtered.length === 0 && <li className="px-3 py-6 text-center text-[13.5px] text-ink-3">{emptyText}</li>}
        </ul>
      </PickerSurface>
    </>
  );
}

/* ── Icons for common rows ────────────────────────────────────────── */

export function Monogram({ text, className }: { text: string; className?: string }) {
  const initials = text
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden="true" className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-[12px] font-semibold text-accent-primary", className)}>
      {initials || "?"}
    </span>
  );
}

const CHAIN_LOGOS: Record<string, string> = {
  BASE: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/base/info/logo.png",
  POLYGON: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/polygon/info/logo.png",
  ETHEREUM: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/info/logo.png",
  CELO: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/celo/info/logo.png",
  ARBITRUM: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/arbitrum/info/logo.png",
  BSC: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/smartchain/info/logo.png",
};

export function ChainLogo({ chain, className }: { chain: string; className?: string }) {
  const src = CHAIN_LOGOS[chain.toUpperCase()];
  if (!src) return <Monogram text={chain} className={cn("h-6 w-6 text-[10px]", className)} />;
  return <img src={src} alt="" aria-hidden="true" className={cn("h-6 w-6 flex-shrink-0 rounded-full bg-surface-subtle object-cover", className)} />;
}

/* ── Date picker ──────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DatePicker({
  value,
  onChange,
  min,
  max,
  label,
  id,
  testId,
}: {
  value: string;
  onChange: (ymd: string) => void;
  min?: string;
  max?: string;
  label: string;
  id?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const selected = value ? fromYmd(value) : new Date();
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [focus, setFocus] = useState(value || toYmd(new Date()));

  useEffect(() => {
    if (!open) return;
    const s = value ? fromYmd(value) : new Date();
    setMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    setFocus(value || toYmd(new Date()));
  }, [open]);
  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLElement>(`[data-day="${focus}"]`)?.focus({ preventScroll: true });
  }, [focus, open, month]);

  const allowed = (ymd: string) => (!min || ymd >= min) && (!max || ymd <= max);
  const first = (month.getDay() + 6) % 7; // Monday first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => toYmd(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const canPrev = !min || toYmd(new Date(month.getFullYear(), month.getMonth(), 0)) >= min;
  const canNext = !max || toYmd(new Date(month.getFullYear(), month.getMonth() + 1, 1)) <= max;

  const moveFocus = (deltaDays: number) => {
    const d = fromYmd(focus);
    d.setDate(d.getDate() + deltaDays);
    const next = toYmd(d);
    if (!allowed(next)) return;
    setFocus(next);
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const onGridKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (map[e.key] !== undefined) {
      e.preventDefault();
      moveFocus(map[e.key]);
    }
  };
  const choose = (ymd: string) => {
    if (!allowed(ymd)) return;
    onChange(ymd);
    setOpen(false);
  };
  const display = value ? fromYmd(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Pick a date";

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${display}`}
        data-testid={testId}
        className={TRIGGER_FIELD}
      >
        <CalendarDays className="h-4 w-4 flex-shrink-0 text-ink-3" aria-hidden="true" />
        <span className="flex-1 truncate">{display}</span>
      </button>
      <PickerSurface open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} title={label} testId="date-picker" minWidth={300}>
        <div className="px-4 pb-4 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month" className="rounded-full p-2 text-ink-2 transition-colors hover:bg-surface-subtle disabled:opacity-30 cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[14.5px] font-semibold text-ink" aria-live="polite">
              {monthLabel}
            </p>
            <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month" className="rounded-full p-2 text-ink-2 transition-colors hover:bg-surface-subtle disabled:opacity-30 cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div ref={gridRef} role="grid" aria-label={monthLabel} onKeyDown={onGridKey} className="grid grid-cols-7 gap-y-1 text-center">
            {WEEK.map((w) => (
              <span key={w} role="columnheader" className="pb-1 text-[11.5px] font-medium text-ink-3">
                {w}
              </span>
            ))}
            {cells.map((ymd, i) =>
              ymd ? (
                <button
                  key={ymd}
                  type="button"
                  role="gridcell"
                  data-day={ymd}
                  tabIndex={ymd === focus ? 0 : -1}
                  disabled={!allowed(ymd)}
                  aria-selected={ymd === value}
                  aria-label={fromYmd(ymd).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  onClick={() => choose(ymd)}
                  className={cn(
                    "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[14px] tabular-numeric transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 cursor-pointer",
                    ymd === value ? "bg-accent-solid font-semibold text-white" : "text-ink hover:bg-surface-subtle",
                    ymd === toYmd(new Date()) && ymd !== value && "font-semibold text-accent-primary",
                    "disabled:cursor-not-allowed disabled:text-ink-3/50 disabled:hover:bg-transparent"
                  )}
                >
                  {Number(ymd.slice(8))}
                </button>
              ) : (
                <span key={`e${i}`} />
              )
            )}
          </div>
        </div>
      </PickerSurface>
    </>
  );
}
