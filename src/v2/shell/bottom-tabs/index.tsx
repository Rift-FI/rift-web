import { Fragment, ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { TbHexagonLetterA } from "react-icons/tb";
import { MdOutlineExplore } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import { ArrowRightLeft } from "lucide-react";
import { usePlatformDetection } from "@/utils/platform";
import { useShellContext } from "../shell-context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import usericon from "@/assets/user.png";

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
            {active ? (
              <ArrowRightLeft className="text-3xl text-accent-primary" />
            ) : (
              <ArrowRightLeft className="text-3xl text-accent-foreground/50" />
            )}
          </div>
        );
      },
    },
    // {
    //   name: "agent",
    //   render(field, active) {
    //     return (
    //       <div
    //         onClick={() => {
    //           field.onChange("agent");
    //         }}
    //         className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
    //       >
    //         {active ? (
    //           <TbHexagonLetterA className="text-3xl text-accent-primary" />
    //         ) : (
    //           <TbHexagonLetterA className="text-3xl text-accent-foreground/50" />
    //         )}
    //       </div>
    //     );
    //   },
    // },
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
    // {
    //   name: "explore",
    //   render(field, active) {
    //     return (
    //       <div
    //         onClick={() => {
    //           field.onChange("history");
    //         }}
    //         className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
    //       >
    //         {active ? (
    //           <CiSearch className="text-3xl text-accent-primary" />
    //         ) : (
    //           <CiSearch className="text-3xl text-accent-foreground/50" />
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
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            <Avatar
              className={cn(
                "p-[0.125rem] border-1",
                active ? "border-accent-primary" : "border-transparent"
              )}
            >
              <AvatarImage
                className="rounded-full"
                src={isTelegram ? telegramUser?.photoUrl : usericon}
                alt={
                  isTelegram
                    ? telegramUser?.username
                    : userQuery?.data?.externalId ?? userQuery?.data?.email
                }
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        );
      },
    },
  ];

  if (!form) {
    return <div></div>;
  }

  return (
    <div className="flex flex-row items-center justify-center px-5 bg-app-background border-t-1 border-border backdrop-blur-1xl w-full shadow-2xl shadow-surface-subtle fixed bottom-0 pb-4">
      <Controller
        control={form.control}
        name="tab"
        render={({ field }) => {
          return (
            <div className="w-full flex flex-row items-center justify-center gap-x-8">
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
