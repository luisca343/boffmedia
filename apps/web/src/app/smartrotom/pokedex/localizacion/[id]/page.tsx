"use client"
import { PossibleSpawnsSection } from "../../_components/PossibleSpawns"
import { useState, use } from "react"
import { Switch } from "@/components/ui/primitives/switch"
import { Label } from "@/components/ui/primitives/label"
import { useTranslations } from "next-intl"
import { useGetPokemonByBiome } from "@/hooks/pokemon/useGetPokemonByBiome"
import { AdjustmentsHorizontalIcon, EyeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { InternalLink } from "@/components/ui/navigation/Link"
import { HubSidebar } from "../../_components/HubSidebar"

export default function Localizacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { pokemon } = useGetPokemonByBiome(id)
  const [showCaught, setShowCaught] = useState(false)
  const [showSeen, setShowSeen] = useState(false)
  const t = useTranslations("pokedex")

  if (!pokemon) {
    return (
      <div className="flex h-full bg-surface-950">
        <HubSidebar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-surface-300 text-xl">No se encontraron datos para este bioma</div>
          <InternalLink href="/smartrotom/pokedex/localizacion" className="text-primary-400 hover:text-primary-300 flex items-center gap-1">
            <ArrowLeftIcon className="h-4 w-4" /> Volver a biomas
          </InternalLink>
        </main>
      </div>
    )
  }

  const formatBiomeTitle = (rawBiome: string) => {
    return t(rawBiome.replace(":", "_").replace("%3A", "_").replace("%20", "_")) || rawBiome.replace(/:/g, " ").replace(/%3A/g, " ").replace(/%20/g, " ")
  }

  const biomeTitle = formatBiomeTitle(id)

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        <div className="p-6 pb-4 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <InternalLink href="/smartrotom/pokedex/localizacion" className="text-surface-400 hover:text-primary-300 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </InternalLink>
            <div>
              <div className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500 mb-1">Bioma</div>
              <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50">{biomeTitle}</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-[10px]">
            <AdjustmentsHorizontalIcon className="w-[18px] h-[18px] text-primary-300" />
            <span className="text-xs text-surface-200 font-medium">Filtros</span>
            <div className="flex gap-4 ml-auto">
              <div className="flex items-center gap-2">
                <Switch id="show-seen" checked={showSeen} onCheckedChange={setShowSeen} />
                <Label htmlFor="show-seen" className="text-surface-50 flex items-center gap-1 text-xs">
                  <EyeIcon className="h-3.5 w-3.5" /> Avistados
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="show-caught" checked={showCaught} onCheckedChange={setShowCaught} />
                <Label htmlFor="show-caught" className="text-surface-50 flex items-center gap-1 text-xs">
                  <img src="/smartrotom/img/apps/pokedex/capturado.webp" alt="Capturado" className="h-3.5 w-3.5" /> Atrapados
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Object.entries(pokemon).map(([biome, spawn], index) => (
              <div key={index} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5">
                <PossibleSpawnsSection pokemonSpawns={spawn} hideCaught={showCaught} hideSeen={showSeen} title={formatBiomeTitle(biome)} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
