"use client"
import { Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { DetailedPokemon } from "@pkmn/protocol";
import Image from "next/image";
export function PokemonTeam({team}: {team: Pokemon[]}){
    const teamSize = team.length > 6 ? team.length : 6;
    const halfTeamSize = Math.ceil(teamSize / 2);

    return (
        <div>
            <>
                <div>
                    {Array.from({length: halfTeamSize}, (_, i) => team[i]).map(pokemon => (
                        <PokemonSprite key={pokemon?.name} pokemon={pokemon} />
                    ))}
                </div>
                <div>
                    {Array.from({length: teamSize - halfTeamSize}, (_, i) => team[i + halfTeamSize]).map(pokemon => (
                        <PokemonSprite key={pokemon?.name} pokemon={pokemon} />
                    ))}
                </div>
            </>
        </div>
    )
}

function PokemonSprite({pokemon}: {pokemon: Pokemon}){
    if(!pokemon) return <div className=" w-fit inline-block  " style={{width:40, height:30}}><img className="m-auto"  src='/smartrotom/test/pokeball.png' /></div>
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


export function PokemonImage({id, pokemon, side = 'p2'}: {id: string, pokemon: DetailedPokemon, side?: 'p1' | 'p2'}){
    let {url, w, h, pixelated} = Sprites.getPokemon(pokemon.speciesForme, {gen: 'ani', shiny: pokemon.shiny, side});
    if(url === "https://play.pokemonshowdown.com/sprites/gen5/0.png") {
        url = `http://boffmedia.es/smartrotom/img/sprites/Front/${pokemon.speciesForme.toUpperCase()}.png`
        pixelated = true
    }
    return (
        <div className='w-full h-full flex items-end justify-center' id={id}>
            <img src={url} width={w} height={h} style={{imageRendering: pixelated ? 'pixelated' : 'auto'}} alt={pokemon.speciesForme}/>
        </div>
    );
}   