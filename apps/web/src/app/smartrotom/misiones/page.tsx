"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { BoardError, BoardLoading } from "./_components/BoardStatus"
import { BoardFilters, RegionStrip, type SortKey } from "./_components/BoardFilters"
import { PlayerHeader } from "./_components/PlayerHeader"
import { QuestPaper } from "./_components/QuestPaper"
import { ScatterLayer } from "./_components/ScatterLayer"
import { TrackedQuestPaper } from "./_components/TrackedQuestPaper"
import { EmptyBoard } from "./_components/ui"
import { useBoard } from "./_hooks/useBoard"
import type { SealStatus } from "./_types"
import { npcForQuest, questCounts, searchQuests } from "./_utils/quests"
import { normalizeStatus, STATUS_ORDER } from "./_utils/status"
import { regionOf } from "./_utils/regions"

/** El Tablón — the board itself. Thin: it filters, then hangs papers. */
export default function TablonPage() {
  const t = useTranslations("misiones.board")
  const { quests, npcs, regions, isLoading, error, open, openQuest, trackedQuest } = useBoard()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<SealStatus | "ALL">("ALL")
  const [region, setRegion] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("status")

  const counts = useMemo(() => questCounts(quests), [quests])

  const papers = useMemo(() => {
    // The tracked quest is the centrepiece; it does not also hang in the grid.
    let list = quests.filter((quest) => quest.id !== trackedQuest?.id)
    if (status !== "ALL") list = list.filter((quest) => normalizeStatus(quest) === status)
    if (region) list = list.filter((quest) => quest.category === region)
    list = searchQuests(list, search, npcs)

    const sorted = [...list]
    if (sort === "level") {
      sorted.sort((a, b) => (a.requirements?.requiredLevel ?? 0) - (b.requirements?.requiredLevel ?? 0))
    } else if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      sorted.sort((a, b) => STATUS_ORDER[normalizeStatus(a)] - STATUS_ORDER[normalizeStatus(b)])
    }
    return sorted
  }, [quests, npcs, trackedQuest, status, region, search, sort])

  if (isLoading) return <BoardLoading />
  if (error) return <BoardError message={error} />

  return (
    <div className="flex min-h-full flex-col">
      <PlayerHeader quests={quests} regions={regions} />

      {trackedQuest && (
        <div className="my-8">
          <TrackedQuestPaper
            quest={trackedQuest}
            npc={npcForQuest(npcs, trackedQuest)}
            region={regionOf(regions, trackedQuest.category)}
            onOpen={() => open(trackedQuest)}
          />
        </div>
      )}

      <RegionStrip regions={regions} active={region} onSelect={setRegion} />

      <BoardFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        sort={sort}
        onSort={setSort}
        counts={counts}
      />

      <div className="ms-cork relative flex min-h-[200px] flex-1 flex-col px-6 pb-14 pt-8">
        <ScatterLayer />

        {papers.length === 0 ? (
          <EmptyBoard>
            {quests.length === 0
              ? t("emptyBoard")
              : t("emptyFiltered")}
          </EmptyBoard>
        ) : (
          <div className="relative z-[2] grid gap-9 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {papers.map((quest) => (
              <QuestPaper
                key={quest.id}
                quest={quest}
                npc={npcForQuest(npcs, quest)}
                region={regionOf(regions, quest.category)}
                selected={openQuest?.id === quest.id}
                onOpen={() => open(quest)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
