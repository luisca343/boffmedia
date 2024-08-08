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
            <img className="m-auto" src='/smartrotom/test/pokeball.png' />
        </div>
    );

    const icon = Icons.getPokemon(pokemon.speciesForme, {
        side: 'p1',
        gender: pokemon.gender || undefined,
        fainted: pokemon.fainted,
        domain: 'pkmn.cc',
    });
    
    console.log(icon.url);
    console

    return (
        <div style={{width: 28, height: 28}}>
            <div 
                className={className}
                key={pokemon.name}
                style={{...icon.css, transform: 'scale(.75)'}}
            />
        </div>
    );
}
