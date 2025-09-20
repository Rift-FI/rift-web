import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoSettingsOutline, IoSettings } from "react-icons/io5";
import { usePlatformDetection } from "@/utils/platform";
import { useShellContext } from "../shell-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TSchema = {
  tab?: "home" | "profile";
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
            className="flex flex-row items-center justify-center cursor-pointer active:scale-95 px-2"
          >
            {active ? (
              <GoHomeFill className="text-[1.75rem] text-accent-primary" />
            ) : (
              <GoHome className="text-[1.75rem] text-gray-600 dark:text-gray-400" />
            )}
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
            className="flex flex-row items-center justify-center cursor-pointer active:scale-95 px-2"
          >
            {active ? (
              <IoSettings className="text-[1.75rem] text-accent-primary" />
            ) : (
              <IoSettingsOutline className="text-[1.75rem] text-gray-600 dark:text-gray-400" />
            )}
          </div>
        );
      },
    },
  ];

  if (!form) {
    return <div></div>;
  }

  return (
    <div className="w-full h-16 fixed bottom-0 bg-app-background border-t-1 border-border">
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
