"use client"

import type { Abilities, Pokemon } from "@/types/Pokemon"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { StarIcon, SparklesIcon } from "lucide-react"
import { PokedexStatus } from "../../../dexUtils"
import { usePokedexData } from "@/hooks/usePokedexData"

function SubHead({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h2 className="flex items-center gap-2.5 font-pk-display font-bold text-[1.0625rem] tracking-tight text-pk-surface-50 m-0">
        <span className="font-pk-mono text-[0.625rem] tracking-[0.12em] text-pk-surface-500">{num}</span>
        {title}
      </h2>
    </div>
  )
}

// The right column of the info grid: Descripción · Datos · Habilidades.
export function BasicInfo({ pokemon, formIndex, formName }: { pokemon: Pokemon; formIndex: number; formName: string }) {
  const t = useTranslations("pokedex")
  const { getPokemonStatus } = usePokedexData()
  const isVisible = getPokemonStatus(pokemon.dex, formName) !== PokedexStatus.UNSEEN
  const description = isVisible ? t(`pixelmon_${pokemon.name.toLowerCase()}_description`) : t("unknown_description")
  const abilities = (pokemon.forms[formIndex].abilities || pokemon.forms[0].abilities) as Abilities

  const height = pokemon.forms[formIndex].dimensions?.height || pokemon.forms[0]?.dimensions?.height
  const catchRate = pokemon.forms[formIndex].catchRate ?? pokemon.forms[0]?.catchRate
  const baseExp = pokemon.forms[formIndex].spawn?.baseExp ?? pokemon.forms[0]?.spawn?.baseExp

  const facts = [
    { label: t("info_height"), value: height ? `${height}` : "—", unit: "m" },
    { label: t("info_weight"), value: pokemon.forms[formIndex].weight || pokemon.forms[0]?.weight || "—", unit: "kg" },
    { label: t("info_catch_rate"), value: catchRate !== undefined ? `${catchRate}` : "—", unit: "/255" },
    { label: t("info_base_exp"), value: baseExp !== undefined ? `${baseExp}` : "—", unit: "" },
  ]

  const renderAbility = (ability: string, hidden: boolean) => {
    const key = ability.replace(/\s+/g, "")
    return (
      <Link
        key={ability}
        href={`/smartrotom/pokedex/habilidades/${ability}`}
        className={`rounded-xl p-[14px_16px] text-left w-full transition-all border ${
          hidden
            ? "bg-pk-accent-500/[0.04] border-pk-accent-400/20 hover:border-pk-accent-400/45 hover:bg-pk-accent-500/[0.08]"
            : "bg-white/[0.02] border-white/[0.05] hover:border-pk-primary-400/30 hover:bg-pk-primary-400/[0.04]"
        }`}
      >
        <div className={`inline-flex items-center gap-1 font-pk-mono text-[0.59375rem] tracking-[0.1em] uppercase mb-1.5 ${hidden ? "text-pk-accent-400" : "text-pk-surface-500"}`}>
          {hidden ? <SparklesIcon className="w-[0.6875rem] h-[0.6875rem]" /> : <StarIcon className="w-[0.6875rem] h-[0.6875rem]" />}
          {hidden ? t("info_hidden_ability") : t("info_standard_ability")}
        </div>
        <div className="text-[0.9375rem] font-semibold text-pk-surface-50 mb-1">{t(`ability_${key}`)}</div>
        <div className="text-[0.78125rem] leading-[1.5] text-pk-surface-300">{t(`ability_${key}_description`)}</div>
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-[1.375rem]">
      <div>
        <SubHead num="01" title={t("info_description")} />
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-[18px_22px] relative">
          <span className="absolute -top-1.5 left-3.5 font-pk-display text-[3.5rem] text-pk-primary-500 opacity-25 leading-none select-none">&ldquo;</span>
          <p className="m-0 text-[0.9375rem] leading-[1.65] text-pk-surface-100 font-normal relative z-10">{description}</p>
        </div>
      </div>

      <div>
        <SubHead num="·" title={t("info_data")} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-white/[0.02] border border-white/[0.05] rounded-[10px] p-[12px_14px]">
              <div className="font-pk-mono text-[0.625rem] tracking-[0.1em] uppercase text-pk-surface-500 mb-1.5">{fact.label}</div>
              <div className="text-lg font-semibold text-pk-surface-50 tabular-nums flex items-baseline gap-1">
                <span className="font-bold">{fact.value}</span>
                {fact.unit && <span className="text-xs text-pk-surface-400 font-medium">{fact.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubHead num="·" title={t("info_abilities")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {abilities?.abilities?.map((ability: string) => renderAbility(ability, false))}
          {abilities?.hiddenAbilities?.map((ability: string) => renderAbility(ability, true))}
        </div>
      </div>
    </div>
  )
}
