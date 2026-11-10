/**
 * Console UI primitives.
 *
 * Small, token-driven building blocks for the payments console. Every
 * colour comes from a theme token (see styles/tailwind.css) so light and
 * dark mode stay in lock-step; borders carry structure, shadows only hint.
 */
import {
  ButtonHTMLAttributes,
  ReactNode,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Check, ChevronLeft, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, type AppStatus, type StatusTone } from "@/v2/lib/status";

/* ── Money ─────────────────────────────────────────────────────────── */

const SYMBOLS: Record<string, string> = {
  USD: "$",
  KES: "KSh",
  NGN: "₦",
  UGX: "USh",
  TZS: "TSh",
  CDF: "FC",
  MWK: "MK",
  BRL: "R$",
  ETB: "Br",
  GHS: "₵",
};

/** "$1,234.50", "KSh 12,000.00", "25.00 USDC". */
export function formatMoney(amount: number | string | null | undefined, currency = "USD", opts: { signed?: boolean } = {}) {
  const n = Number(amount ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const abs = Math.abs(safe).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = opts.signed ? (safe < 0 ? "−" : "+") : safe < 0 ? "−" : "";
  const code = (currency || "USD").toUpperCase();
  if (code === "USD") return `${sign}$${abs}`;
  if (SYMBOLS[code]) return `${sign}${SYMBOLS[code]} ${abs}`;
  return `${sign}${abs} ${code}`;
}

export function shortHash(value?: string | null, head = 6, tail = 4) {
  if (!value) return "";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/* ── Button ────────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none cursor-pointer transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-solid text-white hover:bg-accent-solid-hover",
  secondary: "bg-card text-ink border border-hairline-strong hover:bg-surface-subtle",
  ghost: "text-ink-2 hover:bg-surface-subtle hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90",
};
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-5 text-[15px]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; block?: boolean }
>(function Button({ variant = "primary", size = "md", block, className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], block && "w-full", className)}
      {...props}
    />
  );
});

/* ── Layout ────────────────────────────────────────────────────────── */

/** Content column used by every console page. */
export function Page({ children, width = "default", className }: { children: ReactNode; width?: "narrow" | "default" | "wide"; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-12 pt-5 sm:px-6 lg:px-10 lg:pb-20 lg:pt-8",
        width === "narrow" ? "max-w-[760px]" : width === "wide" ? "max-w-[1240px]" : "max-w-[1080px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: string | (() => void);
  eyebrow?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="min-w-0">
        {back && (
          <button
            type="button"
            onClick={() => (typeof back === "string" ? navigate(back) : back())}
            className="-ml-1.5 mb-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        )}
        {/* Titles stand alone: no eyebrows or explanatory sub-headings. */}
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink lg:text-[26px]">{title}</h1>
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className, as: Tag = "section", ...rest }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" } & Record<string, unknown>) {
  return (
    <Tag className={cn("rounded-lg border border-hairline bg-card", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, step }: { title: ReactNode; description?: ReactNode; action?: ReactNode; step?: number }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {step !== undefined && (
          <span
            aria-hidden="true"
            className="mt-px flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-hairline-strong text-[12px] font-semibold text-ink-2 tabular-numeric"
          >
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ── Status ────────────────────────────────────────────────────────── */

/** Visual tones (legacy names kept) plus the backend's app status vocabulary. */
export type Status = "succeeded" | "pending" | "failed" | "neutral" | AppStatus;

const TONE_STYLE: Record<StatusTone, string> = {
  success: "bg-tint-success text-success",
  progress: "bg-teal-50 text-accent-primary",
  waiting: "bg-tint-pending text-pending",
  danger: "bg-tint-danger text-danger",
  muted: "bg-tint-neutral text-ink-2",
};
const LEGACY: Record<string, { tone: StatusTone; label: string }> = {
  succeeded: { tone: "success", label: "Completed" },
  pending: { tone: "waiting", label: "Pending" },
  failed: { tone: "danger", label: "Failed" },
  neutral: { tone: "muted", label: "Draft" },
};

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const app = (STATUS_LABEL as Record<string, string>)[status] ? (status as AppStatus) : null;
  const tone = app ? STATUS_TONE[app] : LEGACY[status]?.tone ?? "muted";
  const text = label ?? (app ? STATUS_LABEL[app] : LEGACY[status]?.label ?? status);
  return (
    <span
      data-status={status}
      className={cn("inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[12px] font-semibold", TONE_STYLE[tone])}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full bg-current", tone === "progress" && "animate-pulse")} />
      {text}
    </span>
  );
}

/* ── Segmented control ─────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: { value: T; label: ReactNode; icon?: ReactNode; testId?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid w-full gap-1 rounded-md border border-hairline bg-surface-subtle p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={o.testId}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-2 rounded-[5px] px-2 font-semibold transition-colors duration-150 cursor-pointer",
              size === "sm" ? "h-8 text-[13px]" : "h-10 text-[13px] sm:text-[14px]",
              active ? "bg-card text-ink shadow-xs ring-1 ring-hairline-strong" : "text-ink-3 hover:text-ink"
            )}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Form field ────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12.5px] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const INPUT_CLASS =
  "block h-11 w-full rounded-md border border-hairline-strong bg-card px-3 text-[15px] text-ink placeholder:text-ink-3/70 transition-colors focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

/* ── Definition rows (receipts, drawers, reviews) ──────────────────── */

export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("divide-y divide-hairline", className)}>{children}</dl>;
}

export function Row({ label, children, strong }: { label: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5 text-[14px]">
      <dt className={cn("flex-shrink-0", strong ? "font-semibold text-ink" : "text-ink-3")}>{label}</dt>
      <dd className={cn("min-w-0 break-words text-right tabular-numeric", strong ? "font-semibold text-ink" : "text-ink")}>{children}</dd>
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard blocked */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ── Empty + loading ───────────────────────────────────────────────── */

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-surface-subtle text-ink-3">{icon}</div>}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-ink-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-subtle", className)} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-hairline">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/5" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/* ── Side sheet (right drawer on desktop, bottom sheet on mobile) ──── */

export function SideSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-[#0b1214]/40 animate-in fade-in duration-150" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        className={cn(
          "absolute flex flex-col bg-card text-ink outline-none shadow-modal",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl border-t border-hairline animate-in slide-in-from-bottom-4 duration-200",
          "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[460px] md:rounded-none md:border-l md:border-t-0 md:slide-in-from-right-4"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[16px] font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <div className="border-t border-hairline px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
