import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import type { StatTileData } from "./profile-data"

export type StatTileProps = StatTileData & { className?: string }

export function StatTile({ icon, value, em, label, delta, deltaTone, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "relative border border-solid border-line bg-panel px-[18px] pt-4 pb-[15px]",
        "cut-tag [--cut-tag:10px] transition-[border-color,background] duration-[140ms]",
        "hover:border-accent-line hover:bg-panel-2",
        className,
      )}
    >
      <Icon name={icon} size={18} className="text-accent" />
      <div className="mt-3 font-display text-[34px]/none font-extrabold italic text-txt">
        {value}
        {em && <em className="text-accent">{em}</em>}
      </div>
      <span className="mt-[9px] block font-mono text-[10px]/none font-medium uppercase tracking-[0.13em] text-txt-muted">
        {label}
      </span>
      {delta && (
        <span
          className={cn(
            "mt-[9px] inline-block font-mono text-[10px]/none font-medium tracking-[0.06em]",
            deltaTone === "up" ? "text-ok" : deltaTone === "acc" ? "text-accent" : "text-txt-dim",
          )}
        >
          {delta}
        </span>
      )}
    </div>
  )
}
