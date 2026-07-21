import * as React from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { Icon } from "./icon"
import { INPUT_BASE } from "./input"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  size?: "sm"
  autoFocus?: boolean
  className?: string
}

export function SearchInput({ value, onChange, placeholder, size, autoFocus, className }: SearchInputProps) {
  const t = useTranslations("common.primitives")
  const resolvedPlaceholder = placeholder ?? t("searchPlaceholder")
  const sm = size === "sm"
  return (
    <div className={cn("relative", className)}>
      <Icon
        name="search"
        size={sm ? 15 : 17}
        className={cn("absolute top-1/2 -translate-y-1/2 text-txt-dim pointer-events-none", sm ? "left-[11px]" : "left-[13px]")}
      />
      <input
        className={cn(INPUT_BASE, sm ? "h-[38px] pl-9 text-[13px]" : "pl-10")}
        placeholder={resolvedPlaceholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          aria-label={t("clearSearch")}
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 text-txt-dim cursor-pointer hover:text-txt transition-colors"
        >
          <Icon name="x" size={14} />
        </button>
      ) : null}
    </div>
  )
}
