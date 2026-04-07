"use client";
import TypeBadge from "@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge";

interface PokemonTypesCardProps {
  data: {
    types: string[];
    pokemonName: string;
  };
}

export default function PokemonTypesCard({ data }: PokemonTypesCardProps) {
  const { types, pokemonName } = data;
  
  return (
    <div className="bg-surface-700/50 rounded-lg p-4 mt-3 border border-surface-600">
      <h3 className="text-lg font-bold text-surface-100 mb-2 text-center">
        {pokemonName}
      </h3>
      <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3 text-center">
        Tipos
      </h4>
      <div className="flex flex-wrap gap-2 justify-center">
        {types.map((type, index) => (
          <TypeBadge key={index} type={type} />
        ))}
      </div>
    </div>
  );
}
