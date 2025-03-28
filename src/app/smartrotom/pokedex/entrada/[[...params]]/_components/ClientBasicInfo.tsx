"use client"
import type { Abilities } from "@/types/Pokemon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import TypeBadge from "./TypeBadge"
import { Pokemon } from "../../../_types/pokemon"
import { useTranslations } from "next-intl"

interface BasicInfoProps {
  pokemon: Pokemon
  formIndex: number
  formName: string
}

export function BasicInfo({ pokemon, formIndex, formName}: BasicInfoProps) {
  const t = useTranslations("pokedex")
  const types = pokemon.forms[formIndex].types ? pokemon.forms[formIndex].types : (pokemon.forms[0].types as any)
  const description = t(`pixelmon_${pokemon.name.toLowerCase()}_description`)
  const rank = pokemon.forms[formIndex].rank
    ? pokemon.forms[formIndex].rank
    : (pokemon.forms[0].rank as { ranking: number; type1: string; type2: string; tier: string })

  const abilities = pokemon.forms[formIndex].abilities
    ? pokemon.forms[formIndex].abilities
    : (pokemon.forms[0].abilities as Abilities)

  return (
    <section className="flex justify-center items-center">
      <div className="flex flex-col items-center">
        <div className="flex " style={{ width: 200, height: 200 }}>
          <PokemonSprite
            id={pokemon.dex}
            form={formName}
            palette="none"
            width={200}
            height={200}
            pixelated={false}
            showStatus={false}
            hide={true}
          />
        </div>
        <span className=" text-xl text-center">{description} </span>
        <HoverCard>
          <HoverCardTrigger>
            <div className="flex justify-center items-center hover:cursor-help">
              {types.map((type: string) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="z-[200] bg-surface-800 text-surface-100 w-128">
            {rank && (
              <div className="text-center">{`Ficus Rank: ${rank.ranking > 0 ? "#" + rank.ranking : ""}  Tier ${rank?.tier} `}</div>
            )}
          </HoverCardContent>
        </HoverCard>
        <div>
          <span className="font-bold">Habilidades:</span>
        {abilities?.abilities.map((ability: string) => (
            <span className="mx-1" key={ability}>
                {ability}
            </span>
        ))}
        </div>

        {abilities?.hiddenAbilities && (
          <div>
            <span className="font-bold">Habilidad Oculta:</span>
            {abilities?.hiddenAbilities.map((ability: string) => (
              <span className="mx-1" key={ability}>
                {ability}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

