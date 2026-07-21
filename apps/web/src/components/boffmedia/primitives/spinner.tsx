import * as React from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number
}

export function Spinner({ size = 16, className, style, ...rest }: SpinnerProps) {
  const t = useTranslations("common.primitives")
  return (
    <span
      role="status"
      aria-label={t("loading")}
      style={{ width: size, height: size, ...style }}
      className={cn(
        "inline-block rounded-full border-2 border-current border-r-transparent opacity-90",
        "animate-[bm-spin_0.66s_linear_infinite] motion-reduce:animate-[bm-pulse_1.2s_ease-in-out_infinite]",
        className,
      )}
      {...rest}
    />
  )
}
