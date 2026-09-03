"use client"

import { useTranslations } from "next-intl"
import { useBoard } from "../_hooks/useBoard"
import { EmptyBoard, Label } from "../_components/ui"
import { BoardError, BoardLoading } from "../_components/BoardStatus"
import { ThreadWall } from "../_components/ThreadWall"

export default function LaTramaPage() {
  const t = useTranslations("misiones.trama")
  const { quests, isLoading, error } = useBoard()

  return (
    <div className="flex min-h-full flex-col pt-1.5">
      <div className="mb-[1.125rem] text-center">
        <Label className="text-ms-gold-1">{t("eyebrow")}</Label>
        <h1 className="my-1 font-ms-display text-[2.375rem] text-ms-paper-1 [text-shadow:0_2px_12px_rgba(0,0,0,.6)]">{t("title")}</h1>
        <div className="text-sm italic text-ms-paper-3">
          {t("subtitle")}
        </div>
      </div>

      {isLoading ? (
        <BoardLoading>{t("loading")}</BoardLoading>
      ) : error ? (
        <BoardError message={error} />
      ) : quests.length === 0 ? (
        <EmptyBoard>{t("empty")}</EmptyBoard>
      ) : (
        <ThreadWall />
      )}
    </div>
  )
}
