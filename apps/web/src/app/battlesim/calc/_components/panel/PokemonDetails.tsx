'use client';

import { NATURES, STATUS_OPTIONS, COMMON_ITEMS } from '../../_utils/pokemonData';
import { useCalcContext } from '../../_context/CalcContext';

interface PokemonDetailsProps {
  nature: string;
  ability: string;
  item: string;
  status: string;
  pokemonAbilities: string[];
  allAbilities: { id: string; name: string }[];
  allItems: { id: string; name: string }[];
  onNatureChange: (nature: string) => void;
  onAbilityChange: (ability: string) => void;
  onItemChange: (item: string) => void;
  onStatusChange: (status: string) => void;
}

export default function PokemonDetails({
  nature,
  ability,
  item,
  status,
  pokemonAbilities,
  allAbilities,
  allItems,
  onNatureChange,
  onAbilityChange,
  onItemChange,
  onStatusChange
}: PokemonDetailsProps) {
  // Get the current generation to determine feature availability
  const { genInstance } = useCalcContext();
  const genNumber = genInstance?.num || 9; // Default to Gen 9 if not available
  
  // Check for generation-specific features
  const showNatures = genNumber >= 3; // Natures introduced in Gen 3
  const showAbilities = genNumber >= 3; // Abilities introduced in Gen 3
  const showItems = genNumber >= 2; // Items introduced in Gen 2, but limited
  
  // Determine grid layout based on what's shown
  const gridCols = (() => {
    let visibleColumns = 0;
    if (showNatures) visibleColumns++;
    if (showAbilities) visibleColumns++;
    if (showItems) visibleColumns++;
    visibleColumns++; // Always show Status
    
    return visibleColumns === 1 ? "grid-cols-1" : 
           visibleColumns === 2 ? "grid-cols-1 sm:grid-cols-2" :
           visibleColumns === 3 ? "grid-cols-1 sm:grid-cols-3" :
           "grid-cols-1 sm:grid-cols-2";
  })();

  return (
    <div className={`grid ${gridCols} gap-2 mb-2`}>
      {/* Only show Nature selector for Gen 3+ */}
      {showNatures && (
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Nature</label>
          <select 
            className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
            value={nature} 
            onChange={(e) => onNatureChange(e.target.value)}
          >
            {NATURES.map(n => (
              <option key={n} value={n.split(' ')[0]}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Only show Ability selector for Gen 3+ */}
      {showAbilities && (
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Ability</label>
          <select
            className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
            value={ability}
            onChange={(e) => onAbilityChange(e.target.value)}
          >
            {/* Show species-specific abilities first */}
            {pokemonAbilities.length > 0 && (
              <optgroup label="Available Abilities">
                {pokemonAbilities.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </optgroup>
            )}
            
            {/* Show all other abilities in case of special scenarios */}
            <optgroup label="All Abilities">
              {allAbilities.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      )}
      
      {/* Only show Item selector for Gen 2+ */}
      {showItems && (
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Item</label>
          <select
            className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
            value={item}
            onChange={(e) => onItemChange(e.target.value)}
          >
            {/* Common items at the top */}
            <optgroup label="Common Items">
              {COMMON_ITEMS.map(i => (
                <option key={i.id} value={i.name}>{i.name}</option>
              ))}
            </optgroup>
            
            {/* All other items */}
            <optgroup label="All Items">
              {allItems
                .filter(i => !COMMON_ITEMS.some(common => common.id === i.id))
                .map(i => (
                  <option key={i.id} value={i.name}>{i.name}</option>
                ))}
            </optgroup>
          </select>
        </div>
      )}
      
      {/* Status is always shown */}
      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Status</label>
        <select
          className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}