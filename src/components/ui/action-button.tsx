import { cn } from "@/lib/utils"
import { cva, VariantProps } from "class-variance-authority"
import React, { ReactNode } from "react"
import { CgSpinner } from "react-icons/cg"

const actionButtonVariants = cva(
    "flex flex-row items-center justify-between py-2  rounded-full cursor-pointer  active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-accent-primary",
                secondary: "bg-accent-secondary",
                danger: "bg-danger",
                success: "bg-success",
                disabled: "bg-muted",
                ghost: "bg-transparent border border-accent-secondary"
            },
            size: {
                default: "w-full px-5",
                small: "px-2"
            }
        },  
        defaultVariants: {
            variant: "default",
            size: "default"
        }
    },
)

interface Props {
    loading?: boolean
    className?: string,
    children?: ReactNode
}


export default function ActionButton({
    variant,
    className,
    children,
    loading,
    disabled,
    ...props
}: Props & React.ComponentProps<"button"> & VariantProps<typeof actionButtonVariants>) {
    return (
        <button disabled={disabled || loading} className={cn(actionButtonVariants({
            variant: disabled ? "disabled" :variant, className
        }), loading ? "opacity-95" : "", "font-semibold")} {...props} >
            <div/>
            {children}
            <div>
                {
                    loading && <CgSpinner
                        className="animate-spin text-white"
                    />
                }
            </div>
        </button>
    )
}