import { Battle, Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';




export function PokemonSprite({pokemon, className, ...props}: {pokemon: Pokemon, className?: string, props?: any}){
    if(!pokemon) return <div 
    {...props}
    style={{width:40, height:30}}>
        <img className="m-auto"  src='/smartrotom/test/pokeball.png' />
    </div>
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
            style={{...icon.css}}
        />
    )
}
