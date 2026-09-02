import { mewAssetUrl } from "./asset"
// Mewgenics real-art singleton. The codex store fills this once the sprite/icon
// maps load; MewTile reads it to render a real SVG when one exists (else the hue
// monogram fallback). Kept dependency-free so the showcase — which never loads
// the store — bundles it without pulling the fetch layer.

interface MewArtState {
  /** character id → sprite svg path (single representative frame) */
  sprites: Record<string, string>
  /** category → id → icon svg path (abilities · passives · items) */
  icons: Record<string, Record<string, string>>
  /** token name → svg path (stat tokens, class glyphs, etc.) */
  tokens?: Record<string, string>
  /** name → png/svg path (panels, slots, backgrounds, cursors) */
  panels?: Record<string, string>
  slots?: Record<string, string>
  backgrounds?: Record<string, string>
  cursors?: Record<string, string>
  /** textures: name → path; cursors: name → {src, hotspot}; sfx: name → {opus, m4a} */
  textures?: Record<string, string>
  cursorData?: Record<string, { src: string; hotspot: [number, number] }>
  sfx?: Record<string, { opus: string; m4a: string }>
  /** area → {graphic, background, node_icons} (map assets) */
  mapAssets?: Record<string, { graphic?: string; background?: string; node_icons?: string[] }>
  /** normalized token → {asset, records} (character/event portraits) */
  portraits?: Record<string, { asset: string; records?: Array<{ type: string; id: string }> }>
  /** class name → {bg} (class background assets) */
  classAssets?: Record<string, { bg?: string }>
}

const state: MewArtState = { sprites: {}, icons: {} }

export function setMewArt(next: Partial<MewArtState>) {
  if (next.sprites) state.sprites = next.sprites
  if (next.icons) state.icons = next.icons
  if (next.tokens) state.tokens = next.tokens
  if (next.panels) state.panels = next.panels
  if (next.slots) state.slots = next.slots
  if (next.backgrounds) state.backgrounds = next.backgrounds
  if (next.cursors) state.cursors = next.cursors
  if (next.textures) state.textures = next.textures
  if (next.cursorData) state.cursorData = next.cursorData
  if (next.sfx) state.sfx = next.sfx
  if (next.mapAssets) state.mapAssets = next.mapAssets
  if (next.portraits) state.portraits = next.portraits
  if (next.classAssets) state.classAssets = next.classAssets
}

/** A record may carry its own art path: `sprite` (characters), `icon` (items/
 *  passives/abilities). Both point to files that exist on disk. */
interface ArtRec {
  id?: string
  icon?: string | null
  sprite?: string | null
}

/** Class ids whose fonticon ships under the class's former name. */
const CLASS_GLYPH_ALIAS: Record<string, string> = { Medic: "cleric" }

/** Resolve a same-origin SVG url for a record, or null → monogram fallback.
 *  Handles per-category art: characters (sprite), items/passives/abilities (icon),
 *  furniture (PNG), classes (glyph via token), statuses (glyph by status_kind).
 *  For sets (first member's item), use the optional setMemberResolver callback.
 */
export function mewArtSrc(cat: string, rec: ArtRec | null | undefined, setMemberResolver?: (setId: string) => string | null): string | null {
  if (!rec) return null
  const id = rec.id
  let path: string | null | undefined

  if (cat === "characters") {
    path = rec.sprite || (id ? state.sprites[id] : undefined)
  } else if (cat === "items" || cat === "passives") {
    path = rec.icon || (id ? state.icons[cat]?.[id] : undefined)
  } else if (cat === "abilities") {
    path = rec.icon || (id ? state.icons.abilities?.[id] : undefined)
  } else if (cat === "furniture" && id) {
    // Furniture has direct PNG assets; use mewFurnitureArt
    return mewFurnitureArt(id)
  } else if (cat === "classes" && id) {
    // Classes use token glyphs; try token first, then icon. CLASS_GLYPH_ALIAS
    // covers ids the game renamed after its fonticons were drawn (the Medic
    // class still ships FontIcon_Cleric).
    path = mewTokenSrc(CLASS_GLYPH_ALIAS[id] || id)
    if (path) return path
    path = rec.icon || (id ? state.icons[cat]?.[id] : undefined)
  } else if (cat === "statuses" && rec && typeof (rec as any).status_kind === "string") {
    // Statuses: resolve glyph by status_kind
    const kind = (rec as any).status_kind as string
    const kindMap: Record<string, string> = { weather: "weather", injuries: "health", elite_buffs: "elite" }
    const tokenKey = kindMap[kind]
    if (tokenKey) {
      path = mewTokenSrc(tokenKey)
      if (path) return path
    }
    // Fallback to icon if token not found
    path = rec.icon || (id ? state.icons[cat]?.[id] : undefined)
  } else if (cat === "sets" && id && setMemberResolver) {
    // Sets: resolve first member's item art via callback
    path = setMemberResolver(id)
    if (path) return path
  }

  if (!path) return null
  return path.startsWith("http") || path.startsWith("/") ? path : mewAssetUrl(path)
}

/** Resolve a token name (case-insensitive) to its SVG path via ui_map.tokens, or null. */
export function mewTokenSrc(token: string): string | null {
  if (!token || !state.tokens) return null
  const key = String(token).toLowerCase()
  const path = state.tokens[key]
  if (!path) return null
  return path.startsWith("http") || path.startsWith("/") ? path : mewAssetUrl(path)
}

/** Resolve any ui_map group entry by group and name, or null. */
export function mewUiSrc(group: string, name: string): string | null {
  if (!group || !name) return null
  let path: string | null | undefined
  if (group === "panels") path = state.panels?.[name]
  else if (group === "slots") path = state.slots?.[name]
  else if (group === "backgrounds") path = state.backgrounds?.[name]
  else if (group === "cursors") path = state.cursors?.[name]
  if (!path) return null
  return path.startsWith("http") || path.startsWith("/") ? path : mewAssetUrl(path)
}

/** Resolve a texture name from media_map.textures, or null. */
export function mewTextureSrc(name: string): string | null {
  if (!name || !state.textures) return null
  const path = state.textures[name]
  if (!path) return null
  return path.startsWith("http") || path.startsWith("/") ? path : mewAssetUrl(path)
}

/** Resolve a cursor from media_map.cursors by key, returning {src, hotspot} or null. */
export function mewCursor(key: string): { src: string; hotspot: [number, number] } | null {
  if (!key || !state.cursorData) return null
  const cursor = state.cursorData[key]
  if (!cursor) return null
  const src = cursor.src.startsWith("http") || cursor.src.startsWith("/")
    ? cursor.src
    : mewAssetUrl(cursor.src)
  return { src, hotspot: cursor.hotspot }
}

/** Resolve SFX from media_map.sfx by key, returning {opus, m4a} URLs or null. */
export function mewSfx(key: string): { opus: string; m4a: string } | null {
  if (!key || !state.sfx) return null
  const sfx = state.sfx[key]
  if (!sfx) return null
  const resolve = (path: string) =>
    path.startsWith("http") || path.startsWith("/")
      ? path
      : mewAssetUrl(path)
  return { opus: resolve(sfx.opus), m4a: resolve(sfx.m4a) }
}

/** Resolve map assets by area name from map_assets.json: {graphic, background, node_icons[]}. */
export function mewMapArt(area: string | undefined): { graphic?: string; background?: string; node_icons?: string[] } | null {
  if (!area || !state.mapAssets) return null
  // map_assets.json is keyed by the SWF symbol name ("Map_Alley"); records
  // reference it via `graphics` or plain area ids ("alley") — try both.
  const asset =
    state.mapAssets[area] ??
    state.mapAssets[`Map_${area.charAt(0).toUpperCase()}${area.slice(1)}`] ??
    Object.entries(state.mapAssets).find(
      ([k]) => k.toLowerCase() === area.toLowerCase() || k.toLowerCase() === `map_${area.toLowerCase()}`
    )?.[1]
  if (!asset) return null
  const resolve = (path: string) =>
    path.startsWith("http") || path.startsWith("/")
      ? path
      : mewAssetUrl(path)
  return {
    graphic: asset.graphic ? resolve(asset.graphic) : undefined,
    background: asset.background ? resolve(asset.background) : undefined,
    node_icons: asset.node_icons?.map(resolve),
  }
}

/** Resolve furniture asset by id from the asset store, or null. */
export function mewFurnitureArt(id: string | undefined): string | null {
  if (!id) return null
  // Furniture PNGs are named by id directly in assets/furniture/
  const path = `assets/furniture/${id}.png`
  return mewAssetUrl(path)
}

/** Resolve portrait by record id/name or by normalized token. Returns portrait path or null. */
export function mewPortraitSrc(recordOrName: string | undefined): string | null {
  if (!recordOrName || !state.portraits) return null
  // Try exact token first (portraits.json keys are already normalized)
  const token = String(recordOrName).toLowerCase()
  const entry = state.portraits[token]
  if (entry?.asset) {
    const path = entry.asset
    return path.startsWith("http") || path.startsWith("/")
      ? path
      : mewAssetUrl(path)
  }
  // Fallback: try common naming patterns if direct lookup fails
  // (in case record id doesn't map to portraits.json key)
  return null
}

/** Resolve class background asset by class name from class_assets.json. */
export function mewClassBg(className: string | undefined): string | null {
  if (!className || !state.classAssets) return null
  const asset = state.classAssets[className]
  if (!asset?.bg) return null
  const path = asset.bg
  return path.startsWith("http") || path.startsWith("/")
    ? path
    : mewAssetUrl(path)
}
