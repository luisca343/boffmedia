import { InternalLink } from "@/components/ui/navigation/Link"
import { PokemonService } from "@/services/api/smartrotom/pokemonService";
import { getTranslations } from "next-intl/server";
import { MapPinIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { getTranslatedBiomeName } from "@/utils/pokemonTranslations";

export default async function Biomas(){
    const t = await getTranslations("pokedex");
    const biomesResponse = await PokemonService.getBiomes();
    const biomes = biomesResponse.data as { name: string; count: number }[];
    
    return(
        <div className="bg-layer-2 min-h-full overflow-auto">
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                <div className="bg-layer-3/30 rounded-lg p-4 border border-edge/50 mb-4">
                    <div className="flex items-center mb-3">
                        <MapPinIcon className="h-6 w-6 text-primary-hover mr-2" />
                        <h1 className="text-xl font-bold text-ink">Localización de Pokémon</h1>
                    </div>
                    
                    <p className="text-ink mb-4">
                        Explora diferentes biomas y descubre qué Pokémon puedes encontrar en cada uno. 
                        Selecciona un bioma para ver los Pokémon disponibles.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {biomes
                        .filter((biome) => !biome.name.includes("biomesoplenty") && !biome.name.includes("terraforged"))
                        .sort((a, b) => {
                            // Sort by number of Pokémon in descending order
                            return b.count - a.count;
                        })
                        .map((biome, index) => {
                            const biomeName = getTranslatedBiomeName(biome.name, t);
                            
                            return (
                                <InternalLink href={`pokedex/localizacion/${biome.name}`} key={index}>
                                    <div className="flex flex-col items-center justify-center text-center p-4 h-36 
                                                rounded-lg border border-edge bg-layer-3/50
                                                hover:bg-layer-3/80 hover:border-edge hover:text-ink transition-all
                                                shadow-md hover:shadow-lg group">
                                        <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <MapPinIcon className="h-6 w-6 text-primary-hover mx-auto" />
                                        </div>
                                        <span className="text-lg font-bold text-ink mb-2 group-hover:text-ink transition-colors line-clamp-2">
                                            {biomeName}
                                        </span>
                                        <div className="flex items-center justify-center space-x-2">
                                            <ArchiveBoxIcon className="h-4 w-4 text-amber-400" />
                                            <span className="text-xl text-amber-400 font-medium">
                                                {biome.count}
                                            </span>
                                        </div>
                                    </div>
                                </InternalLink>
                            );
                        })}
                </div>
                
                {/* If there are no valid biomes to display */}
                {biomes.filter((biome) => !biome.name.includes("biomesoplenty") && !biome.name.includes("terraforged")).length === 0 && (
                    <div className="bg-layer-3/30 rounded-lg p-8 text-center border border-edge/50">
                        <p className="text-ink text-lg">No se encontraron biomas disponibles</p>
                    </div>
                )}
            </div>
        </div>
    );
}