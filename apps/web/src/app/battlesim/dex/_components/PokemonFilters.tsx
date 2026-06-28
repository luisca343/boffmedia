'use client';

import { useDexContext } from '../_context/DexContext';
import PokemonTypeChip from './PokemonTypeChip';

export default function PokemonFilters() {
  const { activeFilters, removeFilter, clearFilters } = useDexContext();
  
  // Check if any filters are active
  const hasFilters = Object.values(activeFilters).some(arr => arr.length > 0);
  
  if (!hasFilters) return null;
  
  return (
    <div className="bg-layer-2 p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-ink">Filters:</h3>
        <button
          onClick={clearFilters}
          className="text-xs text-primary-hover hover:text-primary-hover"
        >
          (backspace = delete filter)
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {activeFilters.types.map(type => (
          <PokemonTypeChip
            key={`type-${type}`}
            type={type}
            onClick={() => removeFilter('types', type)}
            clickable
          />
        ))}
        
        {activeFilters.moves.map(move => (
          <span
            key={`move-${move}`}
            className="bg-amber-800 text-amber-100 text-xs px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
            onClick={() => removeFilter('moves', move)}
          >
            {move}
            <span className="text-amber-300">×</span>
          </span>
        ))}
        
        {activeFilters.abilities.map(ability => (
          <span
            key={`ability-${ability}`}
            className="bg-secondary-soft text-secondary-hover text-xs px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
            onClick={() => removeFilter('abilities', ability)}
          >
            {ability}
            <span className="text-secondary-hover">×</span>
          </span>
        ))}
        
        {activeFilters.eggGroups.map(eggGroup => (
          <span
            key={`egg-${eggGroup}`}
            className="bg-warning-soft text-warning-hover text-xs px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
            onClick={() => removeFilter('eggGroups', eggGroup)}
          >
            {eggGroup}
            <span className="text-warning-hover">×</span>
          </span>
        ))}
        
        {activeFilters.tiers.map(tier => (
          <span
            key={`tier-${tier}`}
            className="bg-secondary-soft text-secondary-hover text-xs px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
            onClick={() => removeFilter('tiers', tier)}
          >
            {tier}
            <span className="text-secondary-hover">×</span>
          </span>
        ))}
      </div>
    </div>
  );
}