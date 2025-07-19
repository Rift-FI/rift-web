import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { AiOutlineUser } from "react-icons/ai";
import { PiDeviceRotate } from "react-icons/pi";
import { usePlatformDetection } from "@/utils/platform";
import { useShellContext } from "../shell-context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TSchema = {
  tab?: "home" | "swap" | "history" | "profile" | "agent";
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
  const { userQuery } = useWalletAuth();

  const tabs: Array<Tab> = [
    {
      name: "home",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("home");
            }}
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            {active ? (
              <GoHomeFill className="text-3xl text-accent-primary" />
            ) : (
              <GoHome className="text-3xl text-accent-foreground/50" />
            )}
          </div>
        );
      },
    },
    {
      name: "swap",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("swap");
            }}
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            <PiDeviceRotate
              className={cn(
                "text-3xl text-accent-foreground/50",
                active && "text-accent-primary"
              )}
            />
          </div>
        );
      },
    },
    {
      name: "history",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("history");
            }}
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            {active ? (
              <IoTime className="text-3xl text-accent-primary" />
            ) : (
              <IoTimeOutline className="text-3xl text-accent-foreground/50" />
            )}
          </div>
        );
      },
    },
    {
      name: "explore",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("history");
            }}
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            <CiSearch
              className={cn(
                "text-3xl text-accent-foreground/50",
                active && "text-accent-primary"
              )}
            />
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
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            {isTelegram ? (
              <Avatar
                className={cn(
                  "p-[0.125rem] border-1 border-transparent",
                  active && "border-accent-primary"
                )}
              >
                <AvatarImage
                  className="rounded-full"
                  src={telegramUser?.photoUrl}
                  alt={telegramUser?.username}
                />
                <AvatarFallback>{telegramUser?.username}</AvatarFallback>
              </Avatar>
            ) : (
              <AiOutlineUser
                className={cn(
                  "text-3xl text-accent-foreground/50",
                  active && "text-accent-primary"
                )}
              />
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
    <div className="w-full fixed bottom-0 pb-4 px-6 bg-app-background border-t-1 border-border">
      <Controller
        control={form.control}
        name="tab"
        render={({ field }) => {
          return (
            <div className="w-full flex flex-row items-center justify-between gap-x-8">
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
