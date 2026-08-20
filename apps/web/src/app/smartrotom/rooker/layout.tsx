"use client"

import { useEffect, type ReactNode } from "react"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"
import { RookerQueryProvider } from "./_components/RookerQueryProvider"
import { RookerShell } from "./_components/RookerShell"
import { ToastHost } from "./_components/ui"
import { hydrateDisplay, useDisplayStore } from "./_stores/displayStore"
import { displayVars, resolveCanvas } from "./_utils/display"

/**
 * Rooker's scope root. Every `rk-*` token resolves off `.rk-app`.
 *
 * `data-theme` carries the *canvas*, which is derived, not stored: the platform picker
 * decides light vs dark and the reader only chooses which of the two darks. The
 * accent and the body face ride on inline CSS vars rather than classes, because they
 * are runtime values — a `bg-rk-${accent}` class would never compile.
 *
 * `data-density` and `data-cards` are the two Pantalla knobs the post card reads.
 *
 * The height is pinned explicitly (viewport minus the 3rem Rotom nav) rather than
 * chained up through AppWrapper's flex tree, the same way Taxi, PC and Starbank root
 * themselves — the three columns are `overflow-y: auto` children, so an unresolved
 * height would collapse them.
 */
export default function RookerLayout({ children }: { children: ReactNode }) {
  const mode = useRotomMode()
  const display = useDisplayStore()
  const canvas = resolveCanvas(mode, display.darkness)

  const manifest = useSpriteManifestStore((s) => s.manifest)
  const fetchManifest = useSpriteManifestStore((s) => s.fetchManifest)
  const allPokemon = usePokemonStore((s) => s.allPokemon)
  const fetchAllPokemon = usePokemonStore((s) => s.fetchAllPokemon)

  // Preferences live in localStorage, which does not exist during SSR.
  useEffect(() => {
    hydrateDisplay()
  }, [])

  // Two app-wide datasets: the manifest resolves every capture sprite and Vitrina tile,
  // and the species list turns a `pokemonId` into a name. Both fetched once here rather
  // than by each of the hundreds of sprites individually.
  useEffect(() => {
    if (!manifest) void fetchManifest()
  }, [manifest, fetchManifest])

  useEffect(() => {
    if (allPokemon.length === 0) void fetchAllPokemon()
  }, [allPokemon.length, fetchAllPokemon])

  return (
    <RookerQueryProvider>
      <div
        className="rk-app flex h-[calc(100dvh_-_3rem)] w-full min-w-0 flex-col overflow-hidden bg-rk-bg font-rk text-rk-fg antialiased"
        data-theme={canvas}
        data-density={display.density}
        data-cards={display.cardStyle}
        style={displayVars(display)}
      >
        <RookerShell>{children}</RookerShell>
        <ToastHost />
      </div>
    </RookerQueryProvider>
  )
}
