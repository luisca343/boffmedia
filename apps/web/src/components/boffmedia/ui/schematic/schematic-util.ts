import type * as React from "react"

// v3 «Señal» — Schematic Compat (Minecraft · Hytale) shared types + helpers.
// Mirrors v3-schematic-kit.jsx. Self-contained (no external data layer). [deferred]

export type SchTone = "ok" | "warn" | "bad" | "accent" | "dim"

export const SCH_STATUS: Record<string, { tone: SchTone; label: string; plural: string }> = {
  safe: { tone: "ok", label: "Compatible", plural: "Compatibles" },
  renamed: { tone: "warn", label: "Renombrado", plural: "Renombrados" },
  "state-changed": { tone: "warn", label: "Estado", plural: "Estados cambiados" },
  missing: { tone: "bad", label: "Ausente", plural: "Ausentes" },
  "mod-only": { tone: "dim", label: "Solo mod", plural: "Solo mod" },
}

const TONE_COLOR: Record<SchTone, string> = { ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", accent: "var(--accent)", dim: "var(--dim)" }
const TONE_SOFT: Record<SchTone, string> = { ok: "var(--ok-soft)", warn: "var(--warn-soft)", bad: "var(--bad-soft)", accent: "var(--accent-soft)", dim: "rgba(127,127,127,0.12)" }

/** Inline `--st` / `--st-soft` vars for a status tone (the data-tone cascade). */
export function schToneVars(tone: SchTone): React.CSSProperties {
  return { "--st": TONE_COLOR[tone], "--st-soft": TONE_SOFT[tone] } as React.CSSProperties
}

// deterministic block-thumb fallback colour (oklch by id hash + initial)
function schHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}
export function schColor(id: string): string {
  return `oklch(0.58 0.11 ${schHash(id) % 360})`
}
export function schColor2(id: string): string {
  return `oklch(0.44 0.10 ${(schHash(id) * 7) % 360})`
}
export function schGlyphFor(id: string): string {
  const n = id.includes(":") ? id.split(":")[1] : id
  return (n[0] || "?").toUpperCase()
}

// custom glyph paths not in the system Icon set
export const SCH_GLYPHS: Record<string, string> = {
  cube: "M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10",
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  upload: "M12 16V4m0 0L7 9m5-5l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2",
}

export interface SchBlock {
  id: string
  namespace: string
  states: Record<string, string>
}
export interface SchEntry {
  block: SchBlock
  status: string
  instanceCount: number
  autoCandidate?: string
  incompatibleStates?: string[]
}
export interface SchRegistry {
  name?: string
  version: string
  loader?: string
  mods: number
  blocks: number
}
export interface SchBulkGroup {
  namespace: string
  entries: SchEntry[]
  remap: number
}
