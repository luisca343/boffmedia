import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ScreenShell } from "../_components/ScreenShell"
import { PageHead, MetaStat } from "../_components/PageHead"
import { resolveBiome } from "../_data/biomes"
import { getTranslatedBiomeName, isVisibleBiome } from "@/utils/pokemonTranslations"
import { MapIcon } from "lucide-react"

export default async function LocalizacionPage() {
  const t = await getTranslations("pokedex")
  const res = await PokemonService.getBiomes()
  const raw = (res.success ? res.data : undefined) ?? []
  const biomes = raw
    .filter((b) => isVisibleBiome(b.name))
    .sort((a, b) => b.count - a.count)
  const total = biomes.reduce((a, b) => a + b.count, 0)
  const max = Math.max(1, ...biomes.map((b) => b.count))

  return (
    <ScreenShell>
      <PageHead
        icon={MapIcon}
        eyebrow={t("localizacion_eyebrow")}
        title={t("localizacion_title")}
        desc={t("localizacion_desc")}
        meta={
          <>
            <MetaStat label={t("localizacion_biomes")} value={biomes.length} />
            <MetaStat label={t("localizacion_localizable_species")} value={total} />
          </>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
        {biomes.map((b) => {
          const m = resolveBiome(b.name)
          return (
            <Link
              key={b.name}
              // A slash in the id (`terralith:cave/fungal_caves`) has to stay a real path
              // separator - %2F gets normalised and redirected - so the route is a
              // catch-all and only the text within each segment is encoded.
              href={`/smartrotom/pokedex/localizacion/${b.name.split("/").map(encodeURIComponent).join("/")}`}
              className="relative rounded-xl p-[14px_16px] min-h-[116px] flex flex-col gap-2 overflow-hidden border border-transparent transition-transform hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${m.color}, color-mix(in oklab, ${m.color} 60%, #000))`, color: m.textLight ? "#fff" : "rgba(0,0,0,.85)" }}
            >
              <span className="absolute top-0 right-0 w-[100px] h-[100px] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.12),transparent_60%)] pointer-events-none" />
              <span className="self-start w-[26px] h-[26px] bg-black/[0.18] rounded-[7px] grid place-items-center text-base relative" aria-hidden="true">
                {m.glyph}
              </span>
              <span className="font-pk-display font-bold text-base leading-tight mt-auto relative">{getTranslatedBiomeName(b.name, t)}</span>
              <div className="flex items-center gap-2.5 relative">
                <span className="flex items-baseline gap-1.5 text-xs opacity-90">
                  <b className="font-pk-display font-bold text-lg tabular-nums">{b.count}</b> {t("localizacion_pokemon")}
                </span>
              </div>
              <div className="h-1 rounded-sm bg-black/25 overflow-hidden relative">
                <div className="h-full bg-white/70" style={{ width: `${(b.count / max) * 100}%` }} />
              </div>
            </Link>
          )
        })}
      </div>

      {biomes.length === 0 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center text-pk-surface-400 text-sm">{t("localizacion_no_biomes")}</div>
      )}
    </ScreenShell>
  )
}
