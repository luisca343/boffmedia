"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "../_components/ui"
import type { QueuedMove } from "../_utils/movePlan"
import { useMovePokemon } from "./queries"

// The move planners are pure and live in `_utils/movePlan`; re-exported here so the
// call sites keep importing the queue and its plans from one place.
export { planBulkMove, planOrganize } from "../_utils/movePlan"
export type { QueuedMove } from "../_utils/movePlan"

export interface QueueProgress {
  done: number
  total: number
  label: string
}

/**
 * `POST /pc/move` moves exactly one Pokémon, so anything bulk — moving a multi-
 * selection into a box, auto-organising a box — is a *sequence* of real moves against
 * the Minecraft server. There is no batch endpoint and we are not inventing one.
 *
 * The moves are issued one at a time, in order, because each is a swap whose result
 * the next one depends on. If one fails the queue stops there rather than charging on
 * and scrambling the box: what already landed stays landed (it is only a reordering,
 * so nothing is lost), and the user is told how far it got.
 */
export function useMoveQueue() {
  const t = useTranslations("pc")
  const move = useMovePokemon()
  const [progress, setProgress] = useState<QueueProgress | null>(null)
  const cancelled = useRef(false)

  const cancel = useCallback(() => {
    cancelled.current = true
  }, [])

  const run = useCallback(
    async (moves: QueuedMove[], label: string): Promise<boolean> => {
      if (moves.length === 0) return true
      cancelled.current = false
      setProgress({ done: 0, total: moves.length, label })

      for (let i = 0; i < moves.length; i++) {
        if (cancelled.current) {
          toast(t("moveQueue.cancelled", { label, applied: i, count: moves.length }), "info")
          setProgress(null)
          return false
        }
        try {
          await move.mutateAsync(moves[i])
        } catch {
          toast(t("moveQueue.interrupted", { label, done: i, count: moves.length }), "error", 4000)
          setProgress(null)
          return false
        }
        setProgress({ done: i + 1, total: moves.length, label })
      }

      setProgress(null)
      return true
    },
    [move, t],
  )

  return { run, cancel, progress, isRunning: progress !== null }
}
