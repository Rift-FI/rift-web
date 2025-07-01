import { ReactNode } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import z from "zod";
import { GoHomeFill, GoHome } from "react-icons/go";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { FiLink2 } from "react-icons/fi";
import { ArrowRightLeft } from "lucide-react";
import { useShellContext } from "../shell-context";

const tabSchema = z.object({
  tab: z.enum(["home", "swap", "history", "links"]).default("home").optional(),
});

type TSchema = z.infer<typeof tabSchema>;

interface Tab {
  name: string;
  render: (
    field: ControllerRenderProps<TSchema, "tab">,
    active: boolean
  ) => ReactNode;
}

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
    name: "links",
    render(field, active) {
      return (
        <div
          onClick={() => {
            field.onChange("links");
          }}
          className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95"
        >
          {active ? (
            <FiLink2 className="text-3xl text-accent-primary" />
          ) : (
            <FiLink2 className="text-3xl text-accent-foreground/50" />
          )}
        </div>
      );
    },
  },
];

export default function BottomTabs() {
  const { form } = useShellContext();

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
