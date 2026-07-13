import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

/** The frosted panel — white at 90% over the pink page. The app's default container. */
export function Panel({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={cn("wp-glass rounded-wp", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </div>
  )
}

/**
 * The teal box. Reserved for the **valuation** and nothing else — it is the one
 * surface in the app that is not white or pink, which is exactly what makes
 * "SmartRotom estima ₽X" read as a second opinion rather than as the seller talking.
 */
export function ValueBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-wp border-wp border-wp-teal/[.32] p-4",
        "bg-[linear-gradient(150deg,#e4f7f4,#f0fbf9)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The heavy-bordered purchase panel — the one surface that must read as "act here". */
export function BuyPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-wp border-wp border-wp-line/46 bg-white p-[18px] shadow-wp",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** A rule with a centred uppercase label. The app's only section divider. */
export function DividerLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-wp text-[11px] font-black uppercase tracking-[.08em] text-wp-fg-subtle",
        "before:h-[1.5px] before:flex-1 before:rounded-wp-pill before:bg-wp-line/24 before:content-['']",
        "after:h-[1.5px] after:flex-1 after:rounded-wp-pill after:bg-wp-line/24 after:content-['']",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** A page heading. Fredoka, and Fredoka tops out at 600 — do not ask for bolder. */
export function PageHead({
  icon,
  title,
  sub,
  children,
}: {
  icon?: IconName
  title: string
  sub?: ReactNode
  /** Right-aligned actions. */
  children?: ReactNode
}) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-4 border-b border-wp-line/24 px-[30px] py-[18px]">
      <div className="min-w-[220px] flex-1">
        <h1 className="flex items-center gap-2.5 font-wp-display text-[21px] font-semibold text-wp-fg">
          {icon && <Icon name={icon} size={20} className="text-wp-accent" />}
          {title}
        </h1>
        {sub && <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({
  icon = "package",
  title,
  body,
  children,
}: {
  icon?: IconName
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-20 text-center text-wp-fg-subtle">
      <Icon name={icon} size={40} />
      <div className="font-wp text-base font-bold text-wp-fg-muted">{title}</div>
      {body && <div className="font-wp text-[13.5px] font-semibold">{body}</div>}
      {children && <div className="mt-1 flex gap-2.5">{children}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-wp-sm bg-wp-line/[.18] motion-reduce:animate-none",
        className,
      )}
    />
  )
}
