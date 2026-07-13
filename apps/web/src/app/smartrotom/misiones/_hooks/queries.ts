"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import { useBoffSession } from "@/services/useBoffSession"
import type { IDialogue, NPC, QuestData } from "../_types"
import { buildRegions } from "../_utils/regions"

/**
 * The board's single fetch. Everything on every screen — papers, reinos, the
 * atlas, the satchel, the journal — is derived from this one response
 * (SMARTROTOM_V3.md §8: TanStack Query, not `useEffect` + `setState`).
 */
export function useQuestSystem() {
  const { session } = useBoffSession()
  const uuid = session?.user?.smartRotomUser?.uuid

  const query = useQuery({
    queryKey: ["misiones", "user", uuid],
    enabled: Boolean(uuid),
    staleTime: 60_000,
    queryFn: async () => {
      // `boffAPI` resolves (not throws) on an HTTP error, so `.success` is the
      // only honest check — reading `.data` optimistically is the silent-failure
      // pattern the audit flagged.
      const response = await MisionesService.getQuestsForUser(uuid!)
      if (!response.success || !response.data) {
        // `message` is the human sentence ("Failed to fetch quest data: timeout…");
        // `error` is only the code (`HTTP_EXCEPTION`), which tells the player nothing.
        throw new Error(response.message || response.error || "No se pudo leer el tablón de misiones.")
      }
      return response.data
    },
  })

  const quests = useMemo<QuestData[]>(() => query.data?.quests ?? [], [query.data])
  const npcs = useMemo<NPC[]>(() => query.data?.npcs ?? [], [query.data])
  const dialogs = useMemo<IDialogue[]>(() => query.data?.dialogs ?? [], [query.data])
  const regions = useMemo(() => buildRegions(quests), [quests])

  return {
    quests,
    npcs,
    dialogs,
    regions,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  }
}
