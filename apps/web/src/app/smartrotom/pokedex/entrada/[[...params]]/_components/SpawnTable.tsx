import { SpawnInfo } from "../../../_types/spawnInfo"
import { useTranslations } from "next-intl"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { RARITY_META } from "../../../_components/dexUtils"

export function SpawnTable({ spawns }: { spawns: SpawnInfo[] }) {
  const t = useTranslations("pokedex")

  function getRarityMeta(rarity: number) {
    if (rarity < 1) return RARITY_META.legendary
    if (rarity <= 10) return RARITY_META.ultra
    if (rarity <= 100) return RARITY_META.rare
    if (rarity <= 200) return RARITY_META.uncommon
    return RARITY_META.common
  }

  if (spawns.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center">
        <MapPinIcon className="h-12 w-12 mx-auto text-surface-400 mb-3" />
        <div className="text-xl text-surface-300">{t("entry_no_spawns")}</div>
        <div className="text-sm text-surface-400 mt-2">{t("entry_no_spawns_desc")}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {spawns.map((spawn, index) => {
        const meta = getRarityMeta(spawn.rarity)
        const biomas = spawn.condition?.stringBiomes
          ?.filter((biome) => !biome.includes("biomesoplenty") && !biome.includes("terraforged"))
          .map((biome) => ({
            biome,
            translated: t(`${biome.replace(" ", "_").replace(":", "_")}`),
          }))

        const times = spawn.condition?.times?.map((time) => t(`${time.toLowerCase()}`)) || [t("anytime")]
        const method = spawn.stringLocationTypes?.[0] || "Tierra"
        const levels = `${spawn.minLevel}-${spawn.maxLevel}`
        const height = spawn.condition?.minY ? `y > ${spawn.condition.minY}` : null

        return (
          <div
            key={`${spawn.spawnType}-${index}`}
            className="grid grid-cols-[auto_1fr_auto] gap-3.5 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl items-center"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.fg }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-[10px] grid place-items-center"
              style={{ background: "rgba(255,255,255,0.04)", color: meta.fg }}
            >
              <MapPinIcon className="w-5 h-5" />
            </div>

            {/* Biome + chips */}
            <div>
              <div className="font-orbitron font-semibold text-sm text-surface-50 mb-1.5">
                {biomas?.map((b) => b.translated).join(", ") || t("unknown_biome")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">
                  {method}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">
                  Nv. {levels}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">
                  {times.join(", ")}
                </span>
                {height && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-surface-300 bg-white/[0.04] px-2 py-0.5 rounded">
                    {height}
                  </span>
                )}
              </div>
            </div>

            {/* Rarity */}
            <div className="text-right">
              <div className="font-jetbrains text-[11px] text-surface-500">{spawn.rarity}%</div>
              <div
                className="font-orbitron font-semibold text-[13px] uppercase tracking-wider"
                style={{ color: meta.fg }}
              >
                {t(meta.label as any)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
