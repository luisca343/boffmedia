import type { ReactNode } from "react"

// Shared types + helpers for the Schematic Compat pieces. All presentational —
// the engine-side UnifiedBlock/DiffEntry models are adapted to these by the tool.

export type SchStatus = "safe" | "renamed" | "state-changed" | "missing" | "mod-only"

export interface SchBlock {
  id: string
  namespace: string
  states?: Record<string, string>
}

export interface SchDiffEntry {
  block: SchBlock
  status: SchStatus
  instanceCount: number
  autoCandidate?: string
  incompatibleStates?: string[]
}

export type SchGame = "minecraft" | "hytale"

export interface SchRegistry {
  name?: string | null
  version: string
  loader?: string
  mods: number
  blocks: number
}

// Deterministic block placeholder (mirrors the engine BlockThumb fallback): a
// stable oklch colour + the block name's initial, so the same id always renders
// the same tile and the eye learns to recognise blocks.
export function placeholderColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return `oklch(0.55 0.12 ${h % 360})`
}

export function placeholderGlyph(id: string): string {
  const name = id.includes(":") ? id.split(":")[1] : id
  return (name[0] || "?").toUpperCase()
}

export type SchRing = "safe" | "warn" | "bad" | null

/**
 * Optional thumb renderer. The reusable pieces render a deterministic
 * {@link AssetThumb} placeholder by default; the live tool passes this to swap in
 * real block textures (Minecraft CDN / mod JAR / Hytale Assets.zip), which still
 * fall back to the same placeholder when no texture is available.
 */
export type ThumbRenderer = (id: string, size: number, ring?: SchRing) => ReactNode

export interface SchStatusMeta {
  ring: SchRing
  dot: string
  label: string
}

// Status metadata: ring tint for the thumb + dot colour + Spanish label.
export const STATUS_META: Record<SchStatus, SchStatusMeta> = {
  safe: { ring: "safe", dot: "var(--emerald-400)", label: "Compatible" },
  renamed: { ring: "warn", dot: "var(--amber-400)", label: "Renombrado" },
  "state-changed": { ring: "warn", dot: "var(--amber-400)", label: "Estados" },
  missing: { ring: "bad", dot: "var(--rose-400)", label: "Ausente" },
  // Mod-only blocks share the "missing" red treatment for consistency — they're
  // distinguished by a "mod" pill on the row rather than a different colour.
  "mod-only": { ring: "bad", dot: "var(--rose-400)", label: "Solo mod" },
}
