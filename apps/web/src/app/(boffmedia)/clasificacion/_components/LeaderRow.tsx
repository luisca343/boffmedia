import * as React from "react"
import { cn } from "@/lib/utils"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"

export type SortKey = "points" | "medals" | "achievements"

export interface LeaderRowData {
  nickname: string
  avatar?: string | null
  totalPoints: number
  medalCount: number
  achievementCount: number
}

function LeaderAvatar({ src, initial, top3 }: { src?: string | null; initial: string; top3?: boolean }) {
  return (
    <span
      className={cn(
        // No: the seal clip already clips the image, and
        // overflow would trim the chamfer strokes off their own corners.
        "relative grid h-[38px] w-[38px] shrink-0 place-items-center border border-solid bg-panel-2 font-display text-[15px] font-extrabold italic text-accent cut-seal cut-seal-edge [--cut:6px]",
        top3 ? "border-accent [--cut-line:var(--accent)]" : "border-line-2 [--cut-line:var(--line-2)]",
      )}
    >
      <ArtImage src={src} alt="" sizes="38px" fallback={<span>{initial}</span>} />
    </span>
  )
}

function Metric({ value, label, active, className }: { value: React.ReactNode; label: string; active?: boolean; className?: string }) {
  return (
    <div className={cn("grid min-w-[62px] gap-1 text-right", className)}>
      <span className={cn("font-mono text-[15px] font-semibold leading-none tabular-nums", active ? "text-accent" : "text-txt")}>
        {value}
      </span>
      <span className="font-mono text-[9px] font-medium uppercase leading-none tracking-[0.12em] text-txt-dim">{label}</span>
    </div>
  )
}

export interface LeaderRowProps {
  position: number
  entry: LeaderRowData
  activeSort: SortKey
  labels: { points: string; medals: string; achievements: string }
  /** Locale-aware point formatter — pass `useFormat().number` from the parent. */
  formatPoints: (n: number) => string
}

export function LeaderRow({ position, entry, activeSort, labels, formatPoints }: LeaderRowProps) {
  const top3 = position <= 3
  const initial = (entry.nickname || "?").charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 border-b border-line px-[18px] py-3 transition-colors duration-[140ms] last:border-b-0 hover:bg-panel-2",
        top3 && "bg-[linear-gradient(90deg,var(--accent-soft),transparent_55%)]",
      )}
    >
      <span
        className={cn(
          "w-[34px] shrink-0 text-center font-display text-[24px] font-extrabold italic leading-none tabular-nums",
          top3 ? "text-accent" : "text-txt-muted",
        )}
      >
        {position}
      </span>
      <LeaderAvatar src={entry.avatar} initial={initial} top3={top3} />
      <span className="min-w-0 flex-1 truncate font-display text-[16px] font-bold uppercase leading-[1.1] text-txt">
        {entry.nickname}
      </span>
      <div className="flex items-center gap-4 sm:gap-6">
        <Metric value={formatPoints(entry.totalPoints)} label={labels.points} active={activeSort === "points"} />
        <Metric value={entry.medalCount} label={labels.medals} active={activeSort === "medals"} className="hidden min-[560px]:grid" />
        <Metric
          value={entry.achievementCount}
          label={labels.achievements}
          active={activeSort === "achievements"}
          className="hidden min-[560px]:grid"
        />
      </div>
    </div>
  )
}
