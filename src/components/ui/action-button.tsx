import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ReactNode } from "react";
import { CgSpinner } from "react-icons/cg";

const actionButtonVariants = cva(
  "flex flex-row items-center justify-center gap-[0.5rem] p-[0.5rem] rounded-[0.75rem] cursor-pointer font-quicksand font-medium text-sm",
  {
    variants: {
      variant: {
        default: "bg-accent-primary",
        secondary: "bg-accent-secondary",
        danger: "bg-danger",
        success: "bg-success",
        disabled: "bg-muted",
        ghost: "bg-transparent border border-accent-secondary",
      },
      size: {
        default: "w-full px-5",
        small: "px-2",
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
      <div />
      {children} {loading && <CgSpinner className="animate-spin text-white" />}
    </button>
  );
}
