import { PokemonSprite } from "../../pokedex/_components/PokemonSprite"
import { useTranslations } from "next-intl"
import { PokemonW } from "@boffmedia/shared";

export default function ActiveTeam({ team, className }: { team: PokemonW[]; className?: string }) {
  const t = useTranslations("pokedex")

  return (
    <div className={`font-vinque flex flex-col justify-around h-[90%] w-full ${className}`}>
      {team?.map((pokemon, index) => {
        if (!pokemon) return <div className="w-32" key={index}></div>
        return (
          <div key={index} className="flex items-center min-h-[100px] w-full border-b border-surface-500/30 pb-2">
            {/* Pokemon Sprite and Basic Info */}
            <div className="w-[20%] flex flex-col items-center space-y-1">
              <div className="bg-stone-200/50 rounded-full p-1 border border-surface-400/30">
                <PokemonSprite
                  showStatus={false}
                  width={60}
                  height={60}
                  id={pokemon.dex}
                  form={pokemon.form || "base"}
                  palette={pokemon.palette || "none"}
                />
              </div>
              <span className="text-xs font-medium text-center mt-1">
                {pokemon.name.toLowerCase().replace(" ", "") !== pokemon.species.toLowerCase().replace(" ", "") 
                  ? pokemon.name 
                  : t(`pixelmon_${pokemon.species.toLowerCase().replace(" ", "_")}`)} Nv. {pokemon.level} 
              </span>
            </div>

            {/* Ability and Item */}
            <div className="w-[20%] px-4 border-l border-dashed border-surface-600/50 min-h-[80px] flex flex-col justify-center">
              <div className="space-y-2 text-sm">
                <p className="font-bold">{t(`ability_${pokemon.ability.replace(" ", "")}`)}</p>
                {pokemon.item !== "item.minecraft.air" && <p className="text-surface-700">{pokemon.item}</p>}
              </div>
            </div>

            {/* Moves */}
            <div className="w-[20%] px-4 border-l border-dashed border-surface-600/50 min-h-[80px] flex flex-col justify-center">
              <div className="space-y-1 text-sm">
                {pokemon.moves.map((move, idx) => {
                  const moveName = typeof move === "string" ? move : (move as {name?: string})?.name
                  return (
                    <p key={idx} className="font-medium">
                      {moveName ? t(`attack_${moveName.toLowerCase().replace(" ", "_")}`) : "-"}
                    </p>
                  )
                })}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="w-[40%] px-4 border-l border-dashed border-surface-600/50 min-h-[80px]">
              <div className="w-full text-xs">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                  <div className="font-bold">-</div>
                  <div className="font-bold">PS</div>
                  <div className="font-bold">At</div>
                  <div className="font-bold">Def</div>
                  <div className="font-bold">AtS</div>
                  <div className="font-bold">DefS</div>
                  <div className="font-bold">Vel</div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                  <div className="font-bold">Stats</div>
                  {pokemon.stats.map((stat, idx) => (
                    <div key={idx} className="font-bold">
                      {stat}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                  <div className="font-bold">IVs</div>
                  {pokemon.ivs.map((iv, idx) => (
                    <div key={idx}>{iv}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-center">
                  <div className="font-bold">EVs</div>
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