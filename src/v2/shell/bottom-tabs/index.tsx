import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { motion } from "motion/react";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoSettingsOutline, IoSettings } from "react-icons/io5";
import { useShellContext } from "../shell-context";
import { cn } from "@/lib/utils";

type TSchema = {
  tab?: "home" | "profile";
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
    label: "Home",
    iconActive: <GoHomeFill className="w-5 h-5" />,
    iconInactive: <GoHome className="w-5 h-5" />,
  },
  {
    name: "profile",
    label: "Settings",
    iconActive: <IoSettings className="w-5 h-5" />,
    iconInactive: <IoSettingsOutline className="w-5 h-5" />,
  },
];

export default function BottomTabs() {
  const { form } = useShellContext();

  if (!form) {
    return <div></div>;
  }

  return (
    <div className="w-full bg-surface/80 backdrop-blur-xl border-t border-black/[0.04] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <Controller
        control={form.control}
        name="tab"
        render={({ field }) => {
          return (
            <div className="w-full max-w-[240px] mx-auto px-4 pt-2 pb-1 flex flex-row items-center justify-center gap-2">
              {TABS.map((tab) => {
                const active = field.value === tab.name;
                return (
                  <button
                    key={tab.name}
                    id={`tab-${tab.name === "profile" ? "settings" : tab.name}`}
                    onClick={() => field.onChange(tab.name)}
                    className={cn(
                      "relative flex items-center justify-center gap-2 cursor-pointer px-5 py-2.5 rounded-2xl transition-colors duration-150 active:scale-95",
                      active ? "text-accent-primary" : "text-text-subtle/60 hover:text-text-subtle"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="tab-pill"
                        className="absolute inset-0 bg-accent-primary/10 rounded-2xl"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {active ? tab.iconActive : tab.iconInactive}
                      <span className={cn(
                        "text-xs font-semibold",
                        active ? "text-accent-primary" : "text-text-subtle/60"
                      )}>
                        {tab.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        }}
      />
    </div>
  );
}
