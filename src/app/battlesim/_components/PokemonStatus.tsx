import { Pokemon } from "@pkmn/client";
import './test.css';

export function PokemonStatus({pokemon, className}: {pokemon: Pokemon | null, className?: string}) {
    if(!pokemon) return <div className={`mx-2 p-1  ${className}`} />

    const hpPercent = Math.floor((pokemon.hp / pokemon.maxhp) * 100);
    
    const getHpColor = (percent: number) => {
        if (percent > 50) return `rgb(${255 - ((percent - 50) * 5.1)}, 255, 77)`; // Green to Yellow
        return `rgb(255, ${percent * 5.1}, 77)`; // Yellow to Red
    };

    const hpColor = getHpColor(hpPercent);

    return (
        <div className={`flex flex-col mx-2 p-1 justify-around  rounded-md overflow-hidden text-2xs xl:text-xs  bg-slate-800  bg-opacity-90 h-18  ${className}`}>
            <span className="px-1 text-white font-bold">{pokemon.name} L{pokemon.level}</span>
            <div className="relative border border-white rounded-xl overflow-hidden h-3 sm:h-4 md:h-6 xl:h-7 2xl:h-8">
                <div className="hp-bar h-full" style={{ width: `${hpPercent}%`, backgroundColor: hpColor, transition: 'width 0.5s ease-out, background-color 0.5s ease-out'}}/>
                <div className="absolute right-0 top-0 h-full flex items-center text-white pr-2" style={{fontSize: '9px', zIndex: 50}}>
                    {(pokemon.hp / pokemon.maxhp * 100).toFixed(0)}%
                </div>
            </div>
            <div className="flex flex-wrap h-1/3">
                {pokemon.status && <PokemonStatusBadge status={pokemon.status} />}
                {Object.entries(pokemon.boosts).map(([key, value]) => {
                    const multiplier = getBoostMultiplier(value);
                    if (multiplier === 1) return null;
                    const spanClass = multiplier > 1 
                        ? "flex items-center justify-center text-green-900 border-green-900 bg-green-200 mr-1 rounded-md h-[11px] text-[6pt] px-[3px] mb-[1px]" 
                        : "flex items-center justify-center text-red-900 border-red-900 bg-red-200 mr-1 rounded-md h-[11px] text-[6pt] px-[3px] mb-[1px]";
                    return <span key={key} className={spanClass}>x{multiplier} {key.slice(0,3)}</span>
                })}
            </div>
        </div>
    );
    
}

export function PokemonStatusBadge({status}: {status: string}) {
    const statusColors = {
        'slp': {backgroundColor: 'purple', textColor: 'white'},
        'brn': {backgroundColor: 'red', textColor: 'white'},
        'par': {backgroundColor: 'yellow', textColor: 'white'},
        'frz': {backgroundColor: 'blue', textColor: 'white'},
        'psn': {backgroundColor: 'purple', textColor: 'white'},
        'tox': {backgroundColor: 'purple', textColor: 'white'},
    } as {[key: string]: {backgroundColor: string, textColor: string}};
    const color = statusColors[status];
    return <span className={`flex items-center justify-center font-bold text-xs text-white bg-${status} mx-1 text-shadow-border1  rounded-md h-[12px] text-[7pt] py-[2px] px-[4px] mb-[1px]`} 
        style={{backgroundColor: color?.backgroundColor, color: color?.textColor}}>
            {status}
    </span>;
}


function getBoostMultiplier(boost: number){
    if(boost === 0) return 1;
    let result;
    if(boost > 0) result = (boost + 2) / 2;
    else result = 2 / (Math.abs(boost) + 2);

    return +result.toFixed(2);
}