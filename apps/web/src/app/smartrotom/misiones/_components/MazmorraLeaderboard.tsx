"use client"

import { useTranslations } from "next-intl"
import type { DungeonRankingEntry } from "@boffmedia/shared"
import { cn } from "@/lib/utils"
import { EmptyBoard, Icon, Label, Paper } from "./ui"

const MEDAL_CLASS = ["text-ms-gold-1", "text-ms-gold-2", "text-ms-gold-3"] as const

/** Fastest completed run, or a dash for a player who has never finished one. */
function formatClearTime(ms: number | null): string {
  if (!ms) return "—"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/**
 * The dungeon leaderboard — top-3 rows get a medal in `ms-gold-*` tones, and
 * whichever row is the current reader's own uuid is picked out from the rest.
 */
export function MazmorraLeaderboard({
  ranking,
  currentUuid,
}: {
  ranking: DungeonRankingEntry[]
  currentUuid: string | null
}) {
  const t = useTranslations("misiones.mazmorra.leaderboard")

  return (
    <Paper tilt={-0.3} className="relative mb-7 px-[1.375rem] py-[1.125rem]">
      <Label className="text-ms-gold-3">{t("title")}</Label>

      {ranking.length === 0 ? (
        <EmptyBoard>{t("empty")}</EmptyBoard>
      ) : (
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem_5rem] gap-2.5 px-2.5 pb-1.5 font-ms-uppercase text-[0.625rem] uppercase tracking-[.14em] text-ms-ink-3">
            <span>{t("columns.rank")}</span>
            <span>{t("columns.player")}</span>
            <span className="text-right">{t("columns.floors")}</span>
            <span className="text-right">{t("columns.clears")}</span>
            <span className="text-right">{t("columns.bestTime")}</span>
          </div>

          {ranking.map((entry, index) => {
            const isCurrent = currentUuid !== null && entry.uuid === currentUuid
            const medal = index < 3 ? MEDAL_CLASS[index] : null
            return (
              <div
                key={entry.uuid}
                className={cn(
                  "grid grid-cols-[2.5rem_1fr_5rem_5rem_5rem] items-center gap-2.5 rounded-sm border px-2.5 py-2 text-sm",
                  isCurrent ? "border-ms-gold-2 bg-ms-gold-2/[.12]" : "border-ms-ink-1/20 bg-ms-ink-1/[.05]",
                )}
              >
                <span className={cn("font-ms-display text-base", medal ?? "text-ms-ink-3")}>{entry.rank}</span>
                <span className="flex min-w-0 items-center gap-1.5 text-ms-ink-1">
                  {medal && <Icon.Medal size={14} className={medal} />}
                  <span className="truncate">{entry.nombre}</span>
                </span>
                <span className="text-right text-ms-ink-2">{entry.mejorPisos}</span>
                <span className="text-right text-ms-ink-2">
                  {entry.completadas}/{entry.partidas}
                </span>
                <span className="text-right font-ms-mono text-[0.8125rem] text-ms-gold-3">
                  {formatClearTime(entry.mejorTiempoMs)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Paper>
  )
}
