import type { ActiveTeam as ActiveTeamType } from "@/types/Pokemon"
import { PokemonSprite } from "../../pokedex/_components/PokemonSprite"
import { useTranslations } from "next-intl"
import { Pokemon } from "@/services/api/smartrotom/playerService";

export default function ActiveTeam({ team, className }: { team: Pokemon[]; className?: string }) {
  const movesTrans = useTranslations("")
  const abilitiesTrans = useTranslations("")

  return (
    <div className={`font-vinque flex flex-col justify-around space-y-4 h-[90%] w-full ${className}`}>
      {team?.map((pokemon, index) => {
        if (!pokemon) return <div className="w-32" key={index}></div>
        return (
          <div key={index} className="flex items-center min-h-[100px] w-full">
            {/* Pokemon Sprite and Basic Info */}
            <div className="w-[20%] flex flex-col items-center space-y-1">
              <PokemonSprite
                showStatus={false}
                width={60}
                height={60}
                id={pokemon.dex}
                form={pokemon.form || "base"}
                palette={pokemon.palette || "none"}
              />
              <span className="text-xs font-medium text-center">
                {pokemon.name} Nv. {pokemon.level}
              </span>
            </div>

            {/* Ability and Item */}
            <div className="w-[20%] px-4 border-l border-dashed border-gray-600/50 min-h-[80px] flex flex-col justify-center">
              <div className="space-y-2 text-sm">
                <p className="font-medium">{abilitiesTrans(`ability_${pokemon.ability.replace(" ", "")}`)}</p>
                {pokemon.item !== "item.minecraft.air" && <p className="text-gray-700">{pokemon.item}</p>}
              </div>
            </div>

            {/* Moves */}
            <div className="w-[20%] px-4 border-l border-dashed border-gray-600/50 min-h-[80px] flex flex-col justify-center">
              <div className="space-y-1 text-sm">
                {pokemon.moves.map((move, idx) => (
                  <p key={idx} className="font-medium">
                    {move ? movesTrans(`attack_${move.toLowerCase().replace(" ", "_")}`) : "-"}
                  </p>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="w-[40%] px-4 border-l border-dashed border-gray-600/50 min-h-[80px]">
              <div className="w-full text-xs">
                <div className="grid grid-cols-7 gap-2 mb-1 text-center">
                  <div className="font-medium">-</div>
                  <div className="font-medium">PS</div>
                  <div className="font-medium">At</div>
                  <div className="font-medium">Def</div>
                  <div className="font-medium">AtS</div>
                  <div className="font-medium">DefS</div>
                  <div className="font-medium">Vel</div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-1 text-center">
                  <div className="font-medium">Stats</div>
                  {pokemon.stats.map((stat, idx) => (
                    <div key={idx} className="font-medium">
                      {stat}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 mb-1 text-center">
                  <div className="font-medium">IVs</div>
                  {pokemon.ivs.map((iv, idx) => (
                    <div key={idx}>{iv}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-center">
                  <div className="font-medium">EVs</div>
                  {pokemon.evs.map((ev, idx) => (
                    <div key={idx}>{ev}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

