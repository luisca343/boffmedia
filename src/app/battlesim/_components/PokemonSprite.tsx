import { Battle, Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { transform } from "next/dist/build/swc";




  export function PokemonSprite({pokemon, className, ...props}: {pokemon: Pokemon, className?: string, props?: any}) {
    if (!pokemon) return (
        <div  
            {...props}
            style={{width: 15, height: 15}}
        >
            <img className="m-auto" src='/battlesim/pokeball.png' />
        </div>
    );

    const icon = Icons.getPokemon(pokemon.speciesForme, {
        side: 'p1',
        gender: pokemon.gender || undefined,
        fainted: pokemon.fainted,
        domain: 'pkmn.cc',
    });

    return (
        <div style={{width: 32, height: 24}}>
            <div 
                className={className}
                key={pokemon.name}
                style={{...icon.css, transform: 'scale(.7)'}}
            />
        </div>
    );
}
