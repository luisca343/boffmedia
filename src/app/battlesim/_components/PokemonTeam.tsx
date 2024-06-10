"use client"
import { Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import Image from "next/image";
  export function PokemonTeam({team}: {team: Pokemon[]}){
    return (
        <div>
            {team.length > 3 ? (
                <>
                    <div>
                        {team.slice(0, team.length / 2).map(pokemon => (
                            <PokemonSprite key={pokemon.name} pokemon={pokemon} />
                        ))}
                    </div>
                    <div>
                        {team.slice(team.length / 2).map(pokemon => (
                            <PokemonSprite key={pokemon.name} pokemon={pokemon} />
                        ))}
                    </div>
                </>
            ) : (
                <div>
                    {team.map(pokemon => (
                        <PokemonSprite key={pokemon.name} pokemon={pokemon} />
                    ))}
                </div>
            )}
        </div>
    )
}

function PokemonSprite({pokemon}: {pokemon: Pokemon}){
    const icon = Icons.getPokemon(pokemon.speciesForme, {
        side: 'p1',
        gender: pokemon.gender || undefined,
        fainted: pokemon.fainted,
        domain: 'pkmn.cc',
    });

    return (
        <div 
            key={pokemon.name}
            style={icon.css}
        />
    )
}


export function PokemonImage({id, shiny = false, side = 'p2'}: {id: string, shiny: boolean, side?: 'p1' | 'p2'}){
    let {url, w, h, pixelated} = Sprites.getPokemon(id, {gen: 'ani', shiny, side});
    if(url === "https://play.pokemonshowdown.com/sprites/gen5/0.png") {
        url = `http://boffmedia.es/smartrotom/img/sprites/Front/${id.toUpperCase()}.png`
        pixelated = true
    }
    return (
        <div className='w-48 h-48 flex items-center justify-center'>
            <img src={url} width={w} height={h} style={{imageRendering: pixelated ? 'pixelated' : 'auto'}} alt={id}/>
        </div>
    );
}   