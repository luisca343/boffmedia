"use client"

import { useEffect, type ReactNode } from "react"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { usePokemonStore } from "@/stores/pokemonStore"
import { PCQueryProvider } from "./_components/PCQueryProvider"
import { hydratePcUi } from "./_stores/pcUiStore"

/**
 * The PC's scope root (SMARTROTOM_V3.md §2). Every `pc-*` token resolves off
 * `.pc-app`, and `pc-canvas` paints the slate void behind the glass panels.
 *
 * Dark-only: there is no `data-theme`, because the console has one palette and no
 * light skin — like the Pokédex, the Arcade and Misiones, it ignores the platform
 * theme picker's mode (§2b). The box wallpapers are the app's colour, not a theme.
 *
 * The height is pinned explicitly (viewport minus the 3rem Rotom nav) rather than
 * chained up through AppWrapper's flex tree, the same way Taxi and Starbank root
 * themselves — the board is a `min-h-0` flex child, so an unresolved height would
 * collapse the grid.
 */
export default function PCLayout({ children }: { children: ReactNode }) {
  const fetchManifest = useSpriteManifestStore((s) => s.fetchManifest)
  const manifest = useSpriteManifestStore((s) => s.manifest)
  const allPokemon = usePokemonStore((s) => s.allPokemon)
  const fetchAllPokemon = usePokemonStore((s) => s.fetchAllPokemon)

  // Two app-wide datasets the whole board depends on: the sprite manifest resolves
  // every slot's image, and the species list backs type derivation and the Living
  // Dex. Both are fetched once here rather than by ~900 slots individually.
  useEffect(() => {
    if (!manifest) void fetchManifest()
  }, [manifest, fetchManifest])

  useEffect(() => {
    if (allPokemon.length === 0) void fetchAllPokemon()
  }, [allPokemon.length, fetchAllPokemon])

  // Box names, wallpapers and saved views live in localStorage, which does not exist
  // during SSR — reading them in the store initialiser would hydrate-mismatch.
  useEffect(() => {
    hydratePcUi()
  }, [])

  return (
    <PCQueryProvider>
      <div className="pc-app pc-canvas flex h-[calc(100dvh_-_3rem)] w-full min-w-0 flex-col overflow-hidden font-pc text-pc-fg antialiased">
        {children}
      </div>
    </PCQueryProvider>
  )
}
