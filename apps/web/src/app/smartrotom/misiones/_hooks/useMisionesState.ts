"use client"

import { useState, useMemo, useEffect } from "react"
import { QuestData, QuestStatus } from "@/types/misiones"
import { Palette, Section } from "../_types/board"
import { makeRegions } from "../_utils/questUtils"
import { useGetRotomQuests } from "./useGetRotomQuests"

export function useMisionesState() {
  const { quests, categories, dialogs, npcs, isLoading } = useGetRotomQuests()

  const [section, setSection] = useState<Section>("board")
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [sort, setSort] = useState("status")
  const [palette, setPalette] = useState<Palette>("pergamino")
  const [isMobile, setIsMobile] = useState(false)
  const [trackedQuestId, setTrackedQuestId] = useState<number | null>(null)

  // Auto-track the first ACTIVE quest
  const firstActiveId = useMemo(
    () => quests.find((q) => q.status === QuestStatus.ACTIVE)?.id ?? null,
    [quests.length] // intentionally uses .length — only recalculate when quest count changes
  )

  useEffect(() => {
    if (trackedQuestId === null && firstActiveId !== null) {
      setTrackedQuestId(firstActiveId)
    }
  }, [firstActiveId, trackedQuestId])

  const regions = useMemo(() => makeRegions(quests), [quests])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return {
    quests,
    categories,
    dialogs,
    npcs,
    isLoading,
    section,
    setSection,
    selectedQuest,
    setSelectedQuest,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    regionFilter,
    setRegionFilter,
    sort,
    setSort,
    palette,
    setPalette,
    isMobile,
    trackedQuestId,
    setTrackedQuestId,
    regions,
  }
}
