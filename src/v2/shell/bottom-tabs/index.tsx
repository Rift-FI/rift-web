import { ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { usePlatformDetection } from "@/utils/platform";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { ArrowRightLeft } from "lucide-react";
import useAnalaytics from "@/hooks/use-analytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useShellContext } from "../shell-context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { cn } from "@/lib/utils";
import usericon from "@/assets/user.png";

type TSchema = {
  tab?: "home" | "swap" | "history" | "profile";
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
  const { logEvent } = useAnalaytics();

  const tabs: Array<Tab> = [
    {
      name: "home",
      render(field, active) {
        return (
          <div
            onClick={() => {
              logEvent("PAGE_VISIT_HOME");
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
              logEvent("PAGE_VISIT_SWAP");
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
    {
      name: "history",
      render(field, active) {
        return (
          <div
            onClick={() => {
              logEvent("PAGE_VISIT_ACTIVITY");
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
      name: "profile",
      render(field, active) {
        return (
          <div
            onClick={() => {
              logEvent("PAGE_VISIT_PROFILE");
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
    <Controller
      control={form.control}
      name="tab"
      render={({ field }) => {
        return (
          <div
            key={field.name}
            className="w-full flex flex-row items-center justify-center pb-3 gap-x-8"
          >
            {tabs.map((tab) => {
              return tab.render(field, field.value == tab.name);
            })}
          </div>
        );
      }}
    />
  );
}
