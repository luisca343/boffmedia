"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { getMisiones } from "@/services/mcef/mcefApi"
import { isMinecraft } from "@/services/mcef/mcefHelper"
import type { IDialogue, NPC, QuestData } from "../_types"
import { buildRegions } from "../_utils/regions"

const OUTSIDE_GAME = "El tablón de misiones sólo puede leerse desde el juego."
const UNREADABLE = "No se pudo leer el tablón de misiones."

/**
 * The board's single fetch. The mod answers for whoever's client is asking, so
 * status and progress arrive already resolved — hence no uuid here.
 */
export function useQuestSystem() {
  const query = useQuery({
    queryKey: ["misiones"],
    staleTime: 60_000,
    queryFn: async () => {
      const result = await getMisiones()
      if (!result.data) throw new Error(result.error ?? UNREADABLE)
      return result.data
    },
  })

  const quests = useMemo<QuestData[]>(() => query.data?.quests ?? [], [query.data])
  const dialogs = useMemo<IDialogue[]>(() => query.data?.dialogs ?? [], [query.data])

  /** The givers, deduped by dialog — the key `npcForQuest` looks up. */
  const npcs = useMemo<NPC[]>(() => {
    const byDialog = new Map<number, NPC>()
    for (const dialog of query.data?.dialogs ?? []) {
      for (const loc of dialog.npcLocations ?? []) {
        if (byDialog.has(dialog.id)) continue
        byDialog.set(dialog.id, { name: loc.name, skin: loc.skin, dialogId: dialog.id })
      }
    }
    return [...byDialog.values()]
  }, [query.data])

  const regions = useMemo(() => buildRegions(quests), [quests])

  const error = query.error
    ? isMinecraft()
      ? UNREADABLE
      : OUTSIDE_GAME
    : null

  return {
    quests,
    npcs,
    dialogs,
    regions,
    isLoading: query.isLoading,
    error,
    refetch: query.refetch,
  }
}
