import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

/** The small uppercase label that opens every block in the panel. */
export function Eyebrow({
  icon,
  count,
  className,
  children,
}: {
  icon?: IconName
  count?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.6px] text-tx-txt-3",
        className,
      )}
    >
      {icon && <Icon name={icon} size={13} stroke={2.2} />}
      {children}
      {count !== undefined && <span className="text-tx-txt-2">· {count}</span>}
    </div>
  )
}

/** An empty result — always offers the way back out. */
export function Empty({
  icon = "search",
  message,
  action,
  onAction,
}: {
  icon?: IconName
  message: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-9 text-center text-tx-txt-2">
      <span className="text-tx-txt-3">
        <Icon name={icon} size={26} stroke={1.8} />
      </span>
      <p className="m-0 text-sm">{message}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className="text-sm font-extrabold text-tx-accent hover:underline">
          {action}
        </button>
      )}
    </div>
  )
}

/** One figure in the selected-stop card's three-up row. */
export function Stat({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: IconName
  label: string
  value: ReactNode
  tone?: "neutral" | "money" | "bad"
}) {
  return (
    <div className="rounded-tx-md bg-tx-surface border border-solid border-tx-line px-2 py-2.5 text-center">
      <div
        className={cn(
          "mb-[5px] flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.3px]",
          tone === "money" ? "text-tx-money" : "text-tx-txt-3",
        )}
      >
        <Icon name={icon} size={13} stroke={2} />
        {label}
      </div>
      <div className={cn("font-tx-mono text-sm font-extrabold", tone === "bad" ? "text-tx-no" : "text-tx-txt")}>
        {value}
      </div>
    </div>
  )
}

/** A bigger figure with its own icon — the passport's stat grid. */
export function StatBox({
  icon,
  value,
  suffix,
  label,
  money,
}: {
  icon: IconName
  value: ReactNode
  suffix?: string
  label: string
  money?: boolean
}) {
  return (
    <div className="rounded-tx-md bg-tx-surface border border-solid border-tx-line p-[13px]">
      <div className="mb-[9px] grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-tx-surface-2 text-tx-blue-400">
        <Icon name={icon} size={16} stroke={2.2} />
      </div>
      <div className={cn("font-tx-mono text-[21px] font-extrabold", money ? "text-tx-money" : "text-tx-txt")}>
        {value}
        {suffix && <small className="text-xs font-bold text-tx-txt-3">{suffix}</small>}
      </div>
      <div className="mt-0.5 text-[11.5px] text-tx-txt-2">{label}</div>
    </div>
  )
}

/** A determinate bar. Blue→amber, the same direction of travel as everything else. */
export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("h-[5px] overflow-hidden rounded-[3px] bg-tx-surface-2", className)}>
      <span
        className="block h-full rounded-[3px] bg-gradient-to-r from-tx-blue-500 to-tx-accent"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  )
}
