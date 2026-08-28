"use client";
import { Badge } from "@/components/ui/primitives/badge";
import { useTranslations } from "next-intl";
import { getTranslatedBiomeName, filterVisibleBiomes } from "@/utils/pokemonTranslations";

interface BiomeListCardProps {
  biomes: string[];
}

export default function BiomeListCard({ biomes }: BiomeListCardProps) {
  const t = useTranslations("pokedex");
  // Was rendering every namespace, unlike the four other biome views.
  const visible = filterVisibleBiomes(biomes);
  
  return (
    <div className="bg-layer-3/50 rounded-lg p-4 mt-3 border border-edge">
      <h3 className="text-lg font-bold text-ink mb-4">Biomas</h3>
      <div className="flex flex-wrap gap-2">
        {visible.map((biome, index) => (
          <Badge 
            key={index}
            variant="outline"
            className="bg-warning/20 border-warning-border text-warning-hover hover:bg-warning/30"
          >
            {getTranslatedBiomeName(biome, t)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
