"use client"
import { useState } from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { useGetPokemonByBiome } from "@/hooks/pokemon/useGetPokemonByBiome"
import { usePokedexData } from "@/hooks/usePokedexData"
import { PokedexStatus } from "../../dexUtils"
import { getSpriteUrl } from "@/utils/spriteUtils"
import { ScreenShell } from "../../_components/ScreenShell"
import { StatusPill } from "../../_components/ui"
import { RARITY_META } from "../../_utils/dexMeta"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import { getTranslatedBiomeName } from "@/utils/pokemonTranslations"
import { resolveBiome } from "../../_data/biomes"

function classifyRarity(p: number) {
  if (p <= 0.001) return "legendary"
  if (p <= 0.1) return "ultra"
  if (p <= 0.5) return "rare"
  if (p <= 2) return "uncommon"
  return "common"
}
function statusKey(s: PokedexStatus) {
  return s === PokedexStatus.CAUGHT ? "caught" : s === PokedexStatus.SHINY ? "shiny" : s === PokedexStatus.SEEN ? "seen" : "unknown"
}
function fmtPct(p: number) {
  return p < 0.01 ? p.toFixed(4) : p.toFixed(2)
}

export default function BiomeDetailPage() {
  const params = useParams<{ id: string }>()
  const biomeId = decodeURIComponent(params.id)
  const t = useTranslations("pokedex")
  const { pokemon } = useGetPokemonByBiome(biomeId)
  const { getPokemonStatus, getVisibility } = usePokedexData()
  const [hideSeen, setHideSeen] = useState(false)
  const [hideCaught, setHideCaught] = useState(false)
  const meta = resolveBiome(biomeId)

  const groups = pokemon ? Object.entries(pokemon as Record<string, any[]>) : []
  const totalCount = groups.reduce((a, [, s]) => a + s.length, 0)

  return (
    <ScreenShell>
      <div
        className="relative rounded-xl overflow-hidden border border-white/[0.06] p-6"
        style={{ background: `linear-gradient(135deg, ${meta.color}, color-mix(in oklab, ${meta.color} 55%, #000))`, color: meta.textLight ? "#fff" : "rgba(0,0,0,.85)" }}
      >
        <span className="absolute top-0 right-0 w-[160px] h-[160px] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.14),transparent_60%)] pointer-events-none" />
        <Link href="/smartrotom/pokedex/localizacion" className="inline-flex items-center gap-1 text-xs opacity-80 hover:opacity-100 mb-3 relative transition-opacity">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Biomas
        </Link>
        <div className="flex items-center gap-3 relative">
          <span className="w-12 h-12 rounded-xl bg-black/20 grid place-items-center text-2xl" aria-hidden="true">
            {meta.glyph}
          </span>
          <div>
            <h1 className="font-pk-display font-bold text-[26px] tracking-tight leading-none">{getTranslatedBiomeName(biomeId, t)}</h1>
            <span className="text-sm opacity-90 font-pk-mono">{totalCount} especies localizables</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-pk-surface-300">
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
          <input type="checkbox" checked={hideSeen} onChange={(e) => setHideSeen(e.target.checked)} className="accent-pk-primary-500" /> Ocultar avistados
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
          <input type="checkbox" checked={hideCaught} onChange={(e) => setHideCaught(e.target.checked)} className="accent-pk-primary-500" /> Ocultar atrapados
        </label>
      </div>

      {!pokemon ? (
        <div className="p-8 text-center text-pk-surface-500 text-sm">Cargando…</div>
      ) : totalCount === 0 ? (
        <div className="p-8 text-center text-pk-surface-500 text-sm">No se encontraron Pokémon en este bioma.</div>
      ) : (
        groups.map(([biome, spawns]) => {
          const visible = spawns.filter((s) => getVisibility(s.dex, s.form || "base", hideCaught, hideSeen))
          if (!visible.length) return null
          return (
            <div key={biome} className="flex flex-col gap-2.5">
              {groups.length > 1 && <h3 className="font-pk-display font-semibold text-sm text-pk-surface-100">{getTranslatedBiomeName(biome, t)}</h3>}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
                {visible.map((s, i) => {
                  const tier = RARITY_META[classifyRarity(s.percentage ?? 100)]
                  const spriteUrl = getSpriteUrl({ id: s.dex, form: s.form || "base", palette: s.palette || "none" })
                  const status = statusKey(getPokemonStatus(s.dex, s.form || "base"))
                  return (
                    <Link
                      key={`${s.dex}-${s.form}-${i}`}
                      href={`/smartrotom/pokedex/entrada/${s.dex}/${s.form || "base"}`}
                      className="relative bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-2.5 flex flex-col items-center gap-1 hover:border-pk-primary-400/30 transition-colors"
                    >
                      <span className="absolute top-1.5 left-1.5">
                        <StatusPill status={status} size="sm" showLabel={false} />
                      </span>
                      {spriteUrl && (
                        <Image src={spriteUrl} alt={s.species || ""} width={52} height={52} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.3))" }} />
                      )}
                      <span className="text-[11px] font-medium text-pk-surface-200 text-center leading-tight">{s.species}</span>
                      {s.percentage != null && (
                        <span className="font-pk-mono text-[10.5px] tabular-nums font-semibold" style={{ color: tier.fg }}>
                          {fmtPct(s.percentage)}%
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </ScreenShell>
  )
}
