import { ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./index";

export type SectionState = "done" | "active" | "upcoming";

/**
 * One numbered section of a checkout-style money flow. Completed sections
 * collapse to a one-line summary with an Edit button, the active section
 * shows its form, upcoming sections show only their title.
 */
export function FlowSection({
  step,
  title,
  description,
  state,
  summary,
  onEdit,
  children,
  testId,
}: {
  step: number;
  title: string;
  description?: ReactNode;
  state: SectionState;
  summary?: ReactNode;
  onEdit?: () => void;
  children?: ReactNode;
  testId?: string;
}) {
  return (
    <section
      aria-label={title}
      data-testid={testId}
      data-state={state}
      className={cn("rounded-lg border bg-card transition-colors", state === "active" ? "border-hairline-strong shadow-sm" : "border-hairline")}
    >
      <div className={cn("flex items-start justify-between gap-4 px-5 py-4", state === "active" && "border-b border-hairline")}>
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "mt-px flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-numeric",
              state === "done" && "bg-accent-solid text-white",
              state === "active" && "border border-accent-primary text-accent-primary",
              state === "upcoming" && "border border-hairline-strong text-ink-3"
            )}
          >
            {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : step}
          </span>
          <div className="min-w-0">
            <h2 className={cn("text-[15px] font-semibold", state === "upcoming" ? "text-ink-3" : "text-ink")}>{title}</h2>
            {state === "done" && summary ? (
              <div className="mt-0.5 truncate text-[13.5px] text-ink-2" data-testid={testId ? `${testId}-summary` : undefined}>
                {summary}
              </div>
            ) : state === "active" && description ? (
              <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>
            ) : null}
          </div>
        </div>
        {state === "done" && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Button>
        )}
      </div>
      {state === "active" && <div className="p-5">{children}</div>}
    </section>
  );
}

/** Footer row for a section: optional back link + primary continue button. */
export function SectionActions({
  onBack,
  backLabel = "Back",
  children,
}: {
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
    </div>
  );
}

/** Small selectable tile used for providers, countries, sources. */
export function OptionTile({
  selected,
  onClick,
  children,
  className,
  ...rest
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
} & Record<string, unknown>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors cursor-pointer",
        selected ? "border-accent-primary bg-teal-50 ring-1 ring-accent-primary/30" : "border-hairline bg-card hover:border-hairline-strong hover:bg-surface-subtle",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
