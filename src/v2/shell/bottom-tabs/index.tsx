import { ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import z from "zod";
import { GoHomeFill, GoHome } from "react-icons/go";
import { usePlatformDetection } from "@/utils/platform";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { ArrowRightLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useShellContext } from "../shell-context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import usericon from "@/assets/user.png";
import { cn } from "@/lib/utils";

const tabSchema = z.object({
  tab: z
    .enum(["home", "swap", "history", "profile"])
    .default("home")
    .optional(),
});

type TSchema = z.infer<typeof tabSchema>;

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
      name: "profile",
      render(field, active) {
        return (
          <div
            onClick={() => {
              field.onChange("profile");
            }}
            className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
          >
            <Avatar className="p-[0.125rem] border-1 border-accent-primary">
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
          <div className="w-full flex flex-row items-center justify-center pb-3 gap-x-8">
            {tabs.map((tab) => {
              return tab.render(field, field.value == tab.name);
            })}
          </div>
        );
      }}
    />
  );
}
