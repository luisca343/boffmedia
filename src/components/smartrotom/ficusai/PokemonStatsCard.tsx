"use client";
import { Progress } from "@/components/ui/progress";
import { PokemonStats } from "./types";
import { getStatColor, statToPercentage } from "@/lib/pokemonColors";

interface PokemonStatsCardProps {
  data: {
    stats: PokemonStats;
    pokemonName: string;
  };
}

export default function PokemonStatsCard({ data }: PokemonStatsCardProps) {
  const { stats, pokemonName } = data;
  
  const statItems = [
    { label: "PS", value: stats.hp },
    { label: "Ataque", value: stats.attack },
    { label: "Defensa", value: stats.defense },
    { label: "At. Especial", value: stats.specialAttack },
    { label: "Def. Especial", value: stats.specialDefense },
    { label: "Velocidad", value: stats.speed },
  ];

  return (
    <div className="bg-surface-700/50 rounded-lg p-4 mt-3 border border-surface-600">
      <h3 className="text-lg font-bold text-surface-100 mb-2 text-center">
        {pokemonName}
      </h3>
      <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3 text-center">
        Estadísticas
      </h4>
      <div className="space-y-3">
        {statItems.map((stat, index) => {
          const color = getStatColor(stat.value);
          const percentage = statToPercentage(stat.value);
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm text-surface-300 font-medium">
                {stat.label}:
              </div>
              <div className="w-8 text-sm text-surface-200 font-mono">
                {stat.value}
              </div>
              <div className="flex-1">
                <div className="w-full bg-surface-600 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
