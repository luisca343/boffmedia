"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { usePokemonStore } from "@/stores/pokemonStore"
import type { PCPokemon, ExtendedPokemonW } from "@/types/dto/pc-pokemon.dto"
import type { Pokemon } from "@/types/Pokemon"
import { LEGENDARY_DEX } from "../../pc/_utils/constants"
import { pokemonKey } from "../../pc/_utils/pokemonKey"
import type { WpMon } from "../_types/market.types"
import { ivPct, rarityOf } from "../_utils/rarity"
import { useWpUuid } from "./queries"

/**
 * The seller's own Pokémon — read live from the game server's PC, not from our DB.
 *
 * This is what makes "propiedad verificada" mean something: you can only list a
 * Pokémon that is genuinely sitting in your box right now, and the listing records
 * the `(box, index)` plus the content hash so the server can prove at settlement
 * that it is still the same individual.
 *
 * The PARTY is deliberately excluded. A Pokémon you are walking around with is one
 * you are using, and the two most common ways to lose a sale are selling your lead
 * by accident and having the mon move slot between listing and delivery. Boxes only.
 *
 * `pokemonKey` is imported from the PC app rather than reimplemented — the hash MUST
 * be byte-identical to the one the PC and the server compute, or a listing could
 * never be matched back to its Pokémon.
 */

async function unwrap<T>(
  call: Promise<{ success: boolean; data?: T; message?: string }>,
): Promise<T> {
  const res = await call
  if (!res.success || res.data === undefined) {
    throw new Error(res.message || "No se pudo leer tu PC")
  }
  return res.data
}

/** A box Pokémon, in the shape a listing needs, with its slot address attached. */
export interface PcSlotMon extends WpMon {
  box: number
  index: number
}

/** The valuation formula, mirrored client-side so the sell form can price a mon
 *  before it exists as a listing. Deterministic and identical to the server's
 *  `WigglypopValuationService` — if you change one, change both. */
export function valuate(mon: {
  ivs: number[]
  level: number
  shiny: boolean
  legendary: boolean
  heldItem?: string | null
}): number {
  const pct = ivPct(mon.ivs)
  let base = 1800 + pct * 95 + (mon.level / 100) * 2600
  if (mon.shiny) base *= 4.3
  if (mon.legendary) base *= 3.7
  if (mon.ivs.reduce((a, b) => a + b, 0) === 186) base *= 1.6
  if (mon.heldItem) base += 400
  return Math.round(base / 50) * 50
}

function typesOf(p: ExtendedPokemonW, byDex: Record<number, Pokemon>): string[] {
  if (p.types?.length) return p.types.map((t) => t.toLowerCase())
  const species = byDex[p.dex]
  if (!species?.forms?.length) return []
  const form =
    species.forms.find((f) => f.name?.toLowerCase() === (p.form ?? "").toLowerCase()) ??
    species.forms[0]
  return (form?.types ?? []).map((t) => t.toLowerCase())
}

export function usePcMons() {
  const uuid = useWpUuid()
  const allPokemon = usePokemonStore((s) => s.allPokemon)

  const byDex = useMemo(() => {
    const m: Record<number, Pokemon> = {}
    for (const p of allPokemon) m[p.dex] = p
    return m
  }, [allPokemon])

  const pc = useQuery({
    queryKey: ["wigglypop", "pc", uuid ?? ""],
    queryFn: () => unwrap<PCPokemon[]>(WingullService.getPC(uuid!)),
    enabled: Boolean(uuid),
    // The PC is the seller's inventory. It changes in-game while they browse, so a
    // stale read here means listing a Pokémon that has already moved.
    staleTime: 30_000,
  })

  const mons: PcSlotMon[] = useMemo(() => {
    const out: PcSlotMon[] = []
    for (const entry of pc.data ?? []) {
      const p = entry?.pokemon
      if (!p) continue

      const ivs = Array.isArray(p.ivs) ? p.ivs.map(Number) : []
      const evs = Array.isArray(p.evs) ? p.evs.map(Number) : []
      const stats = Array.isArray(p.stats) ? p.stats.map(Number) : []
      // Pixelmon marks a shiny through the palette, not a boolean.
      const shiny = (p.palette ?? "").toLowerCase() === "shiny"
      // The species payload carries no legendary flag, so we use the PC's existing
      // dex set rather than inventing a second source of truth for it.
      const legendary = LEGENDARY_DEX.has(p.dex)
      const pct = ivPct(ivs)

      out.push({
        pokemonKey: pokemonKey(p),
        box: entry.box,
        index: entry.index,
        dex: p.dex,
        species: p.species,
        name: p.name || p.species,
        form: p.form ?? undefined,
        palette: p.palette ?? undefined,
        level: p.level,
        nature: p.nature ?? "—",
        ability: p.ability ?? "—",
        gender: (p.gender ?? "genderless") as WpMon["gender"],
        heldItem: p.item ?? null,
        shiny,
        legendary,
        types: typesOf(p, byDex),
        ivs,
        evs,
        stats,
        moves: (p.moves ?? []).filter(Boolean) as string[],
        rarity: rarityOf({ legendary, ivPct: pct }),
        ivPct: pct,
        value: valuate({ ivs, level: p.level, shiny, legendary, heldItem: p.item }),
      })
    }
    return out
  }, [pc.data, byDex])

  /** Grouped into boxes, so the picker can tab between them like the PC does. */
  const boxes = useMemo(() => {
    const map = new Map<number, PcSlotMon[]>()
    for (const m of mons) {
      const list = map.get(m.box) ?? []
      list.push(m)
      map.set(m.box, list)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([box, list]) => ({ box, mons: list.sort((a, b) => a.index - b.index) }))
  }, [mons])

  return {
    mons,
    boxes,
    isLoading: pc.isLoading,
    error: (pc.error as Error | null) ?? null,
  }
}
