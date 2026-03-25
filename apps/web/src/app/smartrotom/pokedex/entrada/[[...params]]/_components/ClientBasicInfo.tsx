"use client"

import type { Abilities, Pokemon } from "@/types/Pokemon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import TypeBadge from "./TypeBadge"
import { useTranslations } from "next-intl"
import { InformationCircleIcon, StarIcon } from "@heroicons/react/24/outline"
import { getDisplayStatus } from "../../../dexUtils"
import { Badge } from "@/components/ui/primitives/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip"
import AbilityDataElement from "../../../habilidades/_components/AbilityData"
import { InternalLink } from "@/components/ui/navigation/Link"

interface BasicInfoProps {
  pokemon: Pokemon
  formIndex: number
  formName: string
}

export function BasicInfo({ pokemon, formIndex, formName}: BasicInfoProps) {
  const t = useTranslations("pokedex")
  const isVisible = getDisplayStatus(pokemon.dex, formName, true)
  const types = pokemon.forms[formIndex].types ? pokemon.forms[formIndex].types : (pokemon.forms[0].types as any)
  const description = isVisible ? t(`pixelmon_${pokemon.name.toLowerCase()}_description`) : t("unknown_description")
  const rank = pokemon.forms[formIndex].rank
    ? pokemon.forms[formIndex].rank
    : (pokemon.forms[0].rank as { ranking: number; type1: string; type2: string; tier: string })

  const abilities = pokemon.forms[formIndex].abilities
    ? pokemon.forms[formIndex].abilities
    : (pokemon.forms[0].abilities as Abilities)

  return (
    <section className="flex flex-col lg:flex-row gap-8 p-6 rounded-xl shadow-lg">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: 240, height: 240 }}>
          <div className="absolute inset-0 bg-gradient-radial from-surface-600/10 to-transparent rounded-full"></div>
          <div className="absolute inset-0 animate-pulse-slow opacity-30 bg-gradient-radial from-primary-500/10 to-transparent rounded-full"></div>
          <PokemonSprite
            id={pokemon.dex}
            form={formName}
            palette="none"
            width={220}
            height={220}
            pixelated={true}
            showStatus={false}
            hide={true}
            className="drop-shadow-xl"
            url={pokemon.forms[formIndex].spriteUrl}
          />
        </div>

        {/* Types with enhanced tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex justify-center items-center gap-2 mt-3">
                {types.map((type: string) => (
                  <TypeBadge key={type} type={type}/>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-surface-800 border-surface-600 text-surface-100">
              <p>Tipos de Pokémon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Ranking card with improved visual hierarchy */}
        {rank && (
          <div className="mt-4 bg-surface-800/80 p-3 rounded-lg border border-surface-600/50 w-full max-w-[240px]">
            <div className="flex items-center justify-between">
              <h3 className="text-primary-300 font-medium flex items-center gap-1">
                <StarIcon className="h-4 w-4" />
                Ficus Ranking
              </h3>
              <Badge variant="outline" className="bg-primary-900/30 text-primary-100">
                {rank?.tier || "N/A"}
              </Badge>
            </div>
            <div className="mt-2 text-center">
              <span className="text-2xl font-bold text-surface-50">
                {rank.ranking > 0 ? `#${rank.ranking}` : "No clasificado"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right column: Description and abilities */}
      <div className="flex flex-col flex-1 justify-between">
        {/* Description with distinct styling */}
        <div className="mb-6">
          <h2 className="text-sm uppercase tracking-wider text-primary-300/70 mb-2">Descripción</h2>
          <p className="text-xl leading-relaxed text-surface-100 font-light border-l-2 border-primary-500/30 pl-4">
            {description}
          </p>
        </div>
        
        {/* Abilities section with improved layout */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-primary-300/70">Habilidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard abilities */}
          <div className="bg-surface-800/60 p-4 rounded-lg border border-surface-600/30">
            <h3 className="font-medium text-primary-200 mb-3">Estándar</h3>
            <div className="flex flex-wrap gap-2">
              {abilities?.abilities.map((ability: string) => (
                <HoverCard key={ability} openDelay={300} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <InternalLink 
                      href={`pokedex/habilidades/${ability}`} 
                      className="inline-block"
                    >
                      <span className="bg-surface-700/70 px-3 py-1.5 rounded-md text-surface-50 text-sm flex items-center gap-1 hover:bg-surface-600/70 transition-colors cursor-pointer">
                        <span>{t(`ability_${ability.replace(/\s+/g, "")}`)}</span>
                        <InformationCircleIcon className="h-3.5 w-3.5 text-primary-300/70" />
                      </span>
                    </InternalLink>
                  </HoverCardTrigger>
                  <HoverCardContent className="bg-surface-700 text-surface-50 w-[350px] border-surface-600 border font-normal p-4 rounded-lg z-50 shadow-xl">
                    <AbilityDataElement id={ability} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>

          {/* Hidden abilities (if any) */}
          {abilities?.hiddenAbilities && abilities.hiddenAbilities.length > 0 && (
            <div className="bg-surface-800/60 p-4 rounded-lg border border-surface-600/30">
              <h3 className="font-medium text-primary-200 mb-3">Oculta</h3>
              <div className="flex flex-wrap gap-2">
                {abilities?.hiddenAbilities.map((ability: string) => (
                  <HoverCard key={ability} openDelay={300} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <InternalLink 
                        href={`pokedex/habilidades/${ability}`} 
                        className="inline-block"
                      >
                        <span className="bg-primary-900/50 px-3 py-1.5 rounded-md text-primary-100 text-sm font-medium flex items-center gap-1 hover:bg-primary-900/70 transition-colors cursor-pointer">
                          <span>{t(`ability_${ability.replace(/\s+/g, "")}`)}</span>
                          <InformationCircleIcon className="h-3.5 w-3.5 text-primary-200/70" />
                        </span>
                      </InternalLink>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-surface-700 text-surface-50 w-[350px] border-surface-600 border font-normal p-4 rounded-lg z-50 shadow-xl">
                      <AbilityDataElement id={ability} />
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  )
}