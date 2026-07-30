"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useFormat } from "@boffmedia/ui/useFormat"
import { TrophyIcon } from "lucide-react"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { useGetRegistries } from "@/hooks/pokemon/useGetRegistries"

export function StreakCard() {
  const t = useTranslations("pokedex")
  const f = useFormat()
  const uuid = useRotomUuid()
  const { registries } = useGetRegistries(uuid!)

  const { dailyCounts, total, max, dayLabels } = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const counts = new Array(7).fill(0)
    if (registries) {
      for (const reg of registries) {
        const date = new Date(reg.caughtAt || reg.seenAt)
        if (date >= monday) {
          const diffDays = Math.floor((date.getTime() - monday.getTime()) / 86400000)
          if (diffDays >= 0 && diffDays < 7) counts[diffDays]++
        }
      }
    }
    const total = counts.reduce((a, b) => a + b, 0)
    const max = Math.max(...counts, 1)
    // Weekday initials come from Intl, never a hardcoded ["L","M","X"…] table.
    const labels = counts.map((_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toLocaleDateString(f.intlLocale, { weekday: "narrow" })
    })
    return { dailyCounts: counts, total, max, dayLabels: labels }
  }, [registries, f.intlLocale])

  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-[14px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-pk-display font-semibold text-[15px] tracking-tight text-pk-surface-50 flex items-center gap-2.5">
          <TrophyIcon className="w-4 h-4 text-pk-primary-400" />
          {t("streak_title")}
        </h3>
        <span className="text-xs text-pk-surface-500 pointer-events-none">
          {dayLabels[0]} – {dayLabels[6]}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 p-3.5 bg-[radial-gradient(160px_80px_at_100%_0%,rgba(249,115,22,0.15),transparent_60%)] bg-white/[0.025] border border-pk-primary-400/[0.15] rounded-xl">
        <div className="font-pk-display font-bold text-[36px] leading-none text-pk-surface-50 flex items-baseline gap-2.5 tabular-nums">
          {total}
          <span className="text-[13px] font-pk font-medium text-pk-surface-400">{t("streak_captures_week")}</span>
        </div>

        <div className="flex gap-[3px] h-7 items-end">
          {dailyCounts.map((d, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-[2px] ${d === 0 ? "bg-white/[0.06]" : "bg-pk-primary-500"}`}
              style={{ height: `${(d / max) * 100}%`, opacity: d === 0 ? 1 : 0.4 + (d / max) * 0.6 }}
              title={t("streak.capturesCount", { count: d })}
            />
          ))}
        </div>
        <div className="flex gap-[3px] font-pk-mono text-[9px] text-pk-surface-500 uppercase">
          {dayLabels.map((l, i) => (
            <span key={i} className="flex-1 text-center">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
