import * as React from "react"
import { cn } from "../cn"
import { useT } from "../i18n"
import { Icon } from "./icon"
import { INPUT_BASE } from "./input"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Fired on Enter. A search that only runs a *local* filter needs nothing
   *  here; one that hits the network (a gallery lookup, a catalogue query) does,
   *  and every such call site used to hand-roll its own `<input>` purely to get
   *  this one handler back. */
  onSubmit?: () => void
  /** Fired on Escape when the field is non-empty; the field also clears itself. */
  onCancel?: () => void
  /** `sm` 38px · `md` 45px (default) · `lg` 50px, the hero search on a landing.
   *  One ladder for every search field in the product — the three hand-rolled
   *  copies this replaces sat at 38, 42 and 50px with three different type sizes. */
  size?: "sm" | "md" | "lg"
  /** Defaults to the placeholder; set it when the placeholder is decorative. */
  ariaLabel?: string
  autoFocus?: boolean
  className?: string
}

export function SearchInput({ value, onChange, placeholder, onSubmit, onCancel, size = "md", ariaLabel, autoFocus, className }: SearchInputProps) {
  const t = useT()
  const resolvedPlaceholder = placeholder ?? t("searchPlaceholder")
  const sm = size === "sm"
  const lg = size === "lg"
  return (
    <div className={cn("relative", className)}>
      <Icon
        name="search"
        size={sm ? 15 : lg ? 18 : 17}
        className={cn("absolute top-1/2 -translate-y-1/2 text-txt-dim pointer-events-none", sm ? "left-[0.6875rem]" : lg ? "left-4" : "left-[0.8125rem]")}
      />
      <input
        className={cn(INPUT_BASE, sm ? "h-[2.375rem] pl-9 text-[0.8125rem]" : lg ? "h-[3.125rem] pl-[2.875rem] text-[1rem]" : "pl-10")}
        aria-label={ariaLabel ?? resolvedPlaceholder}
        placeholder={resolvedPlaceholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) {
            e.preventDefault()
            onSubmit()
          } else if (e.key === "Escape" && value) {
            e.preventDefault()
            onChange("")
            onCancel?.()
          }
        }}
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
