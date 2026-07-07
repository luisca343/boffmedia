"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives/icon"

export interface AchievementLike {
  id: number
  name: string
  description?: string | null
  points: number
  itemType?: string | null
  category?: string | null
  rarity?: string | null
  eventName?: string | null
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

export function AchievementItem({ achievement: a, showEvent }: { achievement: AchievementLike; showEvent?: boolean }) {
  const t = useTranslations("logros")
  const rarity = (a.rarity || "").toLowerCase()
  const rc = RARITY_HEX[rarity] || "var(--txt-muted, #8b93a1)"
  const isMedal = a.itemType === "medal"
  const icon = CAT_ICON[(a.category || "").toLowerCase()] || (isMedal ? "star" : "trophy")

  return (
    <div
      style={{ ["--rc" as string]: rc } as React.CSSProperties}
      className={cn(
        "flex items-start gap-4 border border-solid border-line border-l-[color:var(--rc)] bg-panel px-[18px] py-4",
        "cut-tag [--cut-tag:10px] transition-colors duration-[140ms] hover:bg-panel-2",
        isMedal ? "border-l-4" : "border-l-[3px]",
      )}
    >
      <span className="grid h-[52px] w-[52px] flex-none place-items-center border border-solid border-[color:color-mix(in_srgb,var(--rc)_40%,var(--line-2))] bg-[color-mix(in_srgb,var(--rc)_14%,transparent)] text-[color:var(--rc)] cut [--cut:9px]">
        <Icon name={icon} size={24} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-[18px]/[1.1] text-txt">{a.name}</h3>
          {rarity && (
            <span className="inline-flex items-center border border-solid border-[color:color-mix(in_srgb,var(--rc)_45%,transparent)] px-1.5 py-1 font-mono text-[8.5px]/none font-semibold uppercase tracking-[0.1em] text-[color:var(--rc)]">
              {t(`rarity.${rarity}`)}
            </span>
          )}
          <span className="ml-auto flex-none font-mono text-[13px]/none font-semibold text-accent">
            {a.points}
            <small className="ml-0.5 text-[10px] text-txt-muted">pts</small>
          </span>
        </div>
        {a.description && <p className="mt-1.5 font-body text-[13.5px]/[1.5] text-txt-muted text-pretty">{a.description}</p>}
        {showEvent && a.eventName && (
          <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px]/none font-medium uppercase tracking-[0.08em] text-txt-dim">
            <Icon name="calendar" size={12} />
            {a.eventName}
          </div>
        )}
      </div>
    </div>
  )
}
