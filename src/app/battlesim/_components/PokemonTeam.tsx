"use client"
import { Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { DetailedPokemon } from "@pkmn/protocol";
import { HpBar } from "./PokemonSprite";

export function PokemonTeamList({team}: {team: Pokemon[]}) {
    const teamSize = team.length > 6 ? team.length : 6;
    return (
        <div className="flex flex-col justify-center">
            {Array.from({length: teamSize}, (_, i) => team[i]).map(pokemon => {
                if(!pokemon) return <div key={Math.random()} className="flex text-white" style={{height:50}}> </div>
                return <div key={pokemon?.name} className="flex text-white items-center" style={{height:50}}>
                    <div className="mr-2">
                        <PokemonSprite key={pokemon?.name} pokemon={pokemon} />
                    </div>
                    
                    <HpBar pokemon={pokemon} />
                </div>
        })}
        </div>
    )
}


export function PokemonTeam({team}: {team: Pokemon[]}){
    const teamSize = team.length > 6 ? team.length : 6;
    const halfTeamSize = Math.ceil(teamSize / 2);

    return (
        <div  className="mx-auto flex flex-wrap justify-center">
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

function PokemonSprite({pokemon, className}: {pokemon: Pokemon, className?: string}){
    if(!pokemon) return <div className=" w-fit inline-block  " style={{width:30, height:30}}><img className="m-auto"  src='/smartrotom/test/pokeball.png' /></div>
    const icon = Icons.getPokemon(pokemon.speciesForme, {
        side: 'p1',
        gender: pokemon.gender || undefined,
        fainted: pokemon.fainted,
        domain: 'pkmn.cc',
    });

    return (
        <div 
            className={className}
            key={pokemon.name}
            style={{...icon.css, width: 30, height: 30}}
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
