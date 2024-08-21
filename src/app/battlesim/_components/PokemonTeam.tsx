import { Side } from "@pkmn/client";
import PokemonDetail from "./PokemonDetail";
import { PokemonSprite } from "./PokemonSprite";


export function PokemonTeam({side}: {side: Side}) {
    const total = side.totalPokemon;

    return <div className="flex flex-wrap  justify-center items-center text-center w-16 bg-slate-800 bg-opacity-80 r rounded-md z-50">
        {Array.from({length: total}, (_, i) => side.team[i]).map((pokemon, index) => {
            return <PokemonDetail pokemon={pokemon} 
                    className={`w-6 flex justify-center z-40`} 
                    key={`pkm-${side.n}-${index}`}>
                <PokemonSprite pokemon={pokemon} />
            </PokemonDetail>
        })}
    </div>
}