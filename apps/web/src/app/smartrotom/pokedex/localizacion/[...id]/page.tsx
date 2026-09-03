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
import { ArrowLeftIcon } from "lucide-react"
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
/** A segment that is not valid percent-encoding is already literal - keep it. */
function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
function fmtPct(p: number) {
  return p < 0.01 ? p.toFixed(4) : p.toFixed(2)
}

export default function BiomeDetailPage() {
  // Catch-all, not [id]: two Terralith biomes carry a slash in their id
  // (`terralith:cave/fungal_caves`). A single dynamic segment cannot hold one,
  // and %2F does not survive - Next normalises it back to a separator and
  // redirects, so the slash has to stay a real separator and be rejoined here.
  //
  // useParams() hands back the segments still PERCENT-ENCODED, so `teras:x`
  // arrives as `teras%3Ax`. Left encoded it matches no translation key and the
  // API call re-encodes it to `%253A`, which is why every namespaced biome came
  // back empty. Decode per segment, after the split, never across it.
  const params = useParams<{ id: string | string[] }>()
  const segments = Array.isArray(params.id) ? params.id : params.id ? [params.id] : []
  const biomeId = segments.map(decodeSegment).join("/")
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
        <span className="absolute top-0 right-0 w-[10rem] h-[10rem] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.14),transparent_60%)] pointer-events-none" />
        <Link href="/smartrotom/pokedex/localizacion" className="inline-flex items-center gap-1 text-xs opacity-80 hover:opacity-100 mb-3 relative transition-opacity">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> {t("biome_back")}
        </Link>
        <div className="flex items-center gap-3 relative">
          <span className="w-12 h-12 rounded-xl bg-black/20 grid place-items-center text-2xl" aria-hidden="true">
            {meta.glyph}
          </span>
          <div>
            <h1 className="font-pk-display font-bold text-[1.625rem] tracking-tight leading-none">{getTranslatedBiomeName(biomeId, t)}</h1>
            <span className="text-sm opacity-90 font-pk-mono">{totalCount} {t("biome_localizable_species")}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-pk-surface-300">
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
          <input type="checkbox" checked={hideSeen} onChange={(e) => setHideSeen(e.target.checked)} className="accent-pk-primary-500" /> {t("biome_hide_seen")}
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
          <input type="checkbox" checked={hideCaught} onChange={(e) => setHideCaught(e.target.checked)} className="accent-pk-primary-500" /> {t("biome_hide_caught")}
        </label>
      </div>

      {!pokemon ? (
        <div className="p-8 text-center text-pk-surface-500 text-sm">{t("biome_loading")}</div>
      ) : totalCount === 0 ? (
        <div className="p-8 text-center text-pk-surface-500 text-sm">{t("biome_no_pokemon")}</div>
      ) : (
        groups.map(([biome, spawns]) => {
          const visible = spawns.filter((s) => getVisibility(s.dex, s.form || "base", hideCaught, hideSeen))
          if (!visible.length) return null
          return (
            <div key={biome} className="flex flex-col gap-2.5">
              {groups.length > 1 && <h3 className="font-pk-display font-semibold text-sm text-pk-surface-100">{getTranslatedBiomeName(biome, t)}</h3>}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
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
                      <span className="text-[0.6875rem] font-medium text-pk-surface-200 text-center leading-tight">{s.species}</span>
                      {s.percentage != null && (
                        <span className="font-pk-mono text-[0.65625rem] tabular-nums font-semibold" style={{ color: tier.fg }}>
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
