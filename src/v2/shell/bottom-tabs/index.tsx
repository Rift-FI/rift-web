import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { LayoutGrid, QrCode, Settings } from "lucide-react";
import { useShellContext } from "../shell-context";
import { cn } from "@/lib/utils";

type TSchema = {
  tab?: "home" | "profile" | "merchant";
};

interface Tab {
  name: string;
  label: string;
  iconActive: ReactNode;
  iconInactive: ReactNode;
}

const TABS: Tab[] = [
  {
    name: "home",
    label: "Overview",
    iconActive: <LayoutGrid className="w-5 h-5" strokeWidth={2} aria-hidden="true" />,
    iconInactive: <LayoutGrid className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    name: "merchant",
    label: "Collections",
    iconActive: <QrCode className="w-5 h-5" strokeWidth={2} aria-hidden="true" />,
    iconInactive: <QrCode className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    name: "profile",
    label: "Settings",
    iconActive: <Settings className="w-5 h-5" strokeWidth={2} aria-hidden="true" />,
    iconInactive: <Settings className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />,
  },
];

export default function BottomTabs() {
  const { form } = useShellContext();

  if (!form) {
    return <div></div>;
  }

  return (
    <nav
      aria-label="Primary"
      className="w-full bg-white border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <Controller
        control={form.control}
        name="tab"
        render={({ field }) => {
          return (
            <div className="w-full grid grid-cols-3">
              {TABS.map((tab) => {
                const active = field.value === tab.name;
                return (
                  <button
                    key={tab.name}
                    id={`tab-${tab.name === "profile" ? "settings" : tab.name}`}
                    onClick={() => field.onChange(tab.name)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 h-14 cursor-pointer transition-colors duration-150",
                      active ? "text-accent-primary" : "text-text-muted hover:text-text-default"
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full bg-accent-primary"
                      />
                    )}
                    {active ? tab.iconActive : tab.iconInactive}
                    <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        }}
      />
    </nav>
  );
}
