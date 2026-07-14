"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { rotomPOSTOrThrow, userMessageFrom } from "@/services/boffAPI"
import type { QuestSystemData } from "@/types/misiones"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import type { IDialogue, NPC, QuestData } from "../_types"
import { buildRegions } from "../_utils/regions"

/**
 * The board's single fetch. Everything on every screen — papers, reinos, the
 * atlas, the satchel, the journal — is derived from this one response
 * (SMARTROTOM_V3.md §8: TanStack Query, not `useEffect` + `setState`).
 */
export function useQuestSystem() {
  const uuid = useRotomUuid()

  const query = useQuery({
    queryKey: ["misiones", "user", uuid],
    enabled: Boolean(uuid),
    staleTime: 60_000,
    queryFn: () => rotomPOSTOrThrow<QuestSystemData>("/misiones/user", { uuid: uuid! }),
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
    error: query.error ? userMessageFrom(query.error, "No se pudo leer el tablón de misiones.") : null,
    refetch: query.refetch,
  }
}
