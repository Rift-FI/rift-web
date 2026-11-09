import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ReactNode } from "react";
import RiftLoader from "@/components/ui/rift-loader";

const actionButtonVariants = cva(
  "flex flex-row items-center justify-center gap-2 h-11 px-5 rounded-md cursor-pointer font-sans font-semibold text-[15px] text-white transition-[background-color,border-color,color,transform] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary hover:bg-accent-secondary active:bg-accent-secondary",
        secondary:
          "bg-accent-secondary hover:bg-accent-secondary/90",
        danger: "bg-danger hover:bg-danger/90",
        success: "bg-success hover:bg-success/90",
        disabled: "bg-surface !text-text-muted",
        ghost:
          "bg-white border border-border !text-text-default hover:bg-surface-subtle",
      },
      size: {
        default: "w-full",
        small: "px-3 h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface Props {
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function ActionButton({
  variant,
  className,
  children,
  loading,
  disabled,
  ...props
}: Props &
  React.ComponentProps<"button"> &
  VariantProps<typeof actionButtonVariants>) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        actionButtonVariants({
          variant: disabled && variant !== "danger" ? "disabled" : variant,
          className,
        }),
        loading && "opacity-95"
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <RiftLoader size="sm" message="" />
          <span className="opacity-70">{children}</span>
        </div>
      ) : (
        <>
          <div />
          {children}
        </>
      )}
    </button>
  );
}
