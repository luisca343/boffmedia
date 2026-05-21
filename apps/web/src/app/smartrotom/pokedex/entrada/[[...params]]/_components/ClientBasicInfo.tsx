"use client"

import type { Abilities, Pokemon } from "@/types/Pokemon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { TypeChip } from "../../../_components/TypeChip"
import { useTranslations } from "next-intl"
import { StarIcon } from "@heroicons/react/24/outline"
import { getDisplayStatus, getForm } from "../../../dexUtils"
import AbilityDataElement from "../../../habilidades/_components/AbilityData"
import { InternalLink } from "@/components/ui/navigation/Link"

interface BasicInfoProps {
  pokemon: Pokemon
  formIndex: number
  formName: string
  pokemonIndex: number
}

export function BasicInfo({ pokemon, formIndex, formName, pokemonIndex }: BasicInfoProps) {
  const t = useTranslations("pokedex")
  const isVisible = getDisplayStatus(pokemon.dex, formName, true)
  const types = (pokemon.forms[formIndex].types || pokemon.forms[0].types) as string[]
  const description = isVisible ? t(`pixelmon_${pokemon.name.toLowerCase()}_description`) : t("unknown_description")
  const rank = pokemon.forms[formIndex].rank || pokemon.forms[0].rank
  const abilities = (pokemon.forms[formIndex].abilities || pokemon.forms[0].abilities) as Abilities

  const height = pokemon.forms[formIndex].dimensions?.height || pokemon.forms[0]?.dimensions?.height
  const catchRate = pokemon.forms[formIndex].catchRate ?? pokemon.forms[0]?.catchRate
  const baseExp = pokemon.forms[formIndex].spawn?.baseExp ?? pokemon.forms[0]?.spawn?.baseExp

  const facts = [
    { label: t("entry_height"), value: height ? `${height}` : "—", unit: "m" },
    { label: t("entry_weight"), value: pokemon.forms[formIndex].weight || pokemon.forms[0]?.weight || "—", unit: "kg" },
    { label: t("entry_capture_rate"), value: catchRate !== undefined ? `${catchRate}` : "—", unit: "/255" },
    { label: t("entry_base_exp"), value: baseExp !== undefined ? `${baseExp}` : "—", unit: "" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-7 items-start">
      {/* Hero portrait card */}
      <div
        className="rounded-[20px] border border-white/[0.06] p-6 flex flex-col gap-[18px] overflow-hidden"
        style={{
          background: `radial-gradient(220px 200px at 50% 30%, var(--type-glow, rgba(255,255,255,0.05)), transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))`,
          ["--type-glow" as any]: types?.[0] ? `rgba(var(--type-${types[0]}),0.15)` : undefined,
        }}
      >
        {/* Portrait */}
        <div className="h-[300px] grid place-items-center relative">
          <div className="absolute bottom-[18px] w-[240px] h-[24px] bg-[radial-gradient(120px_12px_at_50%_50%,rgba(0,0,0,0.5),transparent_70%)] blur-[2px]" />
          <div className="absolute top-0 left-0 right-0 flex justify-between px-1.5 py-1 font-jetbrains text-[11px] text-surface-500 tracking-wider">
            <span>#{String(pokemon.dex).padStart(3, "0")}</span>
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
            className="relative drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
            url={pokemon.forms[formIndex].spriteUrl}
          />
        </div>

        {/* Types */}
        <div className="flex justify-center gap-2">
          {types?.map((type) => (
            <TypeChip key={type} type={type} size="md" />
          ))}
        </div>

        {/* Form switcher */}
        {pokemon.forms.length > 1 && (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-[10px] p-1 flex gap-0.5">
            {pokemon.forms.map((form, idx) => {
              const fFormName = form.name || "base"
              const isCurrent = idx === formIndex
              return (
                <InternalLink
                  key={fFormName}
                  href={`/smartrotom/pokedex/entrada/${pokemon.dex}/${idx + 1}`}
                  className={`flex-1 text-center text-xs font-medium py-2 px-2.5 rounded-[7px] transition-colors ${
                    isCurrent
                      ? "bg-primary-400/[0.14] text-primary-200"
                      : "text-surface-400 hover:text-surface-100 hover:bg-white/[0.04]"
                  }`}
                >
                  {getForm(fFormName, t) || "Base"}
                </InternalLink>
              )
            })}
          </div>
        )}

        {/* Ficus Ranking */}
        {rank && (
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
            <div className="w-[46px] h-[46px] rounded-xl grid place-items-center font-orbitron font-extrabold text-[22px] bg-primary-400/[0.18] text-primary-300 border border-primary-400 shadow-[0_0_12px_rgba(249,115,22,0.2)]">
              {rank.tier?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <b className="text-[12.5px] text-surface-100 font-semibold flex items-center gap-1">
                <StarIcon className="w-3.5 h-3.5" /> {t("entry_ranking")}
              </b>
              <span className="block text-[11px] text-surface-400">
                {rank.ranking > 0 ? `#${rank.ranking}` : t("entry_no_ranking")}
              </span>
            </div>
            <span className="font-orbitron font-bold text-[19px] text-surface-50 tabular-nums">
              {rank.ranking > 0 ? `#${rank.ranking}` : "—"}
            </span>
          </div>
        )}
      </div>

      {/* Right: Description + facts + abilities */}
      <div className="flex flex-col gap-8">
        {/* Description */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-[18px_22px] relative">
          <span className="absolute -top-1.5 left-3.5 font-orbitron text-[56px] text-primary-500 opacity-25 leading-none select-none">&ldquo;</span>
          <p className="text-[15px] leading-[1.65] text-surface-100 font-normal relative z-10 pt-2">{description}</p>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-white/[0.02] border border-white/[0.05] rounded-[10px] p-3">
              <div className="font-jetbrains text-[10px] tracking-[0.1em] uppercase text-surface-500 mb-1.5">{fact.label}</div>
              <div className="text-lg font-semibold text-surface-50 tabular-nums flex items-baseline gap-1">
                <span className="text-surface-50 font-bold">{fact.value}</span>
                {fact.unit && <span className="text-xs text-surface-400 font-medium">{fact.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Abilities */}
        <div>
          <h3 className="font-orbitron font-bold text-[17px] tracking-tight text-surface-50 mb-3">{t("entry_abilities")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {abilities?.abilities?.map((ability: string) => (
              <HoverCard key={ability} openDelay={300} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <InternalLink
                    href={`/smartrotom/pokedex/habilidades/${ability}`}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 text-left w-full hover:border-primary-400/30 hover:bg-primary-400/[0.04] transition-all"
                  >
                    <div className="font-jetbrains text-[9.5px] tracking-[0.1em] uppercase text-surface-500 mb-1.5">{t("entry_ability_standard")}</div>
                    <div className="text-[15px] font-semibold text-surface-50 mb-1">{t(`ability_${ability.replace(/\s+/g, "")}`)}</div>
                  </InternalLink>
                </HoverCardTrigger>
                <HoverCardContent className="bg-surface-800 text-surface-50 w-[350px] border-surface-600 border font-normal p-4 rounded-lg z-50 shadow-xl">
                  <AbilityDataElement id={ability} />
                </HoverCardContent>
              </HoverCard>
            ))}
            {abilities?.hiddenAbilities?.map((ability: string) => (
              <HoverCard key={ability} openDelay={300} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <InternalLink
                    href={`/smartrotom/pokedex/habilidades/${ability}`}
                    className="bg-accent-500/[0.04] border border-accent-400/20 rounded-xl p-3.5 text-left w-full hover:border-accent-400/45 hover:bg-accent-500/[0.08] transition-all"
                  >
                    <div className="font-jetbrains text-[9.5px] tracking-[0.1em] uppercase text-accent-400 mb-1.5">{t("entry_ability_hidden")}</div>
                    <div className="text-[15px] font-semibold text-surface-50 mb-1">{t(`ability_${ability.replace(/\s+/g, "")}`)}</div>
                  </InternalLink>
                </HoverCardTrigger>
                <HoverCardContent className="bg-surface-800 text-surface-50 w-[350px] border-surface-600 border font-normal p-4 rounded-lg z-50 shadow-xl">
                  <AbilityDataElement id={ability} />
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
