"use client"

import * as React from "react"
import { type Entrant, type HistoryRound, type Draw, type Phase, hashSeed, makeRng, pickWinners, parseLine, oddsOf, initials } from "@boffmedia/ui/giveaways/draw-util"
import { type SrtDrawMode, SRT_DRAW_MODES } from "@boffmedia/ui/giveaways/draw-stage"

// Re-export for backward compatibility
export type { Entrant, HistoryRound, Draw, Phase, SrtDrawMode }
export { hashSeed, makeRng, pickWinners, parseLine, oddsOf, initials, SRT_DRAW_MODES }

const LS_KEY = "bm_srt_v1"

let UID = 0
function uid() {
  return "e" + Date.now().toString(36) + "_" + UID++
}
function make(name: string, weight?: number): Entrant {
  return { id: uid(), name: name.trim(), weight: Math.max(1, weight || 1) }
}

interface Persisted {
  entrants: Entrant[]
  history: HistoryRound[]
  cfg: { weighted?: boolean; exclude?: boolean; winnerCount?: number; sound?: boolean; drawMode?: SrtDrawMode }
}
function load(): Persisted {
  if (typeof window === "undefined") return { entrants: [], history: [], cfg: {} }
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || "{}")
    return {
      entrants: Array.isArray(s.entrants) ? s.entrants : [],
      history: Array.isArray(s.history) ? s.history : [],
      cfg: s.cfg || {},
    }
  } catch {
    return { entrants: [], history: [], cfg: {} }
  }
}

export function useSorteos() {
  // Start from the empty defaults on both server and the first client render, so
  // the two match (no hydration mismatch). localStorage is applied after mount.
  const [entrants, setEntrants] = React.useState<Entrant[]>([])
  const [history, setHistory] = React.useState<HistoryRound[]>([])
  const [weighted, setWeighted] = React.useState(false)
  const [exclude, setExclude] = React.useState(true)
  const [winnerCount, setWinnerCount] = React.useState(1)
  const [sound, setSound] = React.useState(true)
  const [drawMode, setDrawMode] = React.useState<SrtDrawMode>("reel")

  const [phase, setPhase] = React.useState<Phase>("setup")
  const [draw, setDraw] = React.useState<Draw | null>(null)

  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    const s = load()
    if (s.entrants.length) setEntrants(s.entrants)
    if (s.history.length) setHistory(s.history)
    setWeighted(!!s.cfg.weighted)
    setExclude(s.cfg.exclude !== false)
    setWinnerCount(s.cfg.winnerCount || 1)
    setSound(s.cfg.sound !== false)
    const mode = s.cfg.drawMode || "reel"
    if (SRT_DRAW_MODES.includes(mode)) {
      setDrawMode(mode)
    }
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return // don't clobber storage before the load effect has run
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ entrants, history, cfg: { weighted, exclude, winnerCount, sound, drawMode } }))
    } catch {
      /* noop */
    }
  }, [ready, entrants, history, weighted, exclude, winnerCount, sound, drawMode])

  const wonNames = React.useMemo(() => new Set(history.flatMap((r) => r.winners.map((w) => w.name))), [history])
  const pool = React.useMemo(() => (exclude ? entrants.filter((e) => !wonNames.has(e.name)) : entrants), [entrants, exclude, wonNames])
  const maxWinners = Math.max(1, pool.length)
  const effCount = Math.min(winnerCount, maxWinners)
  const totalWeight = React.useMemo(() => entrants.reduce((s, e) => s + (weighted ? Math.max(1, e.weight || 1) : 1), 0), [entrants, weighted])

  /* ── mutations ── */
  const addOne = React.useCallback((name: string, weight?: number) => {
    const n = name.trim()
    if (!n) return
    setEntrants((p) => [...p, make(n, weight)])
  }, [])
  const addBulk = React.useCallback((text: string) => {
    const parsed = text.split("\n").map(parseLine).filter((r): r is { name: string; weight: number } => r != null)
    if (!parsed.length) return 0
    const rows = parsed.map((r) => make(r.name, r.weight))
    setEntrants((p) => [...p, ...rows])
    return rows.length
  }, [])
  const rename = React.useCallback((id: string, name: string) => setEntrants((p) => p.map((e) => (e.id === id ? { ...e, name } : e))), [])
  const setWeight = React.useCallback((id: string, weight: number) => setEntrants((p) => p.map((e) => (e.id === id ? { ...e, weight } : e))), [])
  const removeOne = React.useCallback((id: string) => setEntrants((p) => p.filter((e) => e.id !== id)), [])
  const shuffle = React.useCallback(() => setEntrants((p) => [...p].sort(() => Math.random() - 0.5)), [])
  const clearAll = React.useCallback(() => {
    setEntrants([])
    setHistory([])
    setPhase("setup")
    setDraw(null)
  }, [])
  const resetHistory = React.useCallback(() => {
    setHistory([])
    setPhase("setup")
    setDraw(null)
  }, [])

  /* ── draw lifecycle ── */
  const runDraw = React.useCallback(() => {
    if (pool.length === 0) return
    const seed = Math.random().toString(36).slice(2, 8).toUpperCase()
    const rng = makeRng(hashSeed(seed + "|" + pool.map((e) => e.name + ":" + (weighted ? e.weight : 1)).join(",")))
    const winners = pickWinners(pool, effCount, rng, weighted)
    setDraw({ seed, winners, pool, weighted })
    setPhase("spin")
  }, [pool, effCount, weighted])

  const drawRef = React.useRef<Draw | null>(null)
  const onLand = React.useCallback(() => {
    setPhase("reveal")
    // Use the ref to capture the draw value; don't call setHistory inside a setDraw updater
    // (side effects in updaters cause duplicated rows under StrictMode).
    if (drawRef.current) {
      const d = drawRef.current
      setHistory((h) => [
        { round: h.length + 1, seed: d.seed, at: Date.now(), winners: d.winners.map((w) => ({ name: w.name, weight: w.weight })) },
        ...h,
      ])
    }
  }, [])

  // Update the ref whenever draw changes, so onLand can access it.
  React.useEffect(() => {
    drawRef.current = draw
  }, [draw])

  const drawAgain = React.useCallback(() => {
    setPhase("setup")
    setDraw(null)
  }, [])

  const removeDrawn = React.useCallback(() => {
    let removed = 0
    if (drawRef.current) {
      const ids = new Set(drawRef.current.winners.map((w) => w.id))
      removed = drawRef.current.winners.length
      setEntrants((p) => p.filter((e) => !ids.has(e.id)))
    }
    setDraw(null)
    setPhase("setup")
    return removed
  }, [])

  return {
    entrants, history, weighted, exclude, winnerCount, sound, drawMode,
    setWeighted, setExclude, setWinnerCount, setSound, setDrawMode,
    phase, draw, pool, maxWinners, effCount, totalWeight, wonNames,
    addOne, addBulk, rename, setWeight, removeOne, shuffle, clearAll, resetHistory,
    runDraw, onLand, drawAgain, removeDrawn,
  }
}
