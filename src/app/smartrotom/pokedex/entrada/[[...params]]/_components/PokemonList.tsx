"use client"
import { useState, useEffect } from "react";
import { PokemonService } from "@/services/api/smartrotom/pokemonService";
import { InternalLink } from "@/components/nav/Link";
import { useTranslations } from "next-intl";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getDisplayStatus } from "../../../dexUtils";
import { PokemonSprite } from "../../../_components/PokemonSprite";

export default function PokemonList() {
  const [pokemonList, setPokemonList] = useState<Array<{dex: number, name: string, spriteUrl: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("pokedex");

  useEffect(() => {
    async function fetchPokemonList() {
      try {
        const response = await PokemonService.getAllPokemon();
        setPokemonList(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch Pokemon list:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPokemonList();
  }, []);

  const filteredPokemon = pokemonList.filter(pokemon => {
    const name = getDisplayStatus(pokemon.dex, 'base', true) ? pokemon.name : '???';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pokemon.dex.toString().includes(searchQuery) ||
      (name === '???' && searchQuery.toLowerCase().includes('???'))
    );
  });

  if (loading) {
    return (
      <div className="bg-surface-800 min-h-full overflow-auto flex justify-center items-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent"></div>
          <div className="text-surface-100 text-xl">Cargando Pokédex...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-800 min-h-full overflow-auto">
      <div className="mt-4 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-surface-700/30 rounded-lg p-4 border border-surface-600/50 mb-4">
          <h1 className="text-xl font-bold text-surface-50">Explorar Pokédex</h1>
          <p className="text-surface-200">
            Explora todos los Pokémon registrados. Haz clic en un Pokémon para ver su información detallada.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-surface-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o número..."
            className="bg-surface-700/50 border border-surface-600 text-surface-100 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pokemon grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredPokemon.map((pokemon) => {
            const isSeen = getDisplayStatus(pokemon.dex, 'base', true);
            return (
              <InternalLink 
                href={`/pokedex/entrada/${pokemon.dex}`} 
                key={pokemon.dex}
                className="block"
              >
                <div className="bg-surface-700/50 border border-surface-600 rounded-lg p-3 hover:bg-surface-600/70 hover:border-surface-500 transition-all flex flex-col items-center">
                  <PokemonSprite 
                    id={pokemon.dex} 
                    form="base" 
                    palette="none" 
                    width={80} 
                    height={80}
                    hide={true}
                    url={pokemon.spriteUrl}
                  />
                  <div className="text-center mt-1">
                    <div className="text-xs text-surface-400">#{pokemon.dex.toString().padStart(3, '0')}</div>
                    <div className="text-surface-100 font-medium truncate w-full">
                      {isSeen ? (t(`pixelmon_${pokemon.name.toLowerCase()}`) || pokemon.name) : '???'}
                    </div>
                  </div>
                </div>
              </InternalLink>
            );
          })}
        </div>
        
        {filteredPokemon.length === 0 && (
          <div className="bg-surface-700/30 rounded-lg p-8 text-center border border-surface-600/50">
            <p className="text-surface-300 text-lg">No se encontraron Pokémon que coincidan con la búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}