import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import type { StatTileData } from "./profile-data"

export type StatTileProps = StatTileData & { className?: string }

export function StatTile({ icon, value, em, label, delta, deltaTone, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "relative border border-solid border-line bg-panel px-[1.125rem] pt-4 pb-[0.9375rem]",
        "cut-tag cut-tag-edge [--cut-line:var(--accent-line)] [--cut-tag:10px] transition-[border-color,background] duration-[140ms]",
        "hover:border-accent-line hover:bg-panel-2",
        className,
      )}
    >
      <Icon name={icon} size={18} className="text-accent" />
      <div className="mt-3 font-display text-[2.125rem]/none font-extrabold italic text-txt">
        {value}
        {em && <em className="text-accent">{em}</em>}
      </div>
      <span className="mt-[0.5625rem] block font-mono text-[0.625rem]/none font-medium uppercase tracking-[0.13em] text-txt-muted">
        {label}
      </span>
      {delta && (
        <span
          className={cn(
            "mt-[0.5625rem] inline-block font-mono text-[0.625rem]/none font-medium tracking-[0.06em]",
            deltaTone === "up" ? "text-ok" : deltaTone === "acc" ? "text-accent" : "text-txt-dim",
          )}
        >
          {delta}
        </span>
      )}
    </div>
  )
}
