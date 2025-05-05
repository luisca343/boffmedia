"use client"
import type { Abilities, Pokemon } from "@/types/Pokemon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import TypeBadge from "./TypeBadge"
import { useTranslations } from "next-intl"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { getDisplayStatus } from "../../../dexUtils"

interface BasicInfoProps {
  pokemon: Pokemon
  formIndex: number
  formName: string
}

export function BasicInfo({ pokemon, formIndex, formName}: BasicInfoProps) {
  const t = useTranslations("pokedex")
  const isVisible = getDisplayStatus(pokemon.dex, formName, true)
  const types = pokemon.forms[formIndex].types ? pokemon.forms[formIndex].types : (pokemon.forms[0].types as any)
  const description = isVisible ? t(`pixelmon_${pokemon.name.toLowerCase()}_description`): t("unknown_description")
  const rank = pokemon.forms[formIndex].rank
    ? pokemon.forms[formIndex].rank
    : (pokemon.forms[0].rank as { ranking: number; type1: string; type2: string; tier: string })

  const abilities = pokemon.forms[formIndex].abilities
    ? pokemon.forms[formIndex].abilities
    : (pokemon.forms[0].abilities as Abilities)

  return (
    <section className="flex flex-col md:flex-row items-center justify-center gap-8 p-3 bg-surface-700/20 rounded-lg">
      {/* Pokemon sprite and types */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: 220, height: 220 }}>
          <div className="absolute inset-0 bg-gradient-radial from-surface-700/20 to-transparent rounded-full"></div>
          <PokemonSprite
            id={pokemon.dex}
            form={formName}
            palette="none"
            width={200}
            height={200}
            pixelated={true}
            showStatus={false}
            hide={true}
            className="drop-shadow-lg"
            url={pokemon.forms[formIndex].spriteUrl}
          />
        </div>
        <HoverCard>
          <HoverCardTrigger>
            <div className="flex justify-center items-center gap-2 mt-2 hover:cursor-help">
              {types.map((type: string) => (
                <TypeBadge key={type} type={type} />
              ))}
              {rank && (
                <div className="text-primary-300 flex items-center gap-1">
                  <InformationCircleIcon className="h-5 w-5" />
                </div>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="z-[200] bg-surface-800 text-surface-100 p-4 border border-surface-600">
            {rank && (
              <div className="text-center font-medium">
                <div className="text-lg text-primary-300 mb-1">Ficus Rank</div>
                <div className="flex justify-center gap-4">
                  <div>
                    <span className="text-surface-300">Ranking:</span> 
                    <span className="ml-2 text-surface-50 font-bold">{rank.ranking > 0 ? "#" + rank.ranking : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-surface-300">Tier:</span> 
                    <span className="ml-2 text-surface-50 font-bold">{rank?.tier || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Pokemon info */}
      <div className="flex flex-col items-center md:items-start max-w-xl">
        <p className="text-xl text-center md:text-left mb-6 text-surface-100">{description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
          {/* Abilities section */}
          <div className="bg-surface-700/30 p-3 rounded-md">
            <h3 className="font-bold text-primary-300 mb-1">Habilidades</h3>
            <div className="flex flex-wrap gap-1">
              {abilities?.abilities.map((ability: string) => (
                <span key={ability} className="bg-surface-600/50 px-2 py-1 rounded text-surface-50">
                  {ability}
                </span>
              ))}
            </div>
          </div>

          {/* Hidden abilities section (if any) */}
          {abilities?.hiddenAbilities && abilities.hiddenAbilities.length > 0 && (
            <div className="bg-surface-700/30 p-3 rounded-md">
              <h3 className="font-bold text-primary-300 mb-1">Habilidad Oculta</h3>
              <div className="flex flex-wrap gap-1">
                {abilities?.hiddenAbilities.map((ability: string) => (
                  <span key={ability} className="bg-primary-700/30 px-2 py-1 rounded text-primary-100">
                    {ability}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}