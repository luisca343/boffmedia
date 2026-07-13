/**
 * A "mark" is what *we* remember about a Pokémon that the game server does not:
 * whether it is a favourite, and any tags on it. It is stored in our own
 * `rotom_pc_marks` table, keyed by the content hash from `pokemonKey.ts` — never
 * by box/index, which moves.
 */
export interface PcMarkState {
  favorite: boolean
  tags: string[]
}

/** Marks indexed by `pokemonKey`, the shape every consumer actually wants. */
export type PcMarkMap = Record<string, PcMarkState>

export const EMPTY_MARK: PcMarkState = { favorite: false, tags: [] }

/** The tags we suggest. Users can type any other. */
export const SUGGESTED_TAGS = [
  "Competitivo",
  "Cría",
  "Venta",
  "Living Dex",
  "Shiny Hunt",
  "Evento",
]

export function markOf(marks: PcMarkMap, key: string): PcMarkState {
  return marks[key] ?? EMPTY_MARK
}

/** Every tag actually in use, for the filter panel's tag list. */
export function allTags(marks: PcMarkMap): string[] {
  const seen = new Set<string>()
  for (const m of Object.values(marks)) for (const t of m.tags) seen.add(t)
  return [...seen].sort((a, b) => a.localeCompare(b))
}
