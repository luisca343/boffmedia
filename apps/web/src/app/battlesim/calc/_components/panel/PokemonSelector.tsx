'use client';

interface PokemonSelectorProps {
  title: string;
  pokemon: any[];
  selectedPokemonId: string;
  onChange: (pokemonId: string) => void;
}

export default function PokemonSelector({
  title,
  pokemon,
  selectedPokemonId,
  onChange
}: PokemonSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1 text-surface-200">{title}</label>
      <select 
        className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 focus:ring-primary-500 focus:border-primary-500 text-sm"
        value={selectedPokemonId} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select Pokémon</option>
        {pokemon.map(poke => {
          return <option key={poke.id} value={poke.id}>
            {poke.name}
          </option>
})}
      </select>
    </div>
  );
}