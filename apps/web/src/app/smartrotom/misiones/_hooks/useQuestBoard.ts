import { useMemo } from "react"
import Fuse from "fuse.js"
import { QuestData } from "@/types/misiones"
import { STATUS_ORDER } from "../_utils/questUtils"

interface UseQuestBoardProps {
  quests: QuestData[]
  search: string
  statusFilter: string
  regionFilter: string | null
  sort: string
  trackedQuestId: number | null
}

export function useQuestBoard({
  quests, search, statusFilter, regionFilter, sort, trackedQuestId,
}: UseQuestBoardProps) {
  const fuse = useMemo(() => new Fuse(quests, {
    keys: ["name", "logText", "category"],
    threshold: 0.4,
  }), [quests])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: quests.length }
    for (const q of quests) c[q.status] = (c[q.status] || 0) + 1
    return c
  }, [quests])

  const filtered = useMemo(() => {
    let list: QuestData[] = quests.filter((q) => q.id !== trackedQuestId)
    if (statusFilter !== "ALL") list = list.filter((q) => q.status === statusFilter)
    if (regionFilter) list = list.filter((q) => q.category === regionFilter)
    if (search.trim()) {
      list = fuse.search(search).map((r) => r.item).filter((q) => q.id !== trackedQuestId)
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === "type") list.sort((a, b) => a.type - b.type)
    else list.sort((a, b) => (STATUS_ORDER[a.status] || 9) - (STATUS_ORDER[b.status] || 9))
    return list
  }, [quests, statusFilter, regionFilter, search, sort, trackedQuestId, fuse])

  return { counts, filtered }
}
