"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/**
 * The search field. Fills with the card colour at rest and switches to the canvas with
 * an accent border on focus — the field "lifts out" of the rail rather than glowing.
 *
 * Submitting navigates to /buscar rather than filtering in place, so a search is a URL
 * and can be linked, shared and gone back to.
 */
export interface SearchBarProps {
  defaultValue?: string
  /** Search-as-you-type on the /buscar screen itself; the rail's copy navigates. */
  onChange?: (value: string) => void
  autoFocus?: boolean
  className?: string
}

export function SearchBar({ defaultValue = "", onChange, autoFocus, className }: SearchBarProps) {
  const router = useRouter()
  const t = useTranslations("rooker")
  const [value, setValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)

  const set = (v: string) => {
    setValue(v)
    onChange?.(v)
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const q = value.trim()
        if (!onChange && q) router.push(`/smartrotom/rooker/buscar?q=${encodeURIComponent(q)}`)
      }}
      className={cn(
        "flex h-[42px] items-center gap-2.5 rounded-rk-pill border px-3.5 transition-colors",
        focused ? "border-rk-accent bg-rk-bg" : "border-transparent bg-rk-card",
        className,
      )}
    >
      <Icon
        name="search"
        size={18}
        className={focused ? "flex-none text-rk-accent" : "flex-none text-rk-fg-subtle"}
      />
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        aria-label={t("searchBar.ariaLabel")}
        placeholder={t("searchBar.placeholder")}
        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-rk-fg outline-none placeholder:text-rk-fg-subtle"
      />
      {value && (
        <button
          type="button"
          onClick={() => set("")}
          aria-label={t("searchBar.clearAriaLabel")}
          className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-rk-line-strong text-rk-fg"
        >
          <Icon name="close" size={11} />
        </button>
      )}
    </form>
  )
}
