"use client"
import { PossibleSpawnsSection } from "../../_components/PossibleSpawns";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useGetPokemonByBiome } from "@/hooks/pokemon/useGetPokemonByBiome";
import { 
    AdjustmentsHorizontalIcon, 
    EyeIcon, 
    ArrowLeftIcon 
} from "@heroicons/react/24/outline";
import { InternalLink } from "@/components/nav/Link";

export default function Localizacion({params} : {params: {id: string}}){
    const { id } = params;
    const { pokemon } = useGetPokemonByBiome(id)
    const [showCaught, setShowCaught] = useState(false)
    const [showSeen, setShowSeen] = useState(false)
    
    const t = useTranslations("pokedex");
    
    if(!pokemon) {
        return (
            <div className="bg-surface-800 min-h-full p-8 flex flex-col items-center justify-center">
                <div className="text-surface-300 text-xl">No se encontraron datos para este bioma</div>
                <InternalLink href="/pokedex/localizacion" className="mt-4 text-primary-400 hover:text-primary-300 flex items-center">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Volver a la lista de biomas
                </InternalLink>
            </div>
        );
    }

    // Format the biome name for display
    const formatBiomeTitle = (rawBiome: string) => {
        return t(rawBiome.replace(":", "_").replace("%3A","_").replace("%20","_"))
            || rawBiome.replace(/:/g, " ").replace(/%3A/g, " ").replace(/%20/g, " ");
    };

    const biomeTitle = formatBiomeTitle(id);

    return(
        <div className="bg-surface-800 min-h-full overflow-auto">
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                <div className="flex flex-col space-y-4">
                    {/* Header with biome name and back button */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-surface-50">{biomeTitle}</h1>
                        <InternalLink 
                            href="/pokedex/localizacion" 
                            className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Volver a biomas
                        </InternalLink>
                    </div>
                    
                    {/* Filter controls */}
                    <div className="bg-surface-700/30 rounded-lg p-4 border border-surface-600/50">
                        <div className="flex items-center mb-3">
                            <AdjustmentsHorizontalIcon className="h-5 w-5 text-primary-300 mr-2" />
                            <h2 className="text-lg font-semibold text-surface-100">Filtros</h2>
                        </div>
                        
                        <div className="bg-surface-800/50 rounded-lg p-3">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        id="show-seen" 
                                        checked={showSeen} 
                                        onCheckedChange={setShowSeen}
                                    />
                                    <Label htmlFor="show-seen" className="text-surface-50 flex items-center">
                                        <EyeIcon className="h-4 w-4 mr-1" />
                                        Avistados
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        id="show-caught" 
                                        checked={showCaught} 
                                        onCheckedChange={setShowCaught} 
                                    />
                                    <Label htmlFor="show-caught" className="text-surface-50 flex items-center">
                                        <img 
                                            src="/smartrotom/img/apps/pokedex/capturado.webp" 
                                            alt="Capturado" 
                                            className="h-4 w-4 mr-1" 
                                        />
                                        Atrapados
                                    </Label>
                                </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-surface-400 italic">
                                {(showCaught || showSeen) ? 
                                    `${showCaught || showSeen ? 'Ocultando Pokémon' : ''} ${showCaught ? "atrapados" : ""}${showCaught && showSeen ? " y " : ""}${showSeen ? "avistados" : ""}` :
                                    "Mostrando todos los Pokémon"
                                }
                            </div>
                        </div>
                    </div>
                    
                    {/* Pokémon sections in a single column layout */}
                    <div className="flex flex-col space-y-4">
                        {Object.entries(pokemon).map(([biome, spawn], index) => (
                            <div key={index} className="bg-surface-700/30 rounded-lg p-4 border border-surface-600/50">
                                <PossibleSpawnsSection 
                                    pokemonSpawns={spawn} 
                                    hideCaught={showCaught} 
                                    hideSeen={showSeen} 
                                    title={formatBiomeTitle(biome)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}