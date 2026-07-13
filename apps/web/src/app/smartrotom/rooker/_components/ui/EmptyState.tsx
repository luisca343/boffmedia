import type { ReactNode } from "react"
import { Icon, type IconName } from "./Icon"

/**
 * The nest is empty.
 *
 * Rooker ships with no fabricated content — the feed genuinely starts at zero and real
 * players fill it — so this is not an edge case, it is the app's first screen. It says
 * what to do next rather than apologising.
 */
export interface EmptyStateProps {
  icon?: IconName
  title: string
  body?: string
  action?: ReactNode
}

export function EmptyState({ icon = "feather", title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-rk-accent/12 text-rk-accent">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="text-[19px] font-extrabold text-rk-fg">{title}</h3>
      {body && <p className="max-w-[380px] text-[14px] leading-relaxed text-rk-fg-subtle">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
