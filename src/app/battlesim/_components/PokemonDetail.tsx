import { TypeBadgeSmall } from "@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pokemon } from "@pkmn/client";
import { StatID } from "@pkmn/data";
import { useState } from "react";
import { Activity, Shield, Zap } from "lucide-react";

interface PokemonDetailProps {
    pokemon: Pokemon;
    children: React.ReactNode;
    className?: string;
    key?: string;
    offset?: number;
    showFullInfo?: boolean; // Single prop to control detailed info visibility
}

export default function PokemonDetail({
    pokemon, 
    children, 
    className, 
    offset = 20,
    showFullInfo = false // Default to restricted info (live battle mode)
}: PokemonDetailProps) {
    const [activeTab, setActiveTab] = useState("info");
    
    let types;
    try {
        types = pokemon.types;
    } catch (error) {
        return <>{children}</>
    }
    if (!pokemon || !types) return <>{children}</>;

    // Determine if this is opponent's Pokémon (p2 side)
    const isOpponent = pokemon.side.n === 1;
    
    // Only show detailed info if explicitly requested or if it's the player's Pokémon
    const showDetailedInfo = showFullInfo || !isOpponent;
    
    const hpPercentage = pokemon.hp > 0 ? (pokemon.hp / pokemon.maxhp * 100) : 0;
    const hpColorClass = hpPercentage > 50 ? "bg-highlight-500" : hpPercentage > 20 ? "bg-yellow-500" : "bg-red-500";
    
    const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as StatID[];
    const hasBoosts = Object.keys(pokemon.boosts).length > 0;
    
    return (
        <HoverCard key={pokemon.name} openDelay={100} closeDelay={100}>
            <HoverCardTrigger className={className}>
                {children}
            </HoverCardTrigger>
            <HoverCardContent 
                className="bg-surface-800 bg-opacity-95 text-surface-100 w-[280px] p-0 overflow-hidden border-surface-600" 
                side="right" 
                align="start"
            >
                {/* Header - Always visible */}
                <div className="p-3 border-b border-surface-700">
                    <div className="flex justify-between items-baseline">
                        <span className="font-bold text-lg">{pokemon.name}</span>
                        <span className="text-sm">{pokemon.speciesForme} L{pokemon.level}</span>
                    </div>
                    
                    {/* Types and Tera Type */}
                    <div className="flex mt-1">
                        {types.map(type => <TypeBadgeSmall key={type} type={type} />)}
                        {pokemon.teraType && pokemon.isTerastallized && (
                            <div className="flex items-center ml-2">
                                <span className="text-xs mr-1">Tera:</span>
                                <TypeBadgeSmall key={pokemon.teraType} type={pokemon.teraType} />
                            </div>
                        )}
                    </div>
                    
                    {/* HP Bar - Show percentage for all, exact numbers only for detailed view */}
                    <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                            <span>HP: {hpPercentage.toFixed(1)}%</span>
                            {showDetailedInfo && (
                                <span>{pokemon.hp}/{pokemon.maxhp}</span>
                            )}
                        </div>
                        <div className="w-full bg-surface-700 rounded-full h-2">
                            <div className={`${hpColorClass} h-2 rounded-full`} style={{width: `${hpPercentage}%`}}></div>
                        </div>
                    </div>
                    
                    {/* Status Conditions */}
                    {pokemon.status && (
                        <div className="mt-2 py-1 px-2 rounded text-center text-sm font-medium text-surface-50" style={{
                            backgroundColor: getStatusColor(pokemon.status).bg,
                            color: getStatusColor(pokemon.status).text
                        }}>
                            {getStatusName(pokemon.status)}
                        </div>
                    )}
                </div>
                
                {/* Tabs for organizing content */}
                <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 h-9 bg-surface-900 rounded-none">
                        <TabsTrigger value="info" className="text-xs data-[state=active]:bg-surface-800">
                            <Activity className="h-3.5 w-3.5 mr-1" />
                            Info
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="text-xs data-[state=active]:bg-surface-800">
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            Stats
                        </TabsTrigger>
                        <TabsTrigger value="moves" className="text-xs data-[state=active]:bg-surface-800">
                            <Zap className="h-3.5 w-3.5 mr-1" />
                            Moves
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* Info Tab */}
                    <TabsContent value="info" className="p-0 m-0">
                        <ScrollArea className="h-[180px]">
                            <div className="p-3 space-y-3">
                                {/* Boosts - Always show for all Pokémon */}
                                {hasBoosts && (
                                    <div className="pb-2 border-b border-surface-700">
                                        <div className="text-sm font-semibold mb-1">Stat Changes:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(pokemon.boosts).map(([stat, value]) => (
                                                <div key={stat} className={`px-2 py-0.5 text-xs rounded ${
                                                    value > 0 ? "bg-highlight-500/20 text-highlight-400" : 
                                                    value < 0 ? "bg-red-500/20 text-red-400" : "bg-surface-700"
                                                }`}>
                                                    {stat}: {value > 0 ? `+${value}` : value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Speed Range - Show for all Pokémon */}
                                <div className="pb-2 border-b border-surface-700">
                                    <div className="text-sm font-semibold mb-1">Speed Range:</div>
                                    <div className="text-xs flex justify-between">
                                        <span className="text-surface-300">Minimum:</span>
                                        <span>{calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, 0.9, 0, 0)}</span>
                                    </div>
                                    <div className="text-xs flex justify-between">
                                        <span className="text-surface-300">Maximum:</span>
                                        <span>{calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, 1.1, 31, 252)}</span>
                                    </div>
                                </div>
                                
                                {/* Abilities Section - Only show in full info mode */}
                                {showDetailedInfo && (
                                    <div className="pb-2">
                                        <div className="text-sm font-semibold mb-1">Abilities:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {pokemon.species.abilities[0] && (
                                                <span className="px-2 py-0.5 text-xs bg-surface-700 rounded">{pokemon.species.abilities[0]}</span>
                                            )}
                                            {pokemon.species.abilities[1] && (
                                                <span className="px-2 py-0.5 text-xs bg-surface-700 rounded">{pokemon.species.abilities[1]}</span>
                                            )}
                                            {pokemon.species.abilities.H && (
                                                <span className="px-2 py-0.5 text-xs bg-surface-700 rounded">{pokemon.species.abilities.H} (H)</span>
                                            )}
                                        </div>
                                        {pokemon.ability && (
                                            <div className="mt-1 text-xs text-highlight-400">Active: {pokemon.ability}</div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Item Section - Only show in full info mode */}
                                {showDetailedInfo && pokemon.item && (
                                    <div className="pb-2">
                                        <div className="text-sm font-semibold mb-1">Item:</div>
                                        <div className="text-xs bg-surface-700 px-2 py-1 rounded inline-block">
                                            {pokemon.item}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    
                    {/* Stats Tab */}
                    <TabsContent value="stats" className="p-0 m-0">
                        <div className="p-3">
                            <div className="space-y-1">
                                {stats.map(stat => {
                                    const value = calculateStat(
                                        stat,
                                        pokemon.species.baseStats[stat],
                                        pokemon.level,
                                        31, // Assuming max IVs
                                        stat === 'hp' ? 0 : 0, // Default EVs
                                        1.0 // Neutral nature
                                    );
                                    const boost = stat !== 'hp' ? pokemon.boosts?.[stat as Exclude<StatID, 'hp'>] : undefined;
                                    const baseStatValue = pokemon.species.baseStats[stat];
                                    
                                    return (
                                        <div key={stat} className="flex items-center">
                                            <span className="capitalize w-8 text-xs font-medium">{stat}:</span>
                                            <div className="flex-1 mx-2">
                                                <div className="w-full bg-surface-700 h-2 rounded-full">
                                                    <div 
                                                        className={`h-2 rounded-full ${getStatBarColor(baseStatValue)}`} 
                                                        style={{width: `${Math.min(100, baseStatValue / 1.7)}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                            {/* Only show exact value in full info mode */}
                                            <span className="text-xs w-10 text-right">
                                                {showDetailedInfo ? (
                                                    <>
                                                        {value}
                                                        {boost && boost !== 0 && (
                                                            <span className={boost > 0 ? "text-highlight-400 ml-1" : "text-red-400 ml-1"}>
                                                                {boost > 0 ? `+${boost}` : boost}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-surface-400">{baseStatValue}</span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Additional info about base stats */}
                            <div className="mt-3 text-xs text-surface-400">
                                {showDetailedInfo ? (
                                    "Values adjusted for level and boosts"
                                ) : (
                                    "Only base stats are shown"
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    
                    {/* Moves Tab */}
                    <TabsContent value="moves" className="p-0 m-0">
                        <ScrollArea className="h-[180px]">
                            <div className="p-3">
                                {/* Show different content based on whether we show full info */}
                                <div className="text-sm font-semibold mb-2">
                                    {showDetailedInfo ? "Known moves:" : "Revealed moves:"}
                                </div>
                                
                                {pokemon.movesUsedWhileActive.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1">
                                        {pokemon.movesUsedWhileActive.map(move => (
                                            <div key={move} className="px-2 py-1 text-xs bg-surface-700 rounded">
                                                {move}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-surface-400 italic">
                                        {showDetailedInfo ? 
                                            "No moves data available" : 
                                            "No revealed moves yet"
                                        }
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </HoverCardContent>
        </HoverCard>
    );
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

function getStatBarColor(value: number) {
    if (value >= 120) return "bg-secondary-500";
    if (value >= 100) return "bg-highlight-500";
    if (value >= 80) return "bg-lime-500";
    if (value >= 60) return "bg-yellow-500";
    if (value >= 40) return "bg-orange-500";
    return "bg-red-500";
}

function getStatusColor(status: string) {
    switch (status) {
        case 'brn': return { bg: '#ff6633', text: 'white' };
        case 'frz': return { bg: '#99ccff', text: 'white' };
        case 'par': return { bg: '#ffcc33', text: 'white' };
        case 'psn': return { bg: '#cc66ff', text: 'white' };
        case 'tox': return { bg: '#993399', text: 'white' };
        case 'slp': return { bg: '#999999', text: 'white' };
        default: return { bg: '#444444', text: 'white' };
    }
}

function getStatusName(status: string) {
    switch (status) {
        case 'brn': return 'Burned';
        case 'frz': return 'Frozen';
        case 'par': return 'Paralyzed';
        case 'psn': return 'Poisoned';
        case 'tox': return 'Badly Poisoned';
        case 'slp': return 'Asleep';
        default: return status.toUpperCase();
    }
}