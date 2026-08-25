import { ASSET, staticAsset } from '@/lib/assets';
// Mewgenics real-art singleton. The codex store fills this once the sprite/icon
// maps load; MewTile reads it to render a real SVG when one exists (else the hue
// monogram fallback). Kept dependency-free so the showcase — which never loads
// the store — bundles it without pulling the fetch layer.

interface MewArtState {
  /** character id → sprite svg path (single representative frame) */
  sprites: Record<string, string>
  /** category → id → icon svg path (abilities · passives · items) */
  icons: Record<string, Record<string, string>>
}

const state: MewArtState = { sprites: {}, icons: {} }

export function setMewArt(next: Partial<MewArtState>) {
  if (next.sprites) state.sprites = next.sprites
  if (next.icons) state.icons = next.icons
}

/** A record may carry its own art path: `sprite` (characters), `icon` (items/
 *  passives/abilities). Both point to files that exist on disk. */
interface ArtRec {
  id?: string
  icon?: string | null
  sprite?: string | null
}

/** Resolve a same-origin SVG url for a record, or null → monogram fallback. */
export function mewArtSrc(cat: string, rec: ArtRec | null | undefined): string | null {
  if (!rec) return null
  const id = rec.id
  let path: string | null | undefined
  if (cat === "characters") path = rec.sprite || (id ? state.sprites[id] : undefined)
  else if (cat === "items" || cat === "passives") path = rec.icon || (id ? state.icons[cat]?.[id] : undefined)
  else if (cat === "abilities") path = rec.icon || (id ? state.icons.abilities?.[id] : undefined)
  if (!path) return null
  return path.startsWith("http") || path.startsWith("/") ? path : staticAsset(ASSET.boffmedia.tools.mewgenics, path)
}
