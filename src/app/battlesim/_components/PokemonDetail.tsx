import { TypeBadgeSmall } from "@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Pokemon } from "@pkmn/client";
import { StatID } from "@pkmn/data";

export default function PokemonDetail({pokemon, children, className, offset = 20}: 
    {pokemon: Pokemon, children: any, className?: string, key?: string, offset?: number}) {
    let types;
    try {
        types = pokemon.types;
    } catch (error) {
        return <>{children}</>
    }
    if (!pokemon || !types) return <></>;

    const hpPercentage = pokemon.hp > 0 ? (pokemon.hp / pokemon.maxhp * 100) : 0;
    const hpColorClass = hpPercentage > 50 ? "bg-green-500" : hpPercentage > 20 ? "bg-yellow-500" : "bg-red-500";
    
    const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as StatID[];
    
    // Determine if this is opponent's Pokémon (p2 side)
    const isOpponent = pokemon.side.n === 1;
    
    return <HoverCard key={pokemon.name} openDelay={0} closeDelay={0}>
        <HoverCardTrigger className={className}>
            {children}
        </HoverCardTrigger>
        <HoverCardContent className="bg-surface-800 bg-opacity-90 text-surface-100 w-128 px-3 py-2 text-start" 
            style={{ zIndex: 9999 }} 
            side="bottom" 
            align="end">
            <div className="flex flex-col border-b-2 border-surface-50 pb-2">
                <div className="flex justify-between items-baseline">
                    <span className="font-bold text-lg">{pokemon.name}</span>
                    <span className="text-sm">{pokemon.speciesForme} L{pokemon.level}</span>
                </div>
                <div className="flex">
                    {types.map(type => <TypeBadgeSmall key={type} type={type} />)}
                    {pokemon.teraType && pokemon.isTerastallized && (
                        <div className="flex items-center ml-2">
                            <span className="text-xs mr-1">Tera:</span>
                            <TypeBadgeSmall key={pokemon.teraType} type={pokemon.teraType} />
                        </div>
                    )}
                </div>
                
                {/* HP Bar */}
                <div className="mt-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span>HP: {hpPercentage.toFixed(1)}%</span>
                        <span>{pokemon.hp}/{pokemon.maxhp}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className={`${hpColorClass} h-2 rounded-full`} style={{width: `${hpPercentage}%`}}></div>
                    </div>
                </div>
            </div>
            
            {/* Stats Section - Only show for player's Pokémon */}
            {!isOpponent && (
                <div className="grid grid-cols-2 gap-1 py-2 border-b border-surface-600">
                    {stats.map(stat => {
                        const value = calculateStat(
                            stat,
                            pokemon.species.baseStats[stat],
                            pokemon.level,
                            31, // Assuming max IVs
                            stat === 'hp' ? 0 : 0, // Default EVs
                            1.0 // Neutral nature
                        );
                        const boost = pokemon.boosts?.[stat];
                        return (
                            <div key={stat} className="flex justify-between">
                                <span className="capitalize">{stat}:</span>
                                <span>
                                    {value}
                                    {boost && boost !== 0 && (
                                        <span className={boost > 0 ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                                            {boost > 0 ? `+${boost}` : boost}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Speed Range - Show for all Pokémon */}
            <div className="py-2 border-b border-surface-600">
                <div className="flex justify-between">
                    <span>Speed range:</span>
                    <span>{calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, 0.9, 0, 0)} - {calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, 1.1, 31, 252)}</span>
                </div>
            </div>
            
            {/* Abilities Section - Only show for player's Pokémon */}
            {!isOpponent && (
                <div className="py-2 border-b border-surface-600">
                    <div className="text-sm font-semibold mb-1">Abilities:</div>
                    <div className="flex flex-wrap gap-1">
                        {pokemon.species.abilities[0] && (
                            <span className="px-1 text-sm bg-surface-700 rounded">{pokemon.species.abilities[0]}</span>
                        )}
                        {pokemon.species.abilities[1] && (
                            <span className="px-1 text-sm bg-surface-700 rounded">{pokemon.species.abilities[1]}</span>
                        )}
                        {pokemon.species.abilities.H && (
                            <span className="px-1 text-sm bg-surface-700 rounded">{pokemon.species.abilities.H} (Hidden)</span>
                        )}
                        {pokemon.species.abilities.S && (
                            <span className="px-1 text-sm bg-surface-700 rounded">{pokemon.species.abilities.S} (Special)</span>
                        )}
                    </div>
                    {pokemon.ability && (
                        <div className="mt-1 text-sm text-green-400">Active: {pokemon.ability}</div>
                    )}
                </div>
            )}
            
            {/* Item Section - Only show for player's Pokémon */}
            {!isOpponent && pokemon.item && (
                <div className="py-2 border-b border-surface-600">
                    <span className="text-sm font-semibold">Item:</span> {pokemon.item}
                </div>
            )}
            
            {/* Moves Section - Only show for player's Pokémon */}
            {!isOpponent && pokemon.movesUsedWhileActive.length > 0 && (
                <div className="py-2">
                    <div className="text-sm font-semibold mb-1">Known moves:</div>
                    <div className="grid grid-cols-2 gap-1">
                        {pokemon.movesUsedWhileActive.map(move => (
                            <div key={move} className="px-2 py-1 text-sm bg-surface-700 rounded">
                                {move}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </HoverCardContent>
    </HoverCard>
}

function calculateSpeed(base: number, level: number, natureModifier: number, IV: number, EV: number) {
    return Math.floor(
        Math.floor(
            (2 * base + IV + Math.floor(EV / 4)) * level / 100 + 5
        ) * natureModifier
    );
}

function calculateStat(stat: StatID, base: number, level: number, IV: number, EV: number, natureModifier: number) {
    if (stat === 'hp') {
        return Math.floor((2 * base + IV + Math.floor(EV / 4)) * level / 100) + level + 10;
    } else {
        return Math.floor(
            Math.floor(
                (2 * base + IV + Math.floor(EV / 4)) * level / 100 + 5
            ) * natureModifier
        );
    }
}