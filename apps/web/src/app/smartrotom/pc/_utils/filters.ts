import type { Pokemon } from "@/types/Pokemon"
import type { Mon, PokemonFilter, Sort } from "../_types/pc.types"
import type { PcMarkMap } from "./marks"
import { displayName, hasItem, isLegendary, isShiny, totalIv, typesOf } from "./derive"

/** Does any filter or search term actually narrow anything? */
export function hasAnyFilter(f: PokemonFilter, search: string): boolean {
  if (search.trim().length > 0) return true
  return Object.values(f).some((v) =>
    Array.isArray(v) ? v.length > 0 : v != null && v !== "" && v !== false,
  )
}

interface MatchCtx {
  speciesByDex: Record<number, Pokemon>
  marks: PcMarkMap
}

export function matches(m: Mon, f: PokemonFilter, search: string, ctx: MatchCtx): boolean {
  const p = m.pokemon

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    const hay = `${p.name} ${p.species} ${p.dex} #${p.dex}`.toLowerCase()
    if (!hay.includes(q)) return false
  }

  if (f.types?.length) {
    const mine = typesOf(p, ctx.speciesByDex)
    if (!f.types.some((t) => mine.includes(t))) return false
  }
  if (f.minLevel != null && p.level < f.minLevel) return false
  if (f.maxLevel != null && p.level > f.maxLevel) return false
  if (f.isShiny && !isShiny(p)) return false
  if (f.isLegendary && !isLegendary(p)) return false
  if (f.hasItem && !hasItem(p)) return false
  if (f.gender && (p.gender ?? "genderless").toLowerCase() !== f.gender) return false
  if (f.nature && p.nature !== f.nature) return false
  if (f.ability && p.ability !== f.ability) return false

  // Favourites and tags are ours, not the game's — they come from the marks table.
  const mark = ctx.marks[m.key]
  if (f.isFavorited && !mark?.favorite) return false
  if (f.tag && !mark?.tags?.includes(f.tag)) return false

  return true
}

export function filterMons(
  mons: Mon[],
  f: PokemonFilter,
  search: string,
  ctx: MatchCtx,
): Mon[] {
  return mons.filter((m) => matches(m, f, search, ctx))
}

export function sortMons(mons: Mon[], sort: Sort): Mon[] {
  const dir = sort.dir === "desc" ? -1 : 1
  return [...mons].sort((a, b) => {
    const pa = a.pokemon
    const pb = b.pokemon
    let r = 0
    switch (sort.field) {
      case "level":
        r = pa.level - pb.level
        break
      case "dex":
        r = pa.dex - pb.dex
        break
      case "name":
        r = displayName(pa).localeCompare(displayName(pb))
        break
      case "iv":
        r = totalIv(pa) - totalIv(pb)
        break
      default:
        // "box" — physical order, which is also the natural reading order.
        r = (a.loc.box ?? -1) - (b.loc.box ?? -1) || a.loc.index - b.loc.index
    }
    return r * dir || pa.dex - pb.dex
  })
}
