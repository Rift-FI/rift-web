import { ReactNode } from "react";

interface DesktopPageLayoutProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[90rem]",
  full: "max-w-full",
};

export default function DesktopPageLayout({
  children,
  maxWidth = "lg",
  className = "",
}: DesktopPageLayoutProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <div className={`mx-auto px-6 py-8 ${maxWidthClasses[maxWidth]}`}>
        {children}
      </div>
    </div>
  );
}
