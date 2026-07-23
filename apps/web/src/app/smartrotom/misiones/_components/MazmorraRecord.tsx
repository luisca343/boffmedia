"use client"

import { useTranslations } from "next-intl"
import { useDungeonPlayerStats } from "../_hooks/queries"
import { EmptyBoard, FlourishCorners, Label, Nail, Paper, Shield } from "./ui"

function formatClearTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/**
 * The adventurer's own best dive — floors, stage, time and curses survived,
 * pulled from `DungeonPlayerStats.mejorPartida`. No uuid or a 404 (nobody's
 * dived yet) both read as the same themed empty state, never a raw error.
 */
export function MazmorraRecord() {
  const t = useTranslations("misiones.mazmorra.personalRecord")
  const { data: stats, isLoading } = useDungeonPlayerStats()
  const run = stats?.mejorPartida ?? null

  if (isLoading) {
    return (
      <Paper tilt={0.3} className="px-[22px] py-[18px] text-center">
        <Label className="text-ms-gold-3">{t("title")}</Label>
        <p className="mt-3 font-ms-display text-sm italic text-ms-paper-2">{t("loading")}</p>
      </Paper>
    )
  }

  if (!run || !stats) {
    return (
      <Paper tilt={0.3} className="relative px-[22px] py-[18px]">
        <Label className="text-ms-gold-3">{t("title")}</Label>
        <EmptyBoard>{t("empty")}</EmptyBoard>
      </Paper>
    )
  }

  const tablets = [
    { label: t("stats.floors"), value: run.pisosSuperados, className: "text-ms-gold-3" },
    { label: t("stats.stage"), value: run.etapaFinal, className: "text-ms-seal-active" },
    { label: t("stats.clearTime"), value: formatClearTime(run.duracionMs), className: "text-ms-gold-2" },
    { label: t("stats.curses"), value: run.maldiciones.length, className: "text-ms-seal-locked" },
  ]

  return (
    <Paper tilt={0.3} className="relative px-[22px] py-[18px]">
      <span className="absolute left-3.5 top-2">
        <Nail size={14} />
      </span>
      <span className="absolute right-3.5 top-2">
        <Nail size={14} />
      </span>
      <FlourishCorners size={28} offset={4} className="text-ms-gold-3/55" />

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Label className="text-ms-gold-3">{t("title")}</Label>
        <Shield size={32}>#{stats.rank}</Shield>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2.5">
        {tablets.map((tablet) => (
          <div
            key={tablet.label}
            className="rounded-sm border border-ms-ink-1/20 bg-ms-ink-1/[.08] px-1.5 py-2.5 text-center"
          >
            <div className={`font-ms-display text-[22px] leading-none ${tablet.className}`}>{tablet.value}</div>
            <Label className="mt-1">{tablet.label}</Label>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-dashed border-ms-ink-1/[.28] pt-3 font-ms-uppercase text-[11px] uppercase tracking-[.12em] text-ms-ink-3">
        <span>{run.completada ? t("status.completed") : t("status.failed")}</span>
      </div>
    </Paper>
  )
}
