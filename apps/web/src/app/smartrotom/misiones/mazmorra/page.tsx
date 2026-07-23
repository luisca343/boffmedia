"use client"

import { useTranslations } from "next-intl"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { useDungeonRanking } from "../_hooks/queries"
import { Divider, Label } from "../_components/ui"
import { BoardError, BoardLoading } from "../_components/BoardStatus"
import { MazmorraLeaderboard } from "../_components/MazmorraLeaderboard"
import { MazmorraRecord } from "../_components/MazmorraRecord"

/** La Mazmorra — the guild's dungeon leaderboard and the reader's own best dive. */
export default function MazmorraPage() {
  const t = useTranslations("misiones.mazmorra")
  const uuid = useRotomUuid()
  const { data: ranking, isLoading, error } = useDungeonRanking(25)

  return (
    <div className="flex min-h-full flex-col pt-1.5">
      <div className="mb-[18px] text-center">
        <Label className="text-ms-gold-1">{t("eyebrow")}</Label>
        <h1 className="my-1 font-ms-display text-[38px] text-ms-paper-1 [text-shadow:0_2px_12px_rgba(0,0,0,.6)]">
          {t("title")}
        </h1>
        <div className="text-sm italic text-ms-paper-3">{t("subtitle")}</div>
        <div className="mt-4">
          <Divider glyph="✦" className="text-ms-gold-2" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[800px]">
        {isLoading ? (
          <BoardLoading>{t("loading")}</BoardLoading>
        ) : error ? (
          <BoardError message={error.message} />
        ) : (
          <MazmorraLeaderboard ranking={ranking ?? []} currentUuid={uuid} />
        )}

        <MazmorraRecord />
      </div>
    </div>
  )
}
