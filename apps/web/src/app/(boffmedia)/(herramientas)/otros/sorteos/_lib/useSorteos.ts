"use client"

import * as React from "react"

export interface Entrant {
  id: string
  name: string
  weight: number
}
export interface HistoryRound {
  round: number
  seed: string
  at: number
  winners: { name: string; weight: number }[]
}
export interface Draw {
  seed: string
  winners: Entrant[]
  pool: Entrant[]
  weighted: boolean
}
export type Phase = "setup" | "spin" | "reveal"
export type DrawMode = "reel" | "wheel" | "spot"

const LS_KEY = "bm_srt_v1"

/* ── deterministic PRNG (mulberry32) — same seed + same list ⇒ same result ── */
export function hashSeed(str: string): number {
  const s = String(str)
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function pickWinners(pool: Entrant[], n: number, rng: () => number, weighted: boolean): Entrant[] {
  const items = pool.slice()
  const out: Entrant[] = []
  for (let k = 0; k < n && items.length; k++) {
    const total = items.reduce((s, e) => s + (weighted ? Math.max(1, e.weight || 1) : 1), 0)
    let r = rng() * total
    let idx = 0
    for (let i = 0; i < items.length; i++) {
      r -= weighted ? Math.max(1, items[i].weight || 1) : 1
      idx = i
      if (r <= 0) break
    }
    out.push(items[idx])
    items.splice(idx, 1)
  }
  return out
}
export function oddsOf(pool: Entrant[], entrant: Entrant, weighted: boolean): number {
  const total = pool.reduce((s, e) => s + (weighted ? Math.max(1, e.weight || 1) : 1), 0) || 1
  const w = weighted ? Math.max(1, entrant.weight || 1) : 1
  return (w / total) * 100
}
export function initials(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

let UID = 0
function uid() {
  return "e" + Date.now().toString(36) + "_" + UID++
}
function make(name: string, weight?: number): Entrant {
  return { id: uid(), name: name.trim(), weight: Math.max(1, weight || 1) }
}
// "Nombre" | "Nombre, 3" | "Nombre x3"
export function parseLine(line: string): Entrant | null {
  let s = line.trim()
  if (!s) return null
  let weight = 1
  const m = s.match(/^(.*?)[,;]\s*(\d{1,3})\s*$/) || s.match(/^(.*?)\s*[x×]\s*(\d{1,3})\s*$/i)
  if (m) {
    s = m[1].trim()
    weight = parseInt(m[2], 10) || 1
  }
  if (!s) return null
  return make(s, weight)
}

interface Persisted {
  entrants: Entrant[]
  history: HistoryRound[]
  cfg: { weighted?: boolean; exclude?: boolean; winnerCount?: number; drawMode?: DrawMode }
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
  const boot = React.useMemo(load, [])
  const [entrants, setEntrants] = React.useState<Entrant[]>(boot.entrants)
  const [history, setHistory] = React.useState<HistoryRound[]>(boot.history)
  const [weighted, setWeighted] = React.useState(!!boot.cfg.weighted)
  const [exclude, setExclude] = React.useState(boot.cfg.exclude !== false)
  const [winnerCount, setWinnerCount] = React.useState(boot.cfg.winnerCount || 1)
  const [drawMode, setDrawMode] = React.useState<DrawMode>(boot.cfg.drawMode || "reel")

  const [phase, setPhase] = React.useState<Phase>("setup")
  const [draw, setDraw] = React.useState<Draw | null>(null)

  // hydrate from localStorage after mount (SSR renders the empty boot)
  const hydrated = React.useRef(false)
  React.useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const s = load()
    if (s.entrants.length) setEntrants(s.entrants)
    if (s.history.length) setHistory(s.history)
    setWeighted(!!s.cfg.weighted)
    setExclude(s.cfg.exclude !== false)
    setWinnerCount(s.cfg.winnerCount || 1)
    setDrawMode(s.cfg.drawMode || "reel")
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ entrants, history, cfg: { weighted, exclude, winnerCount, drawMode } }))
    } catch {
      /* noop */
    }
  }, [entrants, history, weighted, exclude, winnerCount, drawMode])

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
    const rows = text.split("\n").map(parseLine).filter((r): r is Entrant => r != null)
    if (!rows.length) return 0
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

  const onLand = React.useCallback(() => {
    setPhase("reveal")
    setDraw((d) => {
      if (!d) return d
      setHistory((h) => [
        { round: h.length + 1, seed: d.seed, at: Date.now(), winners: d.winners.map((w) => ({ name: w.name, weight: w.weight })) },
        ...h,
      ])
      return d
    })
  }, [])

  const drawAgain = React.useCallback(() => {
    setPhase("setup")
    setDraw(null)
  }, [])
  const removeDrawn = React.useCallback(() => {
    setDraw((d) => {
      if (d) {
        const ids = new Set(d.winners.map((w) => w.id))
        setEntrants((p) => p.filter((e) => !ids.has(e.id)))
      }
      return null
    })
    setPhase("setup")
  }, [])

  return {
    entrants, history, weighted, exclude, winnerCount, drawMode,
    setWeighted, setExclude, setWinnerCount, setDrawMode,
    phase, draw, pool, maxWinners, effCount, totalWeight, wonNames,
    addOne, addBulk, rename, setWeight, removeOne, shuffle, clearAll, resetHistory,
    runDraw, onLand, drawAgain, removeDrawn,
  }
}
