import type { ArmorPiece } from "../types"

export const ARMOR_ORDER = ["head", "chest", "arms", "waist", "legs"]

export type ArmorVariant = "α" | "β" | "γ" | null

export interface ArmorSetGroup {
  key: string
  name: string
  rank: string
  rarity: number
  variant: ArmorVariant
  pieces: ArmorPiece[]
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
}

export function armorVariant(name: string): ArmorVariant {
  const match = name.match(/(?:^|[\s-])([αβγ]|alpha|alfa|beta|gamma)(?:$|[\s-])/iu)
  if (!match) return null
  const value = match[1].toLocaleLowerCase()
  if (value === "α" || value === "alpha" || value === "alfa") return "α"
  if (value === "β" || value === "beta") return "β"
  return "γ"
}

function pieceOrder(kind: string): number {
  const index = ARMOR_ORDER.indexOf(kind)
  return index === -1 ? ARMOR_ORDER.length : index
}

/**
 * Group by the complete set identity, not only the numeric id.
 *
 * The MHDB payload normally gives alpha/beta/gamma sets different ids, but
 * older cached payloads and translated payloads have not always done that.
 * Including the localized set name keeps variants separate in either case.
 */
export function groupArmor(armor: ArmorPiece[]): ArmorSetGroup[] {
  const groups = new Map<string, ArmorSetGroup>()

  for (const piece of armor) {
    // `armorSet.id` is the import/database id and can move when MHDB rebuilds
    // its catalog. The API's gameId is the stable identity used by the local
    // asset manifest, so use it for grouping whenever the enriched response
    // provides it and retain the old id only for backwards-compatible caches.
    const setId = piece.armorSet?.gameId ?? piece.armorSet?.id ?? `piece:${piece.id}`
    const name = piece.armorSet?.name?.trim() || piece.name.trim()
    const identity = normalizeIdentity(name)
    const key = `${setId}:${piece.rank}:${identity}`
    const group = groups.get(key)

    if (group) {
      group.pieces.push(piece)
      group.rarity = Math.max(group.rarity, piece.rarity)
      continue
    }

    groups.set(key, {
      key,
      name,
      rank: piece.rank,
      rarity: piece.rarity,
      variant: armorVariant(name),
      pieces: [piece],
    })
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      pieces: [...group.pieces].sort(
        (a, b) => pieceOrder(a.kind) - pieceOrder(b.kind),
      ),
    }))
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.rank.localeCompare(b.rank) ||
        a.key.localeCompare(b.key),
    )
}
