"use client"

import { useQuery } from "@tanstack/react-query"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import type { Registry } from "@/types/pokedex"

export interface VitrinaEntry {
  dex: number
  form: string
  palette: string
  shiny: boolean
  caughtAt: string | null
  name?: string
}

/**
 * A trainer's collection, read straight from the Pokédex registry — the same rows the
 * Pokédex app shows. Rooker stores nothing about captures; the Vitrina is a *view* of
 * data that already exists, which is why it is correct on day one for every player who
 * has ever caught anything.
 *
 * "Shiny" is not a column: a registry row is shiny when its palette is anything other
 * than `none`. That derivation lives here, once, rather than at each of the four places
 * that care.
 */
export function useVitrina(uuid: string | null | undefined) {
  return useQuery({
    queryKey: ["rooker", "vitrina", uuid],
    queryFn: async () => {
      const res = await PokemonService.getPokedexRegistries(uuid!)
      if (!res.success || !res.data) {
        throw new Error(res.message || "No se pudo cargar la vitrina")
      }
      const entries: VitrinaEntry[] = (res.data as Registry[])
        .filter((r) => Boolean(r.caughtAt))
        .map((r) => ({
          dex: r.pokemonId,
          form: r.formId || "base",
          palette: r.paletteId || "none",
          shiny: Boolean(r.paletteId) && r.paletteId !== "none",
          caughtAt: r.caughtAt ?? null,
        }))
      // Newest capture first: the Vitrina is a trophy case, and the newest trophy is
      // the one worth showing.
      entries.sort((a, b) => (b.caughtAt ?? "").localeCompare(a.caughtAt ?? ""))
      return entries
    },
    enabled: Boolean(uuid),
    staleTime: 60_000,
  })
}
