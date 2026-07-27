"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useBoard } from "../_hooks/useBoard"
import { npcForQuest } from "../_utils/quests"
import { Divider, EmptyBoard, Label, SearchField } from "../_components/ui"
import { BoardError, BoardLoading } from "../_components/BoardStatus"
import { JournalEntry } from "../_components/JournalEntry"

/** Bitácora de Diálogos — every line any NPC has spoken, searchable. */
export default function BitacoraPage() {
  const t = useTranslations("misiones")
  const { quests, npcs, dialogs, isLoading, error, open } = useBoard()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return dialogs
    return dialogs.filter((dialog) => {
      const npc = npcForQuest(npcs, { dialogId: dialog.id })
      return (
        dialog.text.toLowerCase().includes(needle) ||
        dialog.name.toLowerCase().includes(needle) ||
        (npc?.name ?? "").toLowerCase().includes(needle)
      )
    })
  }, [dialogs, npcs, search])

  if (isLoading) return <BoardLoading>{t("bitacora.loading")}</BoardLoading>
  if (error) return <BoardError message={error} />

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-6 mt-2.5 text-center">
        <Label className="text-ms-gold-1">{t("bitacora.eyebrow")}</Label>
        <h1 className="mb-1.5 mt-1 font-ms-display text-[38px] text-ms-paper-1 [text-shadow:0_2px_12px_rgba(0,0,0,.6)]">
          {t("bitacora.title")}
        </h1>
        <div className="font-ms text-sm italic text-ms-paper-3">{t("bitacora.subtitle")}</div>
        <div className="mt-4">
          <Divider glyph="✦" className="text-ms-gold-2" />
        </div>
      </div>

      <div className="mx-auto max-w-[800px]">
        <SearchField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("bitacora.searchPlaceholder")}
          aria-label={t("bitacora.searchAriaLabel")}
          className="mb-5 max-w-[380px]"
        />

        {filtered.length === 0 ? (
          <EmptyBoard>
            {dialogs.length === 0 ? t("bitacora.emptyTitle") : t("bitacora.noResults")}
          </EmptyBoard>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((dialog) => {
              const npc = npcForQuest(npcs, { dialogId: dialog.id })
              const quest = quests.find((q) => q.id === dialog.questId)
              return <JournalEntry key={dialog.id} dialog={dialog} npc={npc} quest={quest} onOpenQuest={open} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}
