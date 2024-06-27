
import { Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { DetailedPokemon } from "@pkmn/protocol";
import { HpBar } from "./PokemonSprite";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dex } from '@pkmn/sim';
import TypeBadge, { TypeBadgeSmall } from "@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge";


function calculateSpeed(base: number, level: number, natureModifier: number, IV: number, EV: number) {
    const speed = Math.floor((0.01 * (2 * base + IV + Math.floor(0.25 * EV)) * level) + 5) * natureModifier;
    return speed;
  }

export function PokemonTeamListElement({pokemon}: {pokemon: Pokemon}) {
    return (
        <div className="flex text-white items-center" style={{height:50}}>
            <div className="mr-2" style={{width:30, height:30}}>
                <PokemonSprite key={pokemon?.name} pokemon={pokemon} />
            </div>
            <HpBar pokemon={pokemon} />
        </div>
    )
}

export function PokemonTeamList({team}: {team: Pokemon[]}) {
    const teamSize = team.length > 6 ? team.length : 6;
    return (
        <div className="flex flex-col justify-center">
            {Array.from({length: teamSize}, (_, i) => team[i]).map(pokemon => {
                if(!pokemon) return <div key={Math.random()}  className="flex text-white items-center" style={{height:50}}>
                    <div className="mr-2" style={{width:30, height:30}}>
                        <PokemonSprite key={pokemon?.name} pokemon={pokemon} />
                    </div>
                    <HpBar pokemon={pokemon} />
                
                </div>
                return <HoverCard key={pokemon.name} openDelay={0} closeDelay={0}>
                    <HoverCardTrigger>
                        <PokemonTeamListElement key={pokemon.name} pokemon={pokemon} />
                    </HoverCardTrigger>
                    <HoverCardContent className="z-[200] bg-slate-800 text-slate-100 w-128" side="right">
                         <span className="font-bold">{pokemon.name}</span> {pokemon.speciesForme} L{pokemon.level}
                         <div className="flex">{pokemon.types.map(type => <TypeBadgeSmall key={type} type={type} />)}</div>
                         <br/>
                         <div>HP: {pokemon.hp > 0 ? pokemon.hp / pokemon.maxhp * 100 : 0}%</div>
                         <span className="flex">Possible abilities: {pokemon.species.abilities[0]} {pokemon.species.abilities[1] && pokemon.species.abilities[1]} {pokemon.species.abilities.H && pokemon.species.abilities.S}</span>
                        <span className="flex">Speed: {calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, .9, 0,0 )} - {calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, 1.1, 31, 252)} </span>
                        {pokemon.movesUsedWhileActive.map(move => <div key={move}>{move}</div>)}
                        {pokemon.teraType && <div className="flex">Tera Type: {pokemon.teraType}</div>}
                    </HoverCardContent>
                </HoverCard>
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
    if(!pokemon) return <div 
    style={{width:40, height:40}}>
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
