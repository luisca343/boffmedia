import { DetailedPokemon, Protocol } from "@pkmn/protocol";
import { PokemonImage } from "./PokemonTeam";
import { Pokemon } from "@pkmn/client";

export default function PokemonSprite({pokemon, id, className}: {pokemon: DetailedPokemon | null, id: string, className?: string}) {
    if(!pokemon) return <div className={`w-48 h-48 border border-red-500 absolute ${className}`} id={id} style={{width:200, height:200}}></div>
    const {player, position, name } = Protocol.parsePokemonIdent(pokemon.ident)
    const side: "p1" | "p2" | undefined = player === "p1" || player === "p2" ? player : undefined;
    
    const hpPercent = Math.floor((pokemon.hp / pokemon.maxhp) * 100)
    const hpColor = hpPercent > 50 ? "bg-green-400" : hpPercent > 20 ? "bg-yellow-400" : "bg-red-400"

    return ( 
    <div className={`w-48 h-48 border border-red-500 absolute ${className}`} id={id} style={{width:200, height:200}}>
        <div className="h-full w-full flex flex-col items-center ">
            <div className={`flex w-full h-[20%] border border-black rounded-md overflow-hidden`}>
                <div className={ `h-full ${hpColor}`} style={{width: `${hpPercent}%`}} >
                    <span className="text-white">{pokemon.hp}/{pokemon.maxhp}</span>
                </div>
            </div>
            <div className='h-[80%]'>
                <PokemonImage id={pokemon.speciesForme} side={side} shiny={pokemon.shiny} />
            </div>
        </div>
    </div>
    )
}