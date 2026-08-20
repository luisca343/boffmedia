"use client"

import { useEffect, type ReactNode } from "react"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { AppQueryProvider as PasaporteQueryProvider } from "@/components/smartrotom/behavior/QueryProvider"
import { TopBar } from "./_components/TopBar"
import { InspectOverlay, ToastHost, VerifyBadge } from "./_components/ui"
import { usePassportStore } from "./_stores/usePassportStore"

/**
 * The Pasaporte's scope root: every `ps-*` token is a CSS var
 * declared on `.ps-app`, so nothing resolves without it — and anything portaled out of it
 * (the replay sheet, the toasts) re-applies it through `ThemedLayer`.
 *
 * FIXED CANVAS. The app deliberately never calls `useRotomMode()`: the desk is always dark
 * and the paper always cream, in every platform theme. A passport is a physical object and
 * its pages do not turn dark because the OS did — the same stance as Furret Today's
 * newsprint and Gobierno's warm paper.
 *
 * The two `data-*` attributes are DOCUMENT properties, not themes — how loud the security
 * print is, and whether the looping ambience runs.
 *
 * The three grid rows are `topbar / stage / controls`; the stage and the controls both come
 * from `{children}` (PassportBook renders them as one fragment) because the page readout,
 * the scrubber and the book share a single flip state.
 */
export default function PasaporteLayout({ children }: { children: ReactNode }) {
  const ornament = usePassportStore((s) => s.ornament)
  const motion = usePassportStore((s) => s.motion)
  const inspect = usePassportStore((s) => s.inspect)
  const initMotion = usePassportStore((s) => s.initMotion)

  const manifest = useSpriteManifestStore((s) => s.manifest)
  const fetchManifest = useSpriteManifestStore((s) => s.fetchManifest)
  const allPokemon = usePokemonStore((s) => s.allPokemon)
  const fetchAllPokemon = usePokemonStore((s) => s.fetchAllPokemon)

  useEffect(() => initMotion(), [initMotion])

  // Both stores back the paper: the manifest resolves every sprite, and the species list is
  // where a Pokémon's TYPES come from — the game server's party payload has none.
  useEffect(() => {
    if (!manifest) void fetchManifest()
  }, [manifest, fetchManifest])

  useEffect(() => {
    if (allPokemon.length === 0) void fetchAllPokemon()
  }, [allPokemon.length, fetchAllPokemon])

  return (
    <div
      className="ps-app grid h-[calc(100dvh_-_3rem)] w-full min-w-0 grid-rows-[auto_1fr_auto] overflow-hidden font-ps"
      data-ornament={ornament}
      data-motion={motion}
    >
      <PasaporteQueryProvider>
        <TopBar />
        {children}
      </PasaporteQueryProvider>

      <InspectOverlay show={inspect} />
      <VerifyBadge show={inspect} />
      <ToastHost />
    </div>
  )
}
