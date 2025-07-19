import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { ReactNode } from "react";

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  title: string;
  className?: string;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ icon, title, className = "", onClick, ...rest }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        className,
        "w-1/4 flex flex-col items-center justify-center bg-secondary p-4 rounded-2xl cursor-pointer hover:bg-surface-subtle transition-colors"
      )}
      {...rest}
    >
      <span className="text-text-subtle">{icon}</span>
      <p className="text-sm font-medium text-text-subtle">{title}</p>
    </button>
  )
);

ActionButton.displayName = "ActionButton";

export default ActionButton;
