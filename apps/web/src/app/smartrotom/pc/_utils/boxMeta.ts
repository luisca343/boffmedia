import { BOX_THEMES, defaultTheme, type BoxTheme } from "./boxThemes"
import { TOTAL_BOXES } from "./constants"

/**
 * Box names and wallpapers.
 *
 * The game server has no box entity at all — a "box" is purely the `box` number on
 * each Pokémon, and there are exactly 30 of them, fixed. So a name and a wallpaper
 * are cosmetics with nowhere to live server-side, and they are kept in
 * `localStorage`: per-device, no backend, nothing fabricated. A box with no saved
 * meta still reads correctly ("Caja 7", themed by index).
 *
 * This is deliberately NOT where favourites and tags live — those are real,
 * cross-device data and go through `rotom_pc_marks` (see `marks.ts`).
 */
const KEY = "smartrotom-pc-boxes-v1"

export interface BoxMeta {
  name?: string
  theme?: BoxTheme
}

export type BoxMetaMap = Record<number, BoxMeta>

const isTheme = (v: unknown): v is BoxTheme =>
  typeof v === "string" && (BOX_THEMES as readonly string[]).includes(v)

export function loadBoxMeta(): BoxMetaMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    const out: BoxMetaMap = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const box = Number(k)
      if (!Number.isInteger(box) || box < 0 || box >= TOTAL_BOXES) continue
      if (!v || typeof v !== "object") continue
      const { name, theme } = v as BoxMeta
      out[box] = {
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 40) : undefined,
        theme: isTheme(theme) ? theme : undefined,
      }
    }
    return out
  } catch {
    return {}
  }
}

export function saveBoxMeta(meta: BoxMetaMap): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(meta))
  } catch {
    // A full or blocked localStorage costs the user a box name, not the app.
  }
}

export const boxName = (meta: BoxMetaMap, box: number) =>
  meta[box]?.name?.trim() || `Caja ${box + 1}`

export const boxTheme = (meta: BoxMetaMap, box: number): BoxTheme =>
  meta[box]?.theme ?? defaultTheme(box)
