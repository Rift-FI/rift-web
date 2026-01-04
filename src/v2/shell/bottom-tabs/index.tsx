import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoSettingsOutline, IoSettings, IoSparklesOutline, IoSparkles } from "react-icons/io5";
import { usePlatformDetection } from "@/utils/platform";
import { useShellContext } from "../shell-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TSchema = {
  tab?: "home" | "invest" | "profile";
};

interface Tab {
  name: string;
  render: (
    field: ControllerRenderProps<TSchema, "tab">,
    active: boolean
  ) => ReactNode;
}

export default function BottomTabs() {
  const { form } = useShellContext();
  const { isTelegram, telegramUser } = usePlatformDetection();

  const tabs: Array<Tab> = [
    {
      name: "home",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("home");
            }}
            className="flex flex-col items-center justify-center cursor-pointer active:scale-95 px-2 gap-1"
          >
            {active ? (
              <GoHomeFill className="text-[1.5rem] text-accent-primary" />
            ) : (
              <GoHome className="text-[1.5rem] text-gray-600 dark:text-gray-400" />
            )}
            <span className={cn("text-[10px]", active ? "text-accent-primary" : "text-gray-600 dark:text-gray-400")}>
              Home
            </span>
          </div>
        );
      },
    },
    {
      name: "invest",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("invest");
            }}
            className="flex flex-col items-center justify-center cursor-pointer active:scale-95 px-2 gap-1"
          >
            {active ? (
              <IoSparkles className="text-[1.5rem] text-accent-primary" />
            ) : (
              <IoSparklesOutline className="text-[1.5rem] text-gray-600 dark:text-gray-400" />
            )}
            <span className={cn("text-[10px]", active ? "text-accent-primary" : "text-gray-600 dark:text-gray-400")}>
              Earn
            </span>
          </div>
        );
      },
    },
    {
      name: "profile",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("profile");
            }}
            className="flex flex-col items-center justify-center cursor-pointer active:scale-95 px-2 gap-1"
          >
            {active ? (
              <IoSettings className="text-[1.5rem] text-accent-primary" />
            ) : (
              <IoSettingsOutline className="text-[1.5rem] text-gray-600 dark:text-gray-400" />
            )}
            <span className={cn("text-[10px]", active ? "text-accent-primary" : "text-gray-600 dark:text-gray-400")}>
              Settings
            </span>
          </div>
        );
      },
    },
  ];

  if (!form) {
    return <div></div>;
  }

  return (
    <div className="w-full h-16 fixed bottom-0 left-0 right-0 bg-app-background border-t-1 border-border md:left-[calc((100vw-28rem)/2)] md:right-[calc((100vw-28rem)/2)]">
      <Controller
        control={form.control}
        name="tab"
        render={({ field }) => {
          return (
            <div className="w-full h-full px-6 flex flex-row items-center justify-between">
              {tabs.map((tab, idx) => {
                return (
                  <Fragment key={tab.name + idx}>
                    {tab.render(field, field.value == tab.name)}
                  </Fragment>
                );
              })}
            </div>
          );
        }}
      />
    </div>
  );
}
