// Mewgenics cat part data loader — caches the large placements file

import { mewUrl } from "../mew-store-state"
import type { CatPartsData, CatPartsPlacements } from "./types"

// Lazy-load the placements file (2.8MB) only when building
let cachedPlacements: CatPartsPlacements | null = null
let placementsPromise: Promise<CatPartsPlacements> | null = null

export async function loadCatPartsPlacements(): Promise<CatPartsPlacements> {
  if (cachedPlacements) return cachedPlacements
  if (placementsPromise) return placementsPromise

  placementsPromise = fetch(mewUrl("catparts_placements.json"))
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load catparts_placements: ${r.status}`)
      return r.json() as Promise<CatPartsPlacements>
    })
    .then((data) => {
      cachedPlacements = data
      return data
    })

  return placementsPromise
}

export async function loadCatPartsManifest(): Promise<CatPartsData> {
  const r = await fetch(mewUrl("catparts.json"))
  if (!r.ok) throw new Error(`Failed to load catparts.json: ${r.status}`)
  return r.json() as Promise<CatPartsData>
}

export function getCachedPlacements(): CatPartsPlacements | null {
  return cachedPlacements
}

export interface CatPartsFrameIndex {
  clips: Record<string, number[]>
  counts?: Record<string, number>
}

// The authoritative list of frames that were actually exported per clip.
// part_bounds is NOT a substitute: it spans a clip's whole timeline, while the
// exporter ships a scoped subset, so enumerating part_bounds 404s on the gaps.
let framesPromise: Promise<CatPartsFrameIndex> | null = null

export function loadCatPartsFrames(): Promise<CatPartsFrameIndex> {
  if (!framesPromise) {
    framesPromise = fetch(mewUrl("catparts_frames.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load catparts_frames: ${r.status}`)
        return r.json() as Promise<CatPartsFrameIndex>
      })
      .catch((err) => {
        framesPromise = null
        throw err
      })
  }
  return framesPromise
}

export function mewCatSvgUrl(clip: string, frame: number): string {
  return mewUrl(`assets/catparts/${clip}/${frame}.svg`)
}

export function mewPaletteUrl(): string {
  return mewUrl("assets/catparts/palettes/palette.png")
}

export function mewEyeStripUrl(index: 1 | 2 | 3): string {
  return mewUrl(`assets/catparts/palettes/eyestrip${index}.png`)
}
