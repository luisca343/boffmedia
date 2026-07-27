// `ExtendedPokemonW` is the generated `PokemonW` DTO plus the four fields the game
// server sends but the OpenAPI spec omits (see `types/dto/pc-pokemon.dto.ts`).
// Everything else declared below is a PC-only view model: the server exposes four
// reads and one write (`POST /pc/move`) and no DTO for placement, filters, sorting
// or saved views, so those stay hand-written.
import type { ExtendedPokemonW, PCPokemon } from "@/types/dto/pc-pokemon.dto"

/**
 * Where a Pokémon physically sits. `box: -1` is the in-game party — that is the
 * game server's own convention, and `POST /pc/move` speaks it (see `_hooks/queries.ts`).
 */
export const PARTY_BOX = -1

export type SlotKind = "box" | "party"

export interface SlotLoc {
  kind: SlotKind
  /** Box number 0..29. Absent for the party. */
  box?: number
  index: number
}

/**
 * A Pokémon plus where it is. The whole app passes these around rather than the
 * raw `PCPokemon`, because the party's Pokémon arrive as a bare `PokemonW[]` with
 * no position attached and both have to flow through the same grid, drag layer
 * and detail drawer.
 */
export interface Mon {
  pokemon: ExtendedPokemonW
  loc: SlotLoc
  /** Stable content identity — see `_utils/pokemonKey.ts`. Keys favourites + tags. */
  key: string
}

export interface PokemonFilter {
  types?: string[]
  minLevel?: number
  maxLevel?: number
  isShiny?: boolean
  isLegendary?: boolean
  hasItem?: boolean
  isFavorited?: boolean
  gender?: "male" | "female" | "genderless"
  nature?: string
  ability?: string
  tag?: string
}

export type SortField = "box" | "level" | "dex" | "name" | "iv"
export interface Sort {
  field: SortField
  dir: "asc" | "desc"
}

/** A smart box or a user-saved view — a named, one-click filter. */
export interface SmartView {
  id: string
  /** Built-ins carry a `pc` message key instead; user-saved views carry `name`. */
  nameKey?: string
  name?: string
  icon: string
  /** A `pc-*` text colour class. Literal, never interpolated (SMARTROTOM_V3.md §4). */
  tone: string
  filters?: PokemonFilter
  search?: string
  custom?: boolean
}

export type { ExtendedPokemonW, PCPokemon }
