import * as React from "react"
import { cn } from "../cn"

export type ServerStatusState = "online" | "offline" | "unknown"

export interface ServerStatusProps {
  status?: ServerStatusState
  /** Left segment — e.g. "Online · 24/60" or "Servidor offline". Host owns the copy. */
  label: React.ReactNode
  /** Right-aligned address, shown in its natural case — e.g. "play.boff.gg". */
  address?: React.ReactNode
  className?: string
}

// The online/offline strip that fills `PackCard.serverStatus`. Sharp box with a
// 3px status left-bar (ok / bad), a status dot, the count label and the address
// pushed to the right. Nothing here pings a server; the host resolves the state
// and hands it in already rendered.
const STATE: Record<ServerStatusState, string> = {
  online: "border-l-ok text-ok",
  offline: "border-l-bad text-bad",
  unknown: "border-l-line-2 text-txt-muted",
}

export function ServerStatus({ status = "unknown", label, address, className }: ServerStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border border-solid border-line border-l-[3px] bg-panel-2 px-2.5 py-2",
        "font-mono text-[10.5px] uppercase leading-none tracking-[0.06em]",
        STATE[status],
        className,
      )}
    >
      <span className="size-[7px] shrink-0 rounded-full bg-current" />
      <span className="min-w-0 truncate">{label}</span>
      {address != null && (
        <span className="ml-auto min-w-0 truncate normal-case tracking-normal text-txt-dim">{address}</span>
      )}
    </div>
  )
}
