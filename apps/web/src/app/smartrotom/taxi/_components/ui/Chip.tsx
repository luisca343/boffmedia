import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A destination shortcut — a favourite or a recent. Selected turns amber because
 * selecting one is the same act as tapping its pin on the map.
 */
export function Chip({
  active,
  className,
  children,
  ...props
}: { active?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-tx-pill px-3 py-2",
        "text-[13px] font-bold transition-all duration-150",
        "border border-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        active
          ? "bg-tx-accent text-tx-on-accent border-white [&_svg]:text-tx-on-accent"
          : "bg-tx-surface text-tx-txt border-tx-line hover:bg-tx-surface-2 hover:border-tx-line-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * A region filter. Blue, not amber: filtering is structure, not spend — the same reason
 * pins and routes are blue.
 */
export function FilterChip({
  active,
  count,
  className,
  children,
  ...props
}: { active?: boolean; count?: number; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-tx-pill px-[13px] py-[7px]",
        "text-[12.5px] font-bold transition-all duration-150",
        "border border-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        active
          ? "bg-tx-blue-600 border-tx-blue-500 text-white"
          : "bg-tx-surface border-tx-line text-tx-txt-2 hover:border-tx-line-2 hover:text-tx-txt",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && <span className="font-tx-mono text-[11px] opacity-75">{count}</span>}
    </button>
  )
}

/** The top bar's status pills: online count, balance, happy hour. */
export function Pill({
  as = "span",
  tone = "neutral",
  className,
  children,
  ...props
}: {
  as?: "span" | "button"
  tone?: "neutral" | "money"
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const Tag = as
  return (
    <Tag
      {...(as === "button" ? { type: "button" as const } : {})}
      className={cn(
        "flex items-center gap-[7px] whitespace-nowrap rounded-tx-pill px-3 py-2 text-[13px] font-bold",
        "border border-solid transition-[background,border-color,transform] duration-150 ease-tx",
        tone === "money"
          ? "bg-tx-accent-soft border-tx-accent-soft text-tx-money [&_svg]:text-tx-accent"
          : "bg-tx-surface border-tx-line text-tx-txt-2",
        as === "button" &&
          "hover:bg-tx-surface-2 hover:border-tx-line-2 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

/** The blue zone badge on a stop row — a real WorldGuard region name. */
export function RegionTag({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-md bg-tx-blue-500/[0.16] px-[7px] py-0.5 text-[10px] font-extrabold uppercase tracking-[0.4px] text-tx-blue-400">
      {children}
    </span>
  )
}
