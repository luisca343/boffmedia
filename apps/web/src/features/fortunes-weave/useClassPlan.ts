"use client"

import { useCallback, useEffect, useState } from "react"
import { emptyClassPlan, restoreClassPlan, type ClassRoute } from "./class-model"
import { FORTUNES_WEAVE_CHARACTERS } from "./characters"

const characterIds = FORTUNES_WEAVE_CHARACTERS.map((character) => character.id)

/** Persistence is separate from the controlled planner and its presentation components. */
export function useClassPlan(accountKey: string) {
  const storageKey = "boffmedia:fortunes-weave:classes:v1:" + encodeURIComponent(accountKey)
  const [state, setState] = useState(() => ({ key: "", plan: emptyClassPlan() }))
  const [storageAvailable, setStorageAvailable] = useState(true)
  const ready = state.key === storageKey

  useEffect(() => {
    let plan = emptyClassPlan()
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) plan = restoreClassPlan(JSON.parse(raw) as unknown, characterIds)
      setStorageAvailable(true)
    } catch {
      setStorageAvailable(false)
    }
    setState({ key: storageKey, plan })
  }, [storageKey])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state.plan))
      setStorageAvailable(true)
    } catch {
      setStorageAvailable(false)
    }
  }, [ready, state, storageKey])

  const assignClass = useCallback((route: ClassRoute, characterId: string, classId: string) => {
    setState((previous) => {
      if (previous.key !== storageKey) return previous
      const assignments = { ...previous.plan[route] }
      if (classId) assignments[characterId] = classId
      else delete assignments[characterId]
      return { ...previous, plan: { ...previous.plan, [route]: assignments } }
    })
  }, [storageKey])

  return { plan: ready ? state.plan : emptyClassPlan(), ready, storageAvailable, assignClass }
}
