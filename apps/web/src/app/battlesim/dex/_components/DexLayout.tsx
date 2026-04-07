'use client';

import { useDexContext } from '../_context/DexContext';
import DexHeader from './DexHeader';
import PokemonSearchBar from './PokemonSearchBar';
import PokemonFilters from './PokemonFilters';
import PokemonGrid from './PokemonGrid';
import PokemonDetail from './PokemonDetail';

export default function DexLayout() {
  const { 
    isLoading, 
    activeFilters,
    selectedPokemon
  } = useDexContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <DexHeader />
      
      <div className="mb-4">
        <PokemonSearchBar />
      </div>
      
      <div className="mb-4">
        <PokemonFilters />
      </div>
      
      {selectedPokemon ? (
        <PokemonDetail pokemonId={selectedPokemon} />
      ) : (
        <PokemonGrid />
      )}
    </div>
  );
}