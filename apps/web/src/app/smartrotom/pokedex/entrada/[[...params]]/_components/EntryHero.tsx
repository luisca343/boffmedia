"use client"

import Link from "next/link"
import type { Pokemon } from "@/types/Pokemon"
import { useTranslations } from "next-intl"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { TypeChip } from "../../../_components/ui"
import { getForm } from "../../../dexUtils"
import { TYPE_COLORS } from "../../../_utils/typeColors"

export function EntryHero({ pokemon, formIndex, formName }: { pokemon: Pokemon; formIndex: number; formName: string }) {
  const t = useTranslations("pokedex")
  const types = (pokemon.forms[formIndex].types || pokemon.forms[0].types) as string[]
  const rank = pokemon.forms[formIndex].rank || pokemon.forms[0].rank
  const type1 = types?.[0]
  const glow = type1 && TYPE_COLORS[type1] ? `${TYPE_COLORS[type1]}2e` : "rgba(255,255,255,.05)"

  return (
    <div
      className="rounded-pk-xl border border-white/[0.06] p-[24px_22px] flex flex-col gap-[18px]"
      style={{ background: `radial-gradient(220px 200px at 50% 30%, ${glow}, transparent 70%), linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0))` }}
    >
      <div className="h-[300px] grid place-items-center relative">
        <div className="absolute w-[240px] h-[24px] bottom-[18px] bg-[radial-gradient(120px_12px_at_50%_50%,rgba(0,0,0,.5),transparent_70%)] blur-[2px]" />
        <div className="absolute top-0 left-0 right-0 flex justify-between px-1.5 py-1 font-pk-mono text-[11px] text-pk-surface-500 tracking-[0.04em]">
          <span>{t("hero.dexNumber", { dex: String(pokemon.dex).padStart(4, "0") })}</span>
          <span>{formName}</span>
        </div>
        <PokemonSprite
          id={pokemon.dex}
          form={formName}
          palette="none"
          width={260}
          height={260}
          pixelated={true}
          showStatus={false}
          hide={true}
          className="relative max-w-[260px] max-h-[260px] drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
          url={pokemon.forms[formIndex].spriteUrl}
        />
      </div>

      <div className="flex justify-center gap-2">
        {types?.map((type) => (
          <TypeChip key={type} type={type} size="lg" />
        ))}
      </div>

      {pokemon.forms.length > 1 && (
        <div>
          <div className="font-pk-mono text-[10px] tracking-[0.12em] uppercase text-pk-surface-400 mb-2 flex items-center gap-2 before:content-[''] before:w-3.5 before:h-px before:bg-current">
            {t("hero.forms")}
          </div>
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-[10px] p-1 flex gap-0.5">
            {pokemon.forms.map((form, idx) => {
              const fFormName = form.name || "base"
              const isCurrent = idx === formIndex
              return (
                <Link
                  key={fFormName}
                  href={`/smartrotom/pokedex/entrada/${pokemon.dex}/${idx + 1}`}
                  aria-pressed={isCurrent}
                  className={`flex-1 text-center text-xs font-medium py-2 px-2.5 rounded-[7px] transition-colors ${
                    isCurrent ? "bg-pk-primary-400/[0.14] text-pk-primary-200" : "text-pk-surface-400 hover:text-pk-surface-100 hover:bg-white/[0.04]"
                  }`}
                >
                  {getForm(fFormName, t) || t("hero.baseForm")}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {rank && (
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-[12px_14px]">
          <div
            className="w-[46px] h-[46px] rounded-xl grid place-items-center font-pk-display font-extrabold text-[22px]"
            style={{ background: "rgba(251,191,36,.15)", color: "#fbbf24", border: "1px solid #fbbf24", boxShadow: "0 0 12px rgba(251,191,36,.2)" }}
          >
            {rank.tier?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <b className="text-[12.5px] text-pk-surface-100 font-semibold">Ficus Ranking</b>
            <span className="text-[11px] text-pk-surface-400">{rank.ranking > 0 ? t("hero.rankingPosition", { rank: rank.ranking }) : t("hero.unranked")}</span>
          </div>
          <div className="font-pk-display font-bold text-[19px] text-pk-surface-50 tabular-nums">{rank.ranking > 0 ? `#${rank.ranking}` : "—"}</div>
        </div>
      )}
    </div>
  )
}
