import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-text-muted/80 selection:bg-accent-primary/20 selection:text-text-default",
          "flex h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 py-2 text-[15px] text-text-default tabular-nums transition-[border-color,box-shadow] duration-150 outline-none",
          "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-text-default/25",
          "focus-visible:border-accent-primary focus-visible:ring-3 focus-visible:ring-accent-primary/15",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
export { Input };
