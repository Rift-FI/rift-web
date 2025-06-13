import { ReactNode } from "react";
import { Controller, ControllerRenderProps, useForm } from "react-hook-form";
import { GoHomeFill, GoHome } from "react-icons/go";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { MdOutlineExplore, MdExplore } from "react-icons/md";



import z from "zod"
import { PRODUCT_PIPELINES } from "@/v2/controls";
import { useShellContext } from "../shell-context";
import { ArrowRightLeft } from "lucide-react";

interface Tab {
  name: string,
  render: (field: ControllerRenderProps<TSchema, "tab">, active: boolean) => ReactNode,
  pipeline?: PRODUCT_PIPELINES
}

const tabs: Array<Tab> = [
  {
    name: "home",
    render(field, active) {

      return (
        <div
          onClick={() => {
            field.onChange("home")
          }}
          className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95" >
          {
            active ? <GoHomeFill className="text-3xl text-accent-primary" /> : <GoHome className="text-3xl text-accent-foreground/50" />
          }

        </div>
      )
    },
  },
  {
    name: "swap",
    render(field, active) {

      return (
        <div
          onClick={() => {
            field.onChange("swap")
          }}
          className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95" >
          {
            active ? <ArrowRightLeft className="text-3xl text-accent-primary" /> : <ArrowRightLeft className="text-3xl text-accent-foreground/50" />
          }

        </div>
      )
    },
  },
  // {
  //     name: "oo",
  //     pipeline: `PIPELINE-1`,
  //     render(field, active) {
  //         return (
  //             <div 
  //             onClick={()=>{
  //                 field.onChange("oo")
  //             }} 
  //             className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95" >
  //                 {
  //                     active ? <FaMoneyBillTransfer className="text-3xl text-accent-primary" /> : <FaMoneyBillTransfer className="text-3xl text-accent-foreground/50"  />
  //                 }

  //             </div>
  //         )
  //     },
  // },
  {
    name: "history",
    render(field, active) {
      return (
        <div
          onClick={() => {
            field.onChange("history")
          }}
          className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95" >
          {
            active ? <IoTime className="text-3xl text-accent-primary" /> : <IoTimeOutline className="text-3xl text-accent-foreground/50" />
          }

        </div>
      )
    },
  },
  // {
  //     name: "explore",
  //     render(field, active) {
  //         return (
  //             <div 
  //             onClick={()=>{
  //                 field.onChange("explore")
  //             }} 
  //             className="flex flex-row items-center justify-center pt-3 cursor-pointer active:scale-95" >
  //                 {
  //                     active ? <MdExplore className="text-3xl text-accent-primary" /> : <MdOutlineExplore className="text-3xl text-accent-foreground/50"  />
  //                 }

  //             </div>
  //         )
  //     },
  // }
]

const tabSchema = z.object({
  tab: z.enum(["home", "oo", "history", "explore", "swap"]).default("home").optional()
})

type TSchema = z.infer<typeof tabSchema>

export default function BottomTabs() {
  const { form } = useShellContext()

  if (!form) {
    return (
      <div></div>
    )
  }

  return (
    <Controller
      control={form.control}
      name="tab"
      render={({ field }) => {
        return (
          <div className="w-full flex flex-row items-center justify-center pb-3 gap-x-8" >
            {
              tabs.map((tab) => {
                return tab.render(field, field.value == tab.name)
              })
            }
          </div>
        )
      }}
    />
  )
}