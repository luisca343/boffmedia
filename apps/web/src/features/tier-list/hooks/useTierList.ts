"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { createHistory, tierListHistoryReducer } from "../core/history"
import type { TierListDocument } from "../core/schema"
import type { TierListPersistenceAdapter } from "../persistence/adapters"

export type TierListSaveStatus = "loading" | "saving" | "saved" | "error"

/** Saves meaningful commits, in order; drag previews never enter this hook. */
export function useTierList(initial: TierListDocument, adapter: TierListPersistenceAdapter) {
  const [history, dispatch] = useReducer(tierListHistoryReducer, initial, createHistory)
  const [status, setStatus] = useState<TierListSaveStatus>("loading")
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const queue = useRef(Promise.resolve())
  const revision = useRef(0)
  const queued = useRef<string | null>(null)
  const key = { templateId: initial.template.id, instanceId: initial.instance.id }

  useEffect(() => {
    let cancelled = false
    setStatus("loading")
    setLoaded(false)
    adapter.load(key).then((doc) => {
      if (cancelled) return
      if (doc) {
        queued.current = JSON.stringify(doc)
        dispatch({ type: "load", document: doc })
      }
      setLoadFailed(false)
      setLoaded(true)
      setStatus("saved")
    }).catch(() => {
      if (cancelled) return
      setLoadFailed(true)
      setStatus("error")
    })
    return () => { cancelled = true; revision.current++ }
  }, [adapter, key.templateId, key.instanceId])

  useEffect(() => {
    if (!loaded || loadFailed) return
    const doc = history.present
    const raw = JSON.stringify(doc)
    // Compare with the last queued commit, not the last completed write. Undo
    // may return to the loaded state while a different save is still pending.
    if (queued.current === raw) return
    queued.current = raw
    const current = ++revision.current
    setStatus("saving")
    // A rejected predecessor cannot prevent the next commit from being saved.
    queue.current = queue.current.catch(() => {}).then(async () => {
      try {
        await adapter.save(doc)
        if (revision.current === current) setStatus("saved")
      } catch {
        if (revision.current === current) setStatus("error")
      }
    })
  }, [history.present, adapter, loaded, loadFailed, retryCount])

  const retrySave = useCallback(() => { queued.current = null; setRetryCount((n) => n + 1) }, [])
  const recoverLocal = useCallback(async () => {
    // Only called after an explicit destructive-action confirmation.
    await adapter.delete(key)
    queued.current = null
    setLoadFailed(false)
    setLoaded(true)
    setRetryCount((n) => n + 1)
  }, [adapter, key.templateId, key.instanceId])

  return { document: history.present, dispatch, canUndo: !!history.past.length, canRedo: !!history.future.length, status, loaded, loadFailed, retrySave, recoverLocal }
}
