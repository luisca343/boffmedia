import { DetailedPokemon, Protocol } from "@pkmn/protocol";
import { PokemonImage } from "./PokemonTeam";
import { Pokemon } from "@pkmn/client";
import './test.css'; // Assuming your CSS is in this file

export function HpBar({pokemon}: {pokemon: Pokemon}){
    const hpPercent = Math.floor((pokemon.hp / pokemon.maxhp) * 100)
    const hpColor = hpPercent > 50 ? "bg-green-400" : hpPercent > 20 ? "bg-yellow-400" : "bg-red-400"
    return (
        <div className={`flex w-full border border-black rounded-md overflow-hidden text-xs`}
            style={{height: 16, width: "100%", backgroundColor: "gray"}}
        >
            <div className={ `h-full ${hpColor} hp-bar`} style={{width: `${hpPercent}%`}} >
                <span className="text-black">{pokemon.hp}/{pokemon.maxhp}</span>
            </div>
        </div>
    )
}

export default function PokemonSprite({pokemon, id, className}: {pokemon: Pokemon | null, id: string, className?: string}) {
    if(!pokemon) return <div className={`w-48 h-48 absolute ${className}`} id={id} style={{width:150, height:150}}></div>
    const {player, position, name } = Protocol.parsePokemonIdent(pokemon.ident)
    
    const side: "p1" | "p2" | undefined = player === "p1" || player === "p2" ? player : undefined;
    
    const hpPercent = Math.floor((pokemon.hp / pokemon.maxhp) * 100)
    const hpColor = hpPercent > 50 ? "bg-green-400" : hpPercent > 20 ? "bg-yellow-400" : "bg-red-400"

    return ( <>
    <div className={`w-48 h-48 absolute ${className} z-[100]`} style={{width:150, height:150}}>
            <div>
                <span className="text-shadow-border1 flex text-white items-center">{name} {(pokemon.gender !== 'N') && <img className="mx-1" style={{width:'9px', height:'13px'}} src={`https://play.pokemonshowdown.com/fx/gender-${pokemon.gender.toLowerCase()}.png`}/>} L{pokemon.level}</span>
                <HpBar pokemon={pokemon} />
            </div>
            <div className="flex flex-wrap py-1">
                {Object.entries(pokemon.boosts).map(([key, value]) => {
                    const multiplier = getBoostMultiplier(value)
                    if(multiplier === 1) return <span key={key}>{key}: x1</span>
                    if(multiplier > 1) return <span key={key} className="border-2 text-green-900 border-green-900 bg-green-200 mx-1 rounded-md text-xs">{multiplier}x {key}</span>
                    return <span key={key} className="border-2 text-red-900 border-red-900 bg-red-200 mx-1 rounded-md text-xs">{multiplier}x {key}</span>
                
                })}
            </div>
    </div>
    
    <div className={`w-48 h-48 absolute flex flex-col justify-end ${className}`} id={id} style={{width:150, height:150}}>
        <PokemonImage id={`${id}-pkm`} side={side} pokemon={pokemon} />
    </div></>
    )
}

function getBoostMultiplier(boost: number){
    if(boost === 0) return 1;
    let result;
    if(boost > 0) result = (boost + 2) / 2;
    else result = 2 / (Math.abs(boost) + 2);

    return +result.toFixed(2);
}