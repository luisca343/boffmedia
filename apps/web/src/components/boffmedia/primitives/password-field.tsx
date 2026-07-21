"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { Input, type InputProps } from "./input"
import { Icon } from "./icon"

export interface PasswordFieldProps extends Omit<InputProps, "type"> {
  /** aria-labels for the reveal toggle in the two states. */
  showLabel?: string
  hideLabel?: string
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { className, showLabel, hideLabel, ...props },
  ref,
) {
  const t = useTranslations("common.primitives")
  const resolvedShowLabel = showLabel ?? t("show")
  const resolvedHideLabel = hideLabel ?? t("hide")
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={show ? "text" : "password"} className={cn("pr-[42px]", className)} {...props} />
      <button
        type="button"
        aria-pressed={show}
        aria-label={show ? resolvedHideLabel : resolvedShowLabel}
        onClick={() => setShow((v) => !v)}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-[26px] h-[26px]",
          "text-txt-dim hover:text-accent aria-pressed:text-accent transition-colors",
        )}
      >
        <Icon name="eye" size={16} />
      </button>
    </div>
  )
})
