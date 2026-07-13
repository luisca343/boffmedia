import type { QuestData, Region, TerrainKind } from "../_types"

/**
 * The game has no region entity — the quest API only groups quests under a
 * category name. So the board's "reinos" ARE those categories, and everything
 * the atlas draws for one (its glyph, its terrain, where its pin lands) is
 * derived from the name, deterministically. Nothing here is stored or invented
 * per-region: rename a category on the server and its pin simply moves.
 *
 * They are grouped off each quest's own `category` field rather than the
 * response's `categories`, which the shared model types as `IQuestCategory[]`
 * while the server sends a `{ [name]: questId[] }` map.
 */

/** Cheap, stable string hash — same name always lands on the same slot. */
function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const TERRAINS: TerrainKind[] = ["town", "forest", "city", "mountain", "ruins", "island"]

/**
 * Places on the hand-drawn kingdom (viewBox 1000×680). Every slot but the last
 * sits on the continent the map draws; the island slot is the one out at sea,
 * so it is only ever handed out to a region whose terrain hashed to "island".
 */
const LAND_SLOTS: ReadonlyArray<readonly [number, number]> = [
  [240, 530],
  [360, 380],
  [520, 270],
  [700, 200],
  [830, 420],
  [300, 300],
  [620, 520],
  [450, 560],
  [760, 330],
  [560, 400],
  [400, 470],
  [690, 430],
]
const ISLAND_SLOT: readonly [number, number] = [130, 220]

/** Two letters, the way a cartographer would abbreviate the name. */
function glyphFor(name: string) {
  const words = name.trim().split(/[\s_-]+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function buildRegions(quests: QuestData[]): Region[] {
  const grouped = new Map<string, number[]>()
  for (const quest of quests) {
    const name = quest.category?.trim()
    if (!name) continue
    grouped.set(name, [...(grouped.get(name) ?? []), quest.id])
  }

  const entries = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
  const taken = new Set<number>()

  return entries.map(([name, questIds], index) => {
    const seed = hash(name)
    const terrain = TERRAINS[seed % TERRAINS.length]

    let x: number
    let y: number
    if (terrain === "island") {
      ;[x, y] = ISLAND_SLOT
    } else {
      // Prefer the slot the name hashes to; walk on if two names collide, so no
      // two pins ever stack.
      let slot = seed % LAND_SLOTS.length
      for (let i = 0; i < LAND_SLOTS.length && taken.has(slot); i++) {
        slot = (slot + 1) % LAND_SLOTS.length
      }
      taken.add(slot)
      ;[x, y] = LAND_SLOTS[slot]
      // More regions than the map has slots: nudge the overflow off the pin
      // it would otherwise sit on.
      if (index >= LAND_SLOTS.length) {
        x += ((seed >> 3) % 40) - 20
        y += ((seed >> 7) % 40) - 20
      }
    }

    return { id: name, name, questIds: questIds ?? [], glyph: glyphFor(name), terrain, x, y }
  })
}

export const regionOf = (regions: Region[], category: string) => regions.find((region) => region.id === category)
