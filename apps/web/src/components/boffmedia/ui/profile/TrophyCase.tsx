import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import type { TrophyData } from "./profile-data"

export type TrophyCardProps = TrophyData & { className?: string }

export function TrophyCard({ icon, name, meta, rare, done, locked, className }: TrophyCardProps) {
  return (
    <div
      className={cn(
        "relative border border-solid border-line bg-panel-2 px-[14px] pb-4 pt-5 text-center",
        "cut-bl cut-edge-bl [--cut-e:16px] [--cut-line:var(--line)]",
        "transition-[border-color,transform] duration-[140ms]",
        done && "hover:-translate-y-0.5 hover:border-accent-line hover:[--cut-line:var(--accent-line)]",
        locked && "opacity-60",
        className,
      )}
    >
      {rare && (
        <span className="absolute right-[9px] top-[9px] border border-solid border-accent-line bg-accent-soft px-1.5 py-1 font-mono text-[8px]/none font-bold uppercase tracking-[0.1em] text-accent">
          {rare}
        </span>
      )}
      <span
        className={cn(
          "mx-auto grid h-[50px] w-[50px] place-items-center cut-seal cut-seal-edge [--cut:10px]",
          // The locked chamfer is stroked solid even though its sides are
          // dashed — a 10px stub cannot carry a legible dash pattern, and the
          // alternative is the corner reading as a gap.
          locked
            ? "border border-dashed border-line-2 [--cut-line:var(--line-2)] bg-transparent text-txt-dim"
            : "border border-solid border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft text-accent",
        )}
      >
        <Icon name={icon} size={24} />
      </span>
      <div
        className={cn(
          "mt-[13px] font-display text-[13px]/[1.2] font-bold uppercase tracking-[0.03em]",
          locked ? "text-txt-muted" : "text-txt",
        )}
      >
        {name}
      </div>
      {meta && (
        <div className="mt-1.5 font-mono text-[9px]/[1.3] font-medium uppercase tracking-[0.08em] text-txt-muted">
          {meta}
        </div>
      )}
    </div>
  )
}

export interface TrophyCaseProps {
  trophies: TrophyData[]
  className?: string
}

export function TrophyCase({ trophies, className }: TrophyCaseProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      {trophies.map((tr) => (
        <TrophyCard key={tr.name} {...tr} />
      ))}
    </div>
  )
}
