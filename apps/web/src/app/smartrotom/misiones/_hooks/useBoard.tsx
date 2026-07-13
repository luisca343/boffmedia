"use client"

import { AppQueryProvider } from "@/components/smartrotom/behavior/QueryProvider"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { QuestData } from "../_types"
import { normalizeStatus } from "../_utils/status"
import { useQuestSystem } from "./queries"

const TRACKED_KEY = "misiones:tracked"

interface BoardValue extends ReturnType<typeof useQuestSystem> {
  /** The paper the letter is open on, or null when the desk is clear. */
  openQuest: QuestData | null
  open: (quest: QuestData | null) => void
  /** The centrepiece of the tablón. Defaults to the first quest in progress. */
  trackedQuest: QuestData | null
  track: (quest: QuestData) => void
  /** Pinned by the player rather than defaulted — drives the button's state. */
  isTracked: (quest: QuestData) => boolean
}

const BoardContext = createContext<BoardValue | null>(null)

/**
 * Which quest is being read, and which one is pinned as the centrepiece. Both
 * are UI state, not server state: the game has no "tracked quest" concept, so
 * the choice lives in localStorage and falls back to the first ACTIVE quest.
 */
function BoardState({ children }: { children: ReactNode }) {
  const system = useQuestSystem()
  const [openId, setOpenId] = useState<number | null>(null)
  const [trackedId, setTrackedId] = useState<number | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TRACKED_KEY)
      if (stored) setTrackedId(Number(stored))
    } catch {
      /* private mode — the default below still gives a centrepiece */
    }
  }, [])

  const track = useCallback((quest: QuestData) => {
    setTrackedId(quest.id)
    try {
      localStorage.setItem(TRACKED_KEY, String(quest.id))
    } catch {
      /* noop */
    }
  }, [])

  const value = useMemo<BoardValue>(() => {
    const stored = system.quests.find((quest) => quest.id === trackedId)
    // A pinned quest that has since been completed stops being the centrepiece.
    const pinned = stored && normalizeStatus(stored) === "ACTIVE" ? stored : undefined
    const trackedQuest = pinned ?? system.quests.find((quest) => normalizeStatus(quest) === "ACTIVE") ?? null

    return {
      ...system,
      openQuest: system.quests.find((quest) => quest.id === openId) ?? null,
      open: (quest) => setOpenId(quest?.id ?? null),
      trackedQuest,
      track,
      isTracked: (quest) => quest.id === pinned?.id,
    }
  }, [system, openId, trackedId, track])

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function BoardProvider({ children }: { children: ReactNode }) {
  return (
    <AppQueryProvider>
      <BoardState>{children}</BoardState>
    </AppQueryProvider>
  )
}

export function useBoard() {
  const value = useContext(BoardContext)
  if (!value) throw new Error("useBoard debe usarse dentro de <BoardProvider>")
  return value
}
