"use client";
import { Badge } from "@/components/ui/primitives/badge";
import { useTranslations } from "next-intl";
import { getTranslatedBiomeName } from "@/utils/pokemonTranslations";

interface PokemonHabitatCardProps {
  data: {
    habitat: string[];
    pokemonName: string;
  };
}

export default function PokemonHabitatCard({ data }: PokemonHabitatCardProps) {
  const t = useTranslations("pokedex");
  const { habitat, pokemonName } = data;
  
  // Filter out biomes with '.biomesoplenty' in their name
  const filteredBiomes = habitat.filter(biome => !biome.includes('biomesoplenty') && !biome.includes('terraforged'));

  return (
    <div className="bg-surface-700/50 rounded-lg p-4 mt-3 border border-surface-600">
      <h3 className="text-lg font-bold text-surface-100 mb-2 text-center">
        {pokemonName}
      </h3>
      <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3 text-center">
        Hábitat
      </h4>
      <div className="flex flex-wrap gap-2 justify-center">
        {filteredBiomes.map((biome, index) => (
          <Badge 
            key={index}
            variant="outline"
            className="bg-highlight-600/20 border-highlight-500 text-highlight-300 hover:bg-highlight-600/30"
          >
            {getTranslatedBiomeName(biome, t)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
