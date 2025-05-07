'use client';

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
  const natures = [
    'Adamant (+Atk, -SpA)', 'Bashful', 'Bold (+Def, -Atk)', 'Brave (+Atk, -Spe)', 
    'Calm (+SpD, -Atk)', 'Careful (+SpD, -SpA)', 'Docile', 'Gentle (+SpD, -Def)', 
    'Hardy', 'Hasty (+Spe, -Def)', 'Impish (+Def, -SpA)', 'Jolly (+Spe, -SpA)', 
    'Lax (+Def, -SpD)', 'Lonely (+Atk, -Def)', 'Mild (+SpA, -Def)', 
    'Modest (+SpA, -Atk)', 'Naive (+Spe, -SpD)', 'Naughty (+Atk, -SpD)', 
    'Quiet (+SpA, -Spe)', 'Quirky', 'Rash (+SpA, -SpD)', 'Relaxed (+Def, -Spe)', 
    'Sassy (+SpD, -Spe)', 'Serious', 'Timid (+Spe, -Atk)'
  ];
  
  const statusOptions = [
    'Healthy', 'Poisoned', 'Badly Poisoned', 'Burned', 'Paralyzed', 'Asleep', 'Frozen'
  ];

  // Get competitively relevant items first
  const commonItems = [
    { id: '', name: 'None' },
    { id: 'heavydutyboots', name: 'Heavy-Duty Boots' },
    { id: 'lifeorb', name: 'Life Orb' },
    { id: 'choicespecs', name: 'Choice Specs' },
    { id: 'choiceband', name: 'Choice Band' },
    { id: 'choicescarf', name: 'Choice Scarf' },
    { id: 'leftovers', name: 'Leftovers' },
    { id: 'focussash', name: 'Focus Sash' },
    { id: 'assaultvest', name: 'Assault Vest' },
    { id: 'expertbelt', name: 'Expert Belt' },
    { id: 'weaknesspolicy', name: 'Weakness Policy' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Nature</label>
        <select 
          className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={nature} 
          onChange={(e) => onNatureChange(e.target.value)}
        >
          {natures.map(n => (
            <option key={n} value={n.split(' ')[0]}>
              {n}
            </option>
          ))}
        </select>
      </div>
      
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
      
      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Item</label>
        <select
          className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={item}
          onChange={(e) => onItemChange(e.target.value)}
        >
          {/* Common items at the top */}
          <optgroup label="Common Items">
            {commonItems.map(i => (
              <option key={i.id} value={i.name}>{i.name}</option>
            ))}
          </optgroup>
          
          {/* All other items */}
          <optgroup label="All Items">
            {allItems
              .filter(i => !commonItems.some(common => common.id === i.id))
              .map(i => (
                <option key={i.id} value={i.name}>{i.name}</option>
              ))}
          </optgroup>
        </select>
      </div>
      
      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Status</label>
        <select
          className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}