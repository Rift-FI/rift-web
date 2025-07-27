import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { RiSearch2Line, RiSearch2Fill } from "react-icons/ri";
import { HiOutlineUser, HiMiniUser } from "react-icons/hi2";
import {
  MdOutlineSwapHorizontalCircle,
  MdSwapHorizontalCircle,
} from "react-icons/md";
import { usePlatformDetection } from "@/utils/platform";
import { useShellContext } from "../shell-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TSchema = {
  tab?: "home" | "swap" | "history" | "profile" | "explore";
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
              <GoHome className="text-[1.75rem] text-accent-foreground/50" />
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
            className="flex flex-row items-center justify-center cursor-pointer active:scale-95 px-2"
          >
            {active ? (
              <MdSwapHorizontalCircle className="text-[1.75rem] text-accent-primary" />
            ) : (
              <MdOutlineSwapHorizontalCircle className="text-[1.75rem] text-accent-foreground/50" />
            )}
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
            className="flex flex-row items-center justify-center cursor-pointer active:scale-95 px-2"
          >
            {active ? (
              <IoTime className="text-[1.75rem] text-accent-primary" />
            ) : (
              <IoTimeOutline className="text-[1.75rem] text-accent-foreground/50" />
            )}
          </div>
        );
      },
    },
    // {
    //   name: "explore",
    //   render(field, active) {
    //     return (
    //       <div
    //         onClick={() => {
    //           field.onChange("explore");
    //         }}
    //         className="h-full flex flex-row items-center justify-center cursor-pointer active:scale-95 px-2"
    //       >
    //         {active ? (
    //           <RiSearch2Fill className="text-[1.75rem] text-accent-primary" />
    //         ) : (
    //           <RiSearch2Line className="text-[1.75rem] text-accent-foreground/50" />
    //         )}
    //       </div>
    //     );
    //   },
    // },
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
            ) : active ? (
              <HiMiniUser className="text-[1.75rem] text-accent-primary" />
            ) : (
              <HiOutlineUser className="text-[1.75rem] text-accent-foreground/50" />
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
            <div className="w-full h-full px-6 flex flex-row items-center justify-center gap-12">
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
