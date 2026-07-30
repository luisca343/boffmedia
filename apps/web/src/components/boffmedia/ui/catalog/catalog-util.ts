"use client"

import * as React from "react"
import type { IconName } from "@boffmedia/ui"
import type { LzPlatformKey } from "@/components/boffmedia/ui/calendar"

// v3 «Señal» — Catálogo (game backlog · Backloggd-style) shared types + helpers +
// an in-memory tracking store. Mirrors v3-catalogo-data.jsx / catalogo-kit.jsx.
// The library/status persistence isn't wired to an API yet — the CtStore is a
// session-only demo store. [deferred]

export type CtStatusKey = "playing" | "played" | "backlog" | "wishlist" | "shelved" | "retired"

// label/verb live in locales/{es,en}/common.json under common.catalog.status,
// keyed by these same CtStatusKey values — resolve with t(`status.${key}.label`).
export const CT_STATUS: Record<CtStatusKey, { icon: IconName; color: string }> = {
  playing: { icon: "play", color: "oklch(0.72 0.15 150)" },
  played: { icon: "check", color: "oklch(0.70 0.13 235)" },
  backlog: { icon: "layers", color: "oklch(0.75 0.14 75)" },
  wishlist: { icon: "star", color: "oklch(0.72 0.17 55)" },
  shelved: { icon: "clock", color: "oklch(0.68 0.12 300)" },
  retired: { icon: "x", color: "oklch(0.62 0.02 260)" },
}
export const CT_STATUS_ORDER: CtStatusKey[] = ["playing", "played", "backlog", "wishlist", "shelved", "retired"]

export const CT_GENRE_ICON: Record<string, IconName> = {
  RPG: "sword", Acción: "bolt", Aventura: "compass", Shooter: "target",
  Estrategia: "grid", Deportes: "trophy", Carreras: "trending", Terror: "flame",
  Plataformas: "puzzle", Simulación: "cog", Indie: "sparkles", Lucha: "shield",
  "Mundo abierto": "map", Metroidvania: "compass", Roguelike: "skull",
  Sandbox: "grid", MOBA: "crosshair", "Battle Royale": "target", Puzzle: "puzzle", Ritmo: "bolt",
}

export interface CtGame {
  id: string
  title: string
  year: number
  developer: string
  genres: string[]
  platforms: LzPlatformKey[]
  rating: number
  ratingCountK: number
}

export interface CtList {
  id: string
  title: string
  desc?: string
  system?: boolean
  ids: string[]
}

export interface CtActivity {
  user?: string
  gameId: string
  status?: CtStatusKey
  verb?: string
  rating?: number
  review?: string
  time?: string
}

// ── deterministic rating histogram (gaussian around the mean) ────────────────
function ctHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
function ctRng(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const CT_DIST_CACHE: Record<string, { buckets: number[]; counts: number[] }> = {}
export function ctRatingDist(game: CtGame) {
  if (CT_DIST_CACHE[game.id]) return CT_DIST_CACHE[game.id]
  const buckets = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
  const spread = 0.9
  const rng = ctRng(ctHash(game.id) ^ 0x9e37)
  const weights = buckets.map((b) => {
    const d = (b - game.rating) / spread
    return Math.exp(-0.5 * d * d) * (0.75 + rng() * 0.5)
  })
  const sum = weights.reduce((a, b) => a + b, 0)
  const total = Math.max(20, Math.round(game.ratingCountK * 1000))
  const counts = weights.map((w) => Math.round((w / sum) * total))
  const out = { buckets, counts }
  CT_DIST_CACHE[game.id] = out
  return out
}

// ── session-only tracking store (status + your rating) ───────────────────────
interface CtState {
  status: Record<string, CtStatusKey>
  rating: Record<string, number>
}
let ctState: CtState = { status: {}, rating: {} }
const ctSubs = new Set<() => void>()
const ctEmit = () => ctSubs.forEach((f) => f())

export const CtStore = {
  status: (id: string): CtStatusKey | undefined => ctState.status[id],
  rating: (id: string): number => ctState.rating[id] || 0,
  setStatus(id: string, k: CtStatusKey) {
    const status = { ...ctState.status }
    if (status[id] === k) delete status[id]
    else status[id] = k
    ctState = { ...ctState, status }
    ctEmit()
  },
  setRating(id: string, v: number) {
    const rating = { ...ctState.rating }
    if (v) rating[id] = v
    else delete rating[id]
    ctState = { ...ctState, rating }
    ctEmit()
  },
  /** Seed demo state once (so cards show a corner status / your rating). */
  seed(status: Record<string, CtStatusKey>, rating: Record<string, number> = {}) {
    ctState = { status: { ...status }, rating: { ...rating } }
  },
  _get: () => ctState,
  _sub: (f: () => void) => {
    ctSubs.add(f)
    return () => ctSubs.delete(f)
  },
}
export function useCtStatus(id: string): CtStatusKey | undefined {
  const s = React.useSyncExternalStore(CtStore._sub, CtStore._get, CtStore._get)
  return s.status[id]
}
export function useCtRating(id: string): number {
  const s = React.useSyncExternalStore(CtStore._sub, CtStore._get, CtStore._get)
  return s.rating[id] || 0
}
