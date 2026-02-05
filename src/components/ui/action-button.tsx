import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ReactNode } from "react";
import RiftLoader from "@/components/ui/rift-loader";

const actionButtonVariants = cva(
  "flex flex-row items-center justify-center gap-[0.5rem] p-[0.5rem] rounded-2xl cursor-pointer font-quicksand font-medium text-sm",
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
