"use client"
import { SpawnInfo } from "../../../_types/spawnInfo"
import { useTranslations } from "next-intl"
import { MapPinIcon } from "lucide-react"
import { RARITY_META } from "../../../_utils/dexMeta"
import { readBiomeKeys, getTranslatedBiomeName, isVisibleBiome } from "@/utils/pokemonTranslations"

export function SpawnTable({ spawns }: { spawns: SpawnInfo[] }) {
  const t = useTranslations("pokedex")

  // A spawn that had biome conditions but has none left after filtering is
  // unreachable on this server - every biome it named is in a disabled
  // dimension or a mod we do not run. Rendering it as "unknown biome" would
  // claim the Pokemon spawns somewhere it does not. Spawns with no biome
  // condition at all are unrestricted and always kept.
  const visibleSpawns = spawns.filter((spawn) => {
    const biomes = readBiomeKeys(spawn.condition)
    return biomes.length === 0 || biomes.some(isVisibleBiome)
  })

  function getRarityMeta(rarity: number) {
    if (rarity < 1) return RARITY_META.legendary
    if (rarity <= 10) return RARITY_META.ultra
    if (rarity <= 100) return RARITY_META.rare
    if (rarity <= 200) return RARITY_META.uncommon
    return RARITY_META.common
  }

  if (visibleSpawns.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center">
        <MapPinIcon className="h-12 w-12 mx-auto text-pk-surface-400 mb-3" />
        <div className="text-xl text-pk-surface-300">{t("spawn_no_appearances")}</div>
        <div className="text-sm text-pk-surface-400 mt-2">{t("spawn_wild_message")}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleSpawns.map((spawn, index) => {
        const meta = getRarityMeta(spawn.rarity)
        const biomas = readBiomeKeys(spawn.condition)
          .filter(isVisibleBiome)
          .map((biome) => ({ biome, translated: getTranslatedBiomeName(biome, t) }))

        const times = spawn.condition?.times?.map((time) => t(`${time.toLowerCase()}`)) || [t("spawn_any_time")]
        const method = spawn.stringLocationTypes?.[0] || t("spawnTable.methodGround")
        const levels = `${spawn.minLevel}-${spawn.maxLevel}`

        return (
          <div
            key={`${spawn.spawnType}-${index}`}
            className="grid grid-cols-[auto_1fr_auto] gap-3.5 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl items-center"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.fg }}
          >
            <div className="w-11 h-11 rounded-[10px] grid place-items-center" style={{ background: "rgba(255,255,255,0.04)", color: meta.fg }}>
              <MapPinIcon className="w-5 h-5" />
            </div>

            <div>
              <div className="font-pk-display font-semibold text-sm text-pk-surface-50 mb-1.5">
                {biomas?.map((b) => b.translated).join(", ") || t("spawn_unknown_biome")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[0.6875rem] text-pk-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">{method}</span>
                <span className="inline-flex items-center gap-1 text-[0.6875rem] text-pk-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">{t("spawnTable.levelRange", { range: levels })}</span>
                <span className="inline-flex items-center gap-1 text-[0.6875rem] text-pk-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">{times.join(", ")}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-pk-mono text-[0.6875rem] text-pk-surface-500">{spawn.rarity}%</div>
              <div className="font-pk-display font-semibold text-[0.8125rem] uppercase tracking-wider" style={{ color: meta.fg }}>
                {t(meta.labelKey)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
