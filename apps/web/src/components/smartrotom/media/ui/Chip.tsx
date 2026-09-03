import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

const base =
  "whitespace-nowrap text-xs px-3 py-[0.3125rem] rounded-mw-pill border transition-all duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mw-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-mw-bg"

const off =
  "bg-mw-800 text-mw-fg-mute border-mw-line hover:border-mw-line-strong hover:bg-mw-700 hover:text-mw-fg"

// accent-tinted filter chip
const accentOn =
  "text-white bg-[color-mix(in_srgb,rgb(var(--mw-accent))_20%,rgb(var(--mw-800)))] " +
  "border-[color-mix(in_srgb,rgb(var(--mw-accent))_50%,transparent)]"

// neutral selected chip — white fill (discovery rail)
const solidOn = "bg-mw-fg text-mw-bg border-mw-fg font-semibold"

export function Chip({
  active,
  tone = "accent",
  className,
  children,
  ...rest
}: {
  active?: boolean
  /** how the active state reads: accent tint (filters) or white fill (rail) */
  tone?: "accent" | "solid"
  className?: string
  children: ReactNode
} & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      className={cn(base, active ? (tone === "solid" ? solidOn : accentOn) : off, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
