"use client"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { useTranslations } from "next-intl"
import { getTranslatedBiomeName } from "@/utils/pokemonTranslations"
import { HubSidebar } from "../_components/HubSidebar"
import { TypeChip } from "../_components/TypeChip"
import { MagnifyingGlassIcon, MapIcon } from "@heroicons/react/24/outline"
import { useState, useMemo, useEffect } from "react"

const BIOME_CONFIG: Record<string, { type: string; c: string; glyph: string }> = {
  plains: { type: "grass", c: "#7cb342", glyph: "\u{1F33E}" },
  forest: { type: "grass", c: "#388e3c", glyph: "\u{1F332}" },
  ocean: { type: "water", c: "#2980ef", glyph: "\u{1F30A}" },
  river: { type: "water", c: "#1976d2", glyph: "\u{1FAB8}" },
  swamp: { type: "poison", c: "#5a6b3a", glyph: "\u{1FAB4}" },
  desert: { type: "ground", c: "#d4a35a", glyph: "\u{1F3DC}" },
  mountain: { type: "rock", c: "#7d6b53", glyph: "\u{26F0}" },
  mountains: { type: "rock", c: "#7d6b53", glyph: "\u{26F0}" },
  tundra: { type: "ice", c: "#5dade2", glyph: "\u{2744}" },
  snow: { type: "ice", c: "#5dade2", glyph: "\u{2744}" },
  cave: { type: "rock", c: "#5d4037", glyph: "\u{1F573}" },
  caves: { type: "rock", c: "#5d4037", glyph: "\u{1F573}" },
  nether: { type: "fire", c: "#c0392b", glyph: "\u{1F30B}" },
  volcano: { type: "fire", c: "#c0392b", glyph: "\u{1F30B}" },
  end: { type: "dragon", c: "#5061e1", glyph: "\u{2728}" },
  jungle: { type: "grass", c: "#2e7d32", glyph: "\u{1F343}" },
  savanna: { type: "ground", c: "#a0834a", glyph: "\u{1F992}" },
  beach: { type: "water", c: "#f4d35e", glyph: "\u{1F3D6}" },
  darkforest: { type: "dark", c: "#3a2c4a", glyph: "\u{1F311}" },
  enchanted: { type: "fairy", c: "#b97fcf", glyph: "\u{2728}" },
  thunderplains: { type: "electric", c: "#c79c2e", glyph: "\u{26A1}" },
  ruins: { type: "psychic", c: "#5e548e", glyph: "\u{1F5FF}" },
  ghosttown: { type: "ghost", c: "#4a3d5c", glyph: "\u{1F47B}" },
  flowerforest: { type: "fairy", c: "#e88dc3", glyph: "\u{1F338}" },
  mushroomfields: { type: "grass", c: "#c4783d", glyph: "\u{1F344}" },
  badlands: { type: "ground", c: "#bf6a3a", glyph: "\u{1F3DC}" },
  cherrygrove: { type: "fairy", c: "#e8a0b8", glyph: "\u{1F338}" },
  meadow: { type: "grass", c: "#7cb342", glyph: "\u{1F33B}" },
  lushcaves: { type: "grass", c: "#4caf50", glyph: "\u{1F33F}" },
  dripstonecaves: { type: "rock", c: "#6d5a4a", glyph: "\u{1F573}" },
  deepdark: { type: "dark", c: "#1a1a2e", glyph: "\u{1F47B}" },
  mangroveswamp: { type: "water", c: "#4a6741", glyph: "\u{1F334}" },
  frozenspeaks: { type: "ice", c: "#a8c8e8", glyph: "\u{2744}" },
  stonypeaks: { type: "rock", c: "#8b8b7a", glyph: "\u{26F0}" },
  grove: { type: "ice", c: "#6a9fb5", glyph: "\u{1F332}" },
  snowyslopes: { type: "ice", c: "#b0d4e8", glyph: "\u{2744}" },
  meadow_2: { type: "grass", c: "#7cb342", glyph: "\u{1F33B}" },
  birchforest: { type: "grass", c: "#5a9e3a", glyph: "\u{1F333}" },
  dark_forest: { type: "dark", c: "#3a2c4a", glyph: "\u{1F311}" },
  flower_forest: { type: "fairy", c: "#e88dc3", glyph: "\u{1F338}" },
  mushroom_fields: { type: "grass", c: "#c4783d", glyph: "\u{1F344}" },
  badlands_2: { type: "ground", c: "#bf6a3a", glyph: "\u{1F3DC}" },
  cherry_grove: { type: "fairy", c: "#e8a0b8", glyph: "\u{1F338}" },
  lush_caves: { type: "grass", c: "#4caf50", glyph: "\u{1F33F}" },
  dripstone_caves: { type: "rock", c: "#6d5a4a", glyph: "\u{1F573}" },
  deep_dark: { type: "dark", c: "#1a1a2e", glyph: "\u{1F47B}" },
  mangrove_swamp: { type: "water", c: "#4a6741", glyph: "\u{1F334}" },
  stony_peaks: { type: "rock", c: "#8b8b7a", glyph: "\u{26F0}" },
  snowy_slopes: { type: "ice", c: "#b0d4e8", glyph: "\u{2744}" },
  birch_forest: { type: "grass", c: "#5a9e3a", glyph: "\u{1F333}" },
  old_growth_birch_forest: { type: "grass", c: "#5a9e3a", glyph: "\u{1F333}" },
  old_growth_pine_taiga: { type: "grass", c: "#3e6b2a", glyph: "\u{1F332}" },
  old_growth_spruce_taiga: { type: "grass", c: "#3e6b2a", glyph: "\u{1F332}" },
  sparse_jungle: { type: "grass", c: "#2e7d32", glyph: "\u{1F343}" },
  windswept_hills: { type: "rock", c: "#7d6b53", glyph: "\u{26F0}" },
  windswept_forest: { type: "rock", c: "#6a8a5a", glyph: "\u{26F0}" },
  windswept_gravelly_hills: { type: "rock", c: "#8a8a7a", glyph: "\u{26F0}" },
  windswept_savanna: { type: "ground", c: "#a0834a", glyph: "\u{1F992}" },
  eroded_badlands: { type: "ground", c: "#bf6a3a", glyph: "\u{1F3DC}" },
  bamboo_jungle: { type: "grass", c: "#2e7d32", glyph: "\u{1F38D}" },
  taiga: { type: "grass", c: "#3e6b2a", glyph: "\u{1F332}" },
  sunflower_plains: { type: "grass", c: "#7cb342", glyph: "\u{1F33B}" },
}

function getBiomeConfig(biomeName: string) {
  const key = biomeName.toLowerCase().replace("minecraft:", "").replace(/\s+/g, "_")
  return BIOME_CONFIG[key] || { type: "normal", c: "#677790", glyph: "\u{1F4CD}" }
}

export default function Localizacion() {
  const t = useTranslations("pokedex")
  const [biomes, setBiomes] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    PokemonService.getBiomes().then((res) => {
      setBiomes(
        (res.data || [])
          .filter((b) => !b.name.includes("biomesoplenty") && !b.name.includes("terraforged"))
          .sort((a, b) => b.count - a.count)
      )
      setLoading(false)
    })
  }, [])

  const usedTypes = useMemo(() => {
    const types = new Set(biomes.map((b) => getBiomeConfig(b.name).type))
    return ["all", ...Array.from(types)]
  }, [biomes])

  const filteredBiomes = useMemo(() => {
    return biomes
      .filter((b) => {
        const biomeName = getTranslatedBiomeName(b.name, t)
        const matchesSearch = biomeName.toLowerCase().includes(searchQuery.toLowerCase())
        const config = getBiomeConfig(b.name)
        const matchesType = typeFilter === "all" || config.type === typeFilter
        return matchesSearch && matchesType
      })
  }, [biomes, searchQuery, typeFilter, t])

  const maxCount = Math.max(...biomes.map((b) => b.count), 1)
  const totalSpecies = biomes.reduce((acc, b) => acc + b.count, 0)

  if (loading) {
    return (
      <div className="flex h-full bg-surface-950">
        <HubSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
            <div className="text-surface-100 text-xl font-orbitron">Cargando biomas...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="icon w-5 h-5 rounded bg-primary-400/[0.12] text-primary-300 grid place-items-center">
                  <MapIcon className="w-3 h-3" />
                </span>
                <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
                  03 · Mundo
                </span>
              </div>
              <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50">
                {t("biomes_title")}
              </h1>
              <p className="text-surface-400 text-sm mt-1 max-w-[600px]">
                {biomes.length} biomas catalogados. Cada tarjeta muestra el bioma con su paleta característica, número de especies registrables y proporción frente al máximo.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-surface-400 font-jetbrains">
              <span>
                Biomas<b className="ml-1 text-surface-100">{biomes.length}</b>
              </span>
              <span>
                Especies localizables<b className="ml-1 text-surface-100">{totalSpecies}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 pb-4 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="search"
              placeholder="Buscar bioma..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] py-2.5 pr-3 pl-9 text-[13px] text-surface-50 outline-none placeholder:text-surface-500 focus:border-primary-400/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer border"
              style={
                typeFilter === "all"
                  ? { background: "rgba(249,115,22,0.14)", color: "var(--primary-200)", borderColor: "rgba(249,115,22,0.35)" }
                  : { background: "rgba(255,255,255,0.03)", color: "var(--surface-300)", borderColor: "rgba(255,255,255,0.07)" }
              }
            >
              Todos
            </button>
            {usedTypes.filter((tp) => tp !== "all").map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(typeFilter === tp ? "all" : tp)}
                className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border"
                style={
                  typeFilter === tp
                    ? { background: "rgba(249,115,22,0.14)", color: "var(--primary-200)", borderColor: "rgba(249,115,22,0.35)" }
                    : { background: "rgba(255,255,255,0.03)", color: "var(--surface-300)", borderColor: "rgba(255,255,255,0.07)" }
                }
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: TYPE_COLORS[tp] || "#677790" }}
                />
                {t(`type_${tp}` as any)}
                <span className="font-jetbrains text-[10px] opacity-70">
                  {biomes.filter((b) => getBiomeConfig(b.name).type === tp).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Biomes grid */}
        <div className="flex-1 px-6 pb-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {filteredBiomes.map((biome) => {
              const biomeName = getTranslatedBiomeName(biome.name, t)
              const config = getBiomeConfig(biome.name)
              const isLightBg = ["grass", "ground", "rock", "ice", "fairy", "electric"].includes(config.type)
              const textColor = isLightBg ? "rgba(0,0,0,0.85)" : "#fff"

              return (
                <div
                  key={biome.name}
                  className="relative rounded-xl p-3.5 min-h-[116px] flex flex-col gap-2 cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5 border border-transparent"
                  style={{
                    background: `linear-gradient(135deg, ${config.c}, color-mix(in oklab, ${config.c} 60%, #000))`,
                    borderImage: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0)) 1",
                    color: textColor,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 w-[100px] h-[100px] pointer-events-none"
                    style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12), transparent 60%)" }}
                  />
                  <div className="w-[26px] h-[26px] bg-black/[0.18] rounded-[7px] grid place-items-center text-base">
                    {config.glyph}
                  </div>
                  <div className="font-orbitron font-bold text-base leading-tight tracking-tight mt-auto" style={{ color: textColor }}>
                    {biomeName}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 text-xs" style={{ opacity: 0.9 }}>
                      <b className="font-orbitron font-bold text-lg tabular-nums">{biome.count}</b>
                      <span>Pokémon</span>
                    </div>
                    <TypeChip type={config.type} size="sm" />
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(biome.count / maxCount) * 100}%`, background: "rgba(255,255,255,0.7)" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {filteredBiomes.length === 0 && (
            <div className="p-8 text-center text-surface-400">No se encontraron biomas disponibles</div>
          )}
        </div>
      </main>
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#9fa19f", fire: "#e62829", water: "#2980ef", grass: "#3fa129",
  electric: "#fac000", ice: "#3fd8ff", fighting: "#ff8000", poison: "#9141cb",
  ground: "#d6985c", flying: "#81b9ef", psychic: "#ef4179", bug: "#91a119",
  rock: "#afa981", ghost: "#704170", dragon: "#5061e1", dark: "#50413f",
  steel: "#60a1b8", fairy: "#ef71ef",
}
