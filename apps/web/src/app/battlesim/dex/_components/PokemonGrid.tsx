'use client';

import { useDexContext } from '../_context/DexContext';
import { useState } from 'react';
import PokemonListTable from './PokemonListTable';
import MovesTable from './MovesTable';
import AbilitiesList from './AbilitiesList';
import ItemsList from './ItemsList';

export default function PokemonGrid() {
  const { 
    filteredPokemon, 
    filteredMoves, 
    filteredAbilities, 
    filteredItems, 
    currentSearchCategory,
    setSelectedPokemon,
    addFilter,
    currentGeneration
  } = useDexContext();
  
  const [displayLimit, setDisplayLimit] = useState(100);
  
  // Handle item click based on category
  const handlePokemonClick = (id: string) => {
    setSelectedPokemon(id);
  };
  
  const handleMoveClick = (name: string) => {
    addFilter('moves', name);
  };
  
  const handleAbilityClick = (name: string) => {
    addFilter('abilities', name);
  };
  
  const handleItemClick = (name: string) => {
    // For items, we might just want to show a tooltip or details
    console.log('Item selected:', name);
  };
  
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 100);
  };
  
  // Determine what data to display based on current category
  const renderContent = () => {
    switch (currentSearchCategory) {
      case 'search':
        return renderCompactSearchView();
      case 'pokemon':
        return (
          <PokemonListTable
            pokemon={filteredPokemon}
            onPokemonClick={handlePokemonClick}
            displayLimit={displayLimit}
            onLoadMore={handleLoadMore}
            currentGeneration={currentGeneration}
          />
        );
      case 'moves':
        return (
          <MovesTable
            moves={filteredMoves}
            onMoveClick={handleMoveClick}
            displayLimit={displayLimit}
            onLoadMore={handleLoadMore}
          />
        );
      case 'abilities':
        return (
          <AbilitiesList
            abilities={filteredAbilities}
            onAbilityClick={handleAbilityClick}
            displayLimit={displayLimit}
            onLoadMore={handleLoadMore}
          />
        );
      case 'items':
        return (
          <ItemsList
            items={filteredItems}
            onItemClick={handleItemClick}
            displayLimit={displayLimit}
            onLoadMore={handleLoadMore}
          />
        );
      default:
        return <div>No data available</div>;
    }
  };

  // Unified search view showing results from all categories
  const renderCompactSearchView = () => {
    const hasMovesResults = filteredMoves.length > 0;
    const hasPokemonResults = filteredPokemon.length > 0;
    const hasAbilityResults = filteredAbilities.length > 0;
    const hasItemResults = filteredItems.length > 0;
    
    return (
      <div className="space-y-6">
        {/* Pokémon Results */}
        {hasPokemonResults && (
          <PokemonListTable
            pokemon={filteredPokemon.slice(0, 10)}
            onPokemonClick={handlePokemonClick}
            displayLimit={10}
            onLoadMore={() => {}} // No load more in search view
            currentGeneration={currentGeneration}
            compact={true}
          />
        )}

        {/* Moves Results */}
        {hasMovesResults && (
          <MovesTable
            moves={filteredMoves.slice(0, 10)}
            onMoveClick={handleMoveClick}
            displayLimit={10}
            onLoadMore={() => {}} // No load more in search view
            compact={true}
          />
        )}

        {/* Abilities Results */}
        {hasAbilityResults && (
          <AbilitiesList
            abilities={filteredAbilities.slice(0, 10)}
            onAbilityClick={handleAbilityClick}
            displayLimit={10}
            onLoadMore={() => {}} // No load more in search view
            compact={true}
          />
        )}

        {/* Items Results */}
        {hasItemResults && (
          <ItemsList
            items={filteredItems.slice(0, 10)}
            onItemClick={handleItemClick}
            displayLimit={10}
            onLoadMore={() => {}} // No load more in search view
            compact={true}
          />
        )}

        {!hasPokemonResults && !hasMovesResults && !hasAbilityResults && !hasItemResults && (
          <div className="text-center text-surface-400 py-10">
            No results found. Try a different search term.
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="mt-4">
      {renderContent()}
    </div>
  );
}