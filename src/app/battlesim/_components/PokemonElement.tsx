import { DetailedPokemon, Protocol } from "@pkmn/protocol";
import { Pokemon } from "@pkmn/client";
import './test.css'; // Assuming your CSS is in this file
import { PokemonImage } from "../_components_old/PokemonTeam";

export function HpBar({pokemon, className}: {pokemon: Pokemon, className?: string}) {
    if(!pokemon) return <div className={`w-full border border-black rounded-md overflow-hidden text-xs ${className}`} style={{height: 16, width: "100%", backgroundColor: "gray"}}></div>

    const hpPercent = Math.floor((pokemon.hp / pokemon.maxhp) * 100);
    

    // Function to calculate color based on hpPercent
    const getHpColor = (percent: number) => {
        if (percent > 50) return `rgb(${255 - ((percent - 50) * 5.1)}, 255, 77)`; // Green to Yellow
        return `rgb(255, ${percent * 5.1}, 77)`; // Yellow to Red
    };

    const hpColor = getHpColor(hpPercent);

    return (
        <div className={`flex justify-between w-full  rounded-md overflow-hidden text-xs  bg-slate-800 ${className}`} style={{height: 16, width: "100%"}}>
            <div className="hp-bar rounded-r-xl" style={{height: 16,width: `${hpPercent}%`, backgroundColor: hpColor, transition: 'width 0.5s ease-out, background-color 0.5s ease-out'}}/>
           
            <div className="w-[20%]  text-white text-end" style={{fontSize:'9px'}}>
                {(pokemon.hp / pokemon.maxhp * 100).toFixed(0)}% 
            </div>
        </div>
    );
}

export function PokemonStatusBadge({status}: {status: string}){
    const statusColors = {
        'slp': {backgroundColor: 'purple', textColor: 'white'},
        'brn': {backgroundColor: 'red', textColor: 'white'},
        'par': {backgroundColor: 'yellow', textColor: 'white'},
        'frz': {backgroundColor: 'blue', textColor: 'white'},
        'psn': {backgroundColor: 'purple', textColor: 'white'},
        'tox': {backgroundColor: 'purple', textColor: 'white'},
    } as {[key: string]: {backgroundColor: string, textColor: string}}
    const color = statusColors[status];
    return <span className={`border-2 font-bold text-xs text-white bg-${status} pl-1 pr-1 rounded text-shadow-border1`} 
        style={{backgroundColor: color?.backgroundColor, color: color?.textColor}}>
            {status}
    </span>
}

export default function PokemonElement({pokemon, id, className, viewPoint = 0, style}: {pokemon: Pokemon | null, id: string, className?: string, viewPoint?: number, style?: React.CSSProperties}) {
    if(!pokemon) return <div className={`w-48 h-48 absolute ${className}`} id={id} style={{width:175, height:175, ...style}}></div>
    const {player, position, name } = Protocol.parsePokemonIdent(pokemon.ident)
    
    let side = player === "p1" || player === "p2" ? player : undefined;
    if(viewPoint === 1) side = side === "p1" ? "p2" : "p1";

    const hpPercent = Math.floor((pokemon.hp / pokemon.maxhp) * 100)
    const hpColor = hpPercent > 50 ? "bg-green-400" : hpPercent > 20 ? "bg-yellow-400" : "bg-red-400"
    
    return ( <>
    <div className={` w-48 h-48 absolute ${className} z-[100] -mb-4`} style={{width:175, height:175, ...style}}>
            <div>
                <span className="text-shadow-border1 flex text-white items-center ">{name} {(pokemon.gender !== 'N') && <img className="mx-1" style={{width:'9px', height:'13px'}} src={`https://play.pokemonshowdown.com/fx/gender-${pokemon.gender.toLowerCase()}.png`}/>} L{pokemon.level}</span>
                <HpBar pokemon={pokemon} />
            </div>
            <div className="flex flex-wrap py-1">
                {pokemon.status && <PokemonStatusBadge status={pokemon.status} />}
                {Object.entries(pokemon.boosts).map(([key, value]) => {
                    const multiplier = getBoostMultiplier(value)
                    if(multiplier === 1) return null;
                    if(multiplier > 1) return <span key={key} className="border-2 text-green-900 border-green-900 bg-green-200 mx-1 rounded-md text-xs">{multiplier}x {key}</span>
                    return <span key={key} className="border-2 text-red-900 border-red-900 bg-red-200 mx-1 rounded-md text-xs">{multiplier}x {key}</span>
                
                })}
            </div>
    </div>
    
    <div className={`w-48 h-48 absolute flex flex-col justify-end -mt-4 z-10  ${className} `} id={id} style={{width:175, height:175, ...style}}>
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