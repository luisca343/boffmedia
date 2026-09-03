"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { formatEventDate } from "./events-util"

export interface AchievementLike {
  id: number
  name: string
  description?: string | null
  points: number
  itemType?: string | null
  category?: string | null
  rarity?: string | null
  eventName?: string | null
  // ── Per-user progress the catalogue API does NOT provide — deferred. ─────────
  /** [deferred] Whether the viewer has earned it (drives lock overlay + earned date). */
  earned?: boolean
  /** [deferred] Global % of users that own it (drives the rarity bar). */
  globalPct?: number | null
  /** [deferred] When the viewer earned it. */
  earnedDate?: string | null
}

const RARITY_HEX: Record<string, string> = {
  bronze: "#c07a45",
  silver: "#b9c2ce",
  gold: "#e6b23a",
  platinum: "#8fd6c9",
  diamond: "#8ab4ff",
}

const CAT_ICON: Record<string, IconName> = {
  competition: "trophy",
  challenge: "target",
  participation: "users",
  achievement: "star",
}

export function AchievementItem({
  achievement: a,
  showEvent,
}: {
  achievement: AchievementLike
  showEvent?: boolean
}) {
  const t = useTranslations("logros")
  const rarity = (a.rarity || "").toLowerCase()
  const rc = RARITY_HEX[rarity] || "var(--txt-muted, #8b93a1)"
  const isMedal = a.itemType === "medal"
  const icon = CAT_ICON[(a.category || "").toLowerCase()] || (isMedal ? "star" : "trophy")
  const locked = a.earned === false // [deferred] only in the showcase — real pages leave it undefined

  return (
    <div
      style={{ ["--rc" as string]: rc } as React.CSSProperties}
      className={cn(
        "flex items-start gap-4 border border-solid border-line border-l-[color:var(--rc)] bg-panel px-[1.125rem] py-4",
        "cut-tag cut-tag-edge [--cut-tag:10px] [--cut-line:var(--line)] transition-colors duration-[140ms] hover:bg-panel-2",
        isMedal ? "border-l-4" : "border-l-[3px]",
        locked && "opacity-80",
      )}
    >
      <span className="relative grid h-[3.25rem] w-[3.25rem] flex-none place-items-center border border-solid border-[color:color-mix(in_srgb,var(--rc)_40%,var(--line-2))] bg-[color-mix(in_srgb,var(--rc)_14%,transparent)] text-[color:var(--rc)] cut-seal cut-seal-edge [--cut-line:color-mix(in_srgb,var(--rc)_40%,var(--line-2))] [--cut:9px]">
        <Icon name={icon} size={24} className={cn(locked && "opacity-45")} />
        {locked && (
          <span className="absolute -bottom-1 -right-1 grid h-[1.125rem] w-[1.125rem] place-items-center border border-solid border-line bg-panel text-txt-dim">
            <Icon name="lock" size={11} />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-[1.125rem]/[1.1] text-txt">{a.name}</h3>
          {isMedal && (
            <span className="inline-flex items-center gap-1 font-mono text-[0.53125rem]/none font-semibold uppercase tracking-[0.1em] text-[color:var(--rc)]">
              <Icon name="star" size={11} />
              Medalla
            </span>
          )}
          {rarity && (
            <span className="inline-flex items-center border border-solid border-[color:color-mix(in_srgb,var(--rc)_45%,transparent)] px-1.5 py-1 font-mono text-[0.53125rem]/none font-semibold uppercase tracking-[0.1em] text-[color:var(--rc)]">
              {t(`rarity.${rarity}`)}
            </span>
          )}
          <span className="ml-auto flex-none font-mono text-[0.8125rem]/none font-semibold text-accent">
            {a.points}
            <small className="ml-0.5 text-[0.625rem] text-txt-muted">pts</small>
          </span>
        </div>
        {a.description && <p className="mt-1.5 font-body text-[0.84375rem]/[1.5] text-txt-muted text-pretty">{a.description}</p>}

        {/* [deferred] earned date / global-% bar — per-user progress isn't in the catalogue API */}
        {a.earned && a.earnedDate ? (
          <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.625rem]/none font-medium uppercase tracking-[0.08em] text-ok">
            <Icon name="check" size={12} />
            Conseguido · {formatEventDate(a.earnedDate)}
          </div>
        ) : a.globalPct != null ? (
          <div className="mt-3 grid max-w-[17.5rem] gap-1.5">
            <span className="font-mono text-[0.625rem]/none uppercase tracking-[0.08em] text-txt-dim">{a.globalPct}% lo tienen</span>
            <span className="block h-[0.3125rem] overflow-hidden border border-solid border-line bg-base">
              <i className="block h-full bg-[color:var(--rc)]" style={{ width: `${Math.max(0, Math.min(100, a.globalPct))}%` }} />
            </span>
          </div>
        ) : showEvent && a.eventName ? (
          <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.625rem]/none font-medium uppercase tracking-[0.08em] text-txt-dim">
            <Icon name="calendar" size={12} />
            {a.eventName}
          </div>
        ) : null}
      </div>
    </div>
  )
}
