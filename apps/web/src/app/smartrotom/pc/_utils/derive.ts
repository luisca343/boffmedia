import type { ExtendedPokemonW } from "@/types/dto/pc-pokemon.dto"
import type { Pokemon } from "@/types/Pokemon"
import { LEGENDARY_DEX, NO_ITEM, STAT_KEYS, type StatKey } from "./constants"

/**
 * Everything the UI shows that the game server does not literally send.
 *
 * The Pixelmon payload (`PokemonW`) is deliberately thin: dex, species, form,
 * palette, name, level, nature, ability, item, moves, ivs, evs, stats. There is no
 * `shiny` boolean, no `legendary` flag, no `hasItem`, and often no `types`. Every
 * one of those is derived here, in one place, so no component invents its own rule.
 */

/** Shiny is a palette, not a flag. */
export const isShiny = (p: ExtendedPokemonW) => p.palette === "shiny"

/** Pixelmon sends `item.minecraft.air` for an empty hand, not an empty string. */
export const hasItem = (p: ExtendedPokemonW) => !!p.item && !NO_ITEM.includes(p.item)

export const isLegendary = (p: ExtendedPokemonW) => LEGENDARY_DEX.has(p.dex)

/**
 * `name` IS the nickname — the game server overwrites it with the species name
 * when the Pokémon is unnamed, so there is no separate field to fall back to.
 */
export const displayName = (p: ExtendedPokemonW) => p.name || p.species

/** True only when the trainer actually renamed it. */
export const isNicknamed = (p: ExtendedPokemonW) =>
  !!p.name && p.name.toLowerCase() !== p.species.toLowerCase()

export const genderOf = (p: ExtendedPokemonW): "male" | "female" | "genderless" => {
  const g = (p.gender ?? "").toLowerCase()
  if (g === "male") return "male"
  if (g === "female") return "female"
  return "genderless"
}

/** 6 IVs × 31 = 186. */
export const totalIv = (p: ExtendedPokemonW) =>
  (p.ivs ?? []).reduce((a, b) => a + (b ?? 0), 0)
export const ivPct = (p: ExtendedPokemonW) => Math.round((totalIv(p) / 186) * 100)

/** Base stat total, from the six live stats the server computed. */
export const statTotal = (p: ExtendedPokemonW) =>
  (p.stats ?? []).reduce((a, b) => a + (b ?? 0), 0)

/** Index the flat six-element arrays by name instead of by position. */
export const statAt = (arr: number[] | undefined, k: StatKey) =>
  arr?.[STAT_KEYS.indexOf(k)] ?? 0

/** Party members carry live HP; PC Pokémon do not (they are always at full). */
export const hpPct = (p: ExtendedPokemonW) => {
  const max = statAt(p.stats, "hp")
  if (!max) return 1
  if (typeof p.hp !== "number") return 1
  return Math.max(0, Math.min(1, p.hp / max))
}

export const isFainted = (p: ExtendedPokemonW) =>
  p.status?.toLowerCase() === "fainted" || (typeof p.hp === "number" && p.hp <= 0)

/** Generation from the national dex number. */
export function genOf(dex: number): number {
  if (dex <= 151) return 1
  if (dex <= 251) return 2
  if (dex <= 386) return 3
  if (dex <= 493) return 4
  if (dex <= 649) return 5
  if (dex <= 721) return 6
  if (dex <= 809) return 7
  if (dex <= 905) return 8
  return 9
}

/**
 * Types. The game payload *sometimes* carries them; when it does not, they are
 * looked up on the species' form in the Pokédex store — which is real data we
 * already fetch. Never guessed.
 */
export function typesOf(
  p: ExtendedPokemonW,
  speciesByDex: Record<number, Pokemon> | undefined,
): string[] {
  if (p.types?.length) return p.types.map((t) => t.toLowerCase())
  const species = speciesByDex?.[p.dex]
  if (!species?.forms?.length) return []
  const form =
    species.forms.find((f) => f.name?.toLowerCase() === (p.form ?? "").toLowerCase()) ??
    species.forms[0]
  return (form?.types ?? []).map((t) => t.toLowerCase())
}

/** Pixelmon ships translation-key-ish strings ("item.pixelmon.leftovers"). */
export function prettyItem(item: string): string {
  const leaf = item.split(".").pop() ?? item
  return leaf.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * `moves` is typed `(string | null)[]` but the live payload has been observed
 * sending move *objects* on some entries. Normalise to a name string either way,
 * so nothing downstream renders "[object Object]".
 */
export function moveName(move: unknown): string | null {
  if (!move) return null
  if (typeof move === "string") return move
  if (typeof move === "object" && "name" in (move as Record<string, unknown>)) {
    const n = (move as { name?: unknown }).name
    return typeof n === "string" ? n : null
  }
  return null
}
