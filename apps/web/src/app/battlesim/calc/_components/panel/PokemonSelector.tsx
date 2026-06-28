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
      <label className="block text-xs font-medium mb-1 text-ink">{title}</label>
      <select 
        className="w-full p-1 border rounded bg-layer-3 border-edge text-ink focus:ring-primary focus:border-primary text-sm"
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