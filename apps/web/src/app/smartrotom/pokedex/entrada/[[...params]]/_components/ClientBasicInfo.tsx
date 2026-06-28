"use client"

import type { Abilities, Pokemon } from "@/types/Pokemon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import TypeBadge from "@/components/shared/pokemon/TypeBadge"
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
          <div className="absolute inset-0 bg-gradient-radial from-layer-3/10 to-transparent rounded-full"></div>
          <div className="absolute inset-0 animate-pulse-slow opacity-30 bg-gradient-radial from-primary/10 to-transparent rounded-full"></div>
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
            <TooltipContent className="bg-layer-2 border-edge text-ink">
              <p>Tipos de Pokémon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Ranking card with improved visual hierarchy */}
        {rank && (
          <div className="mt-4 bg-layer-2/80 p-3 rounded-lg border border-edge/50 w-full max-w-[240px]">
            <div className="flex items-center justify-between">
              <h3 className="text-primary-hover font-medium flex items-center gap-1">
                <StarIcon className="h-4 w-4" />
                Ficus Ranking
              </h3>
              <Badge variant="outline" className="bg-primary-soft/30 text-primary-hover">
                {rank?.tier || "N/A"}
              </Badge>
            </div>
            <div className="mt-2 text-center">
              <span className="text-2xl font-bold text-ink">
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
          <h2 className="text-sm uppercase tracking-wider text-primary-hover/70 mb-2">Descripción</h2>
          <p className="text-xl leading-relaxed text-ink font-light border-l-2 border-primary/30 pl-4">
            {description}
          </p>
        </div>
        
        {/* Abilities section with improved layout */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-primary-hover/70">Habilidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard abilities */}
          <div className="bg-layer-2/60 p-4 rounded-lg border border-edge/30">
            <h3 className="font-medium text-primary-hover mb-3">Estándar</h3>
            <div className="flex flex-wrap gap-2">
              {abilities?.abilities.map((ability: string) => (
                <HoverCard key={ability} openDelay={300} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <InternalLink 
                      href={`pokedex/habilidades/${ability}`} 
                      className="inline-block"
                    >
                      <span className="bg-layer-3/70 px-3 py-1.5 rounded-md text-ink text-sm flex items-center gap-1 hover:bg-layer-3/70 transition-colors cursor-pointer">
                        <span>{t(`ability_${ability.replace(/\s+/g, "")}`)}</span>
                        <InformationCircleIcon className="h-3.5 w-3.5 text-primary-hover/70" />
                      </span>
                    </InternalLink>
                  </HoverCardTrigger>
                  <HoverCardContent className="bg-layer-3 text-ink w-[350px] border-edge border font-normal p-4 rounded-lg z-50 shadow-xl">
                    <AbilityDataElement id={ability} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>

          {/* Hidden abilities (if any) */}
          {abilities?.hiddenAbilities && abilities.hiddenAbilities.length > 0 && (
            <div className="bg-layer-2/60 p-4 rounded-lg border border-edge/30">
              <h3 className="font-medium text-primary-hover mb-3">Oculta</h3>
              <div className="flex flex-wrap gap-2">
                {abilities?.hiddenAbilities.map((ability: string) => (
                  <HoverCard key={ability} openDelay={300} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <InternalLink 
                        href={`pokedex/habilidades/${ability}`} 
                        className="inline-block"
                      >
                        <span className="bg-primary-soft/50 px-3 py-1.5 rounded-md text-primary-hover text-sm font-medium flex items-center gap-1 hover:bg-primary-soft/70 transition-colors cursor-pointer">
                          <span>{t(`ability_${ability.replace(/\s+/g, "")}`)}</span>
                          <InformationCircleIcon className="h-3.5 w-3.5 text-primary-hover/70" />
                        </span>
                      </InternalLink>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-layer-3 text-ink w-[350px] border-edge border font-normal p-4 rounded-lg z-50 shadow-xl">
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