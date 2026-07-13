import type { ExtendedPokemonW } from "@/types/dto/pc-pokemon.dto"

/**
 * The PC's Pokémon come from the Pixelmon game server and carry **no id**. Their
 * only address is `(box, index)` — which changes the moment one is moved. So
 * anything we want to remember *about* a Pokémon (its favourite flag, its tags)
 * cannot be keyed on position, or it would follow the slot instead of the mon.
 *
 * Instead we key on a content hash of the fields Pixelmon never rewrites:
 * dex, palette, nature, ability and the six IVs. Level, held item, moves, EVs and
 * position are all deliberately excluded — those change in normal play, and the
 * mark has to survive them.
 *
 * Caveat, and it is the honest one: an Ability Capsule or a Bottle Cap can move a
 * Pokémon off its key, which orphans its marks. Two identical clones (same nature,
 * ability and all six IVs) also share one key. Both are rare enough to accept, and
 * neither loses data — the marks simply stop pointing at that individual.
 */

/** cyrb53 — a fast, well-distributed 53-bit string hash. */
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function pokemonKey(p: ExtendedPokemonW): string {
  const ivs = Array.isArray(p.ivs) ? p.ivs.join(",") : ""
  const parts = [p.dex, p.palette ?? "none", p.nature ?? "", p.ability ?? "", ivs]
  return cyrb53(parts.join("|")).toString(36)
}
