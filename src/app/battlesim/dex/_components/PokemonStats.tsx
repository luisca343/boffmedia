'use client';

import StatBar from './StatBar';

interface PokemonStatsProps {
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

export default function PokemonStats({ baseStats }: PokemonStatsProps) {
  const total = Object.values(baseStats).reduce((sum, stat) => sum + stat, 0);
  
  // Maximum stat value for scaling (usually 255, but we'll use a more common maximum)
  const maxStat = 180;
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-sm font-medium text-surface-300">Base Stats</h3>
        <span className="text-xs text-surface-400">Total: {total}</span>
      </div>
      
      <div className="space-y-3">
        <StatBar 
          label="HP" 
          value={baseStats.hp} 
          maxValue={maxStat} 
          color="bg-red-500" 
        />
        <StatBar 
          label="Attack" 
          value={baseStats.atk} 
          maxValue={maxStat} 
          color="bg-orange-500" 
        />
        <StatBar 
          label="Defense" 
          value={baseStats.def} 
          maxValue={maxStat} 
          color="bg-yellow-500" 
        />
        <StatBar 
          label="Sp. Atk" 
          value={baseStats.spa} 
          maxValue={maxStat} 
          color="bg-blue-500" 
        />
        <StatBar 
          label="Sp. Def" 
          value={baseStats.spd} 
          maxValue={maxStat} 
          color="bg-green-500" 
        />
        <StatBar 
          label="Speed" 
          value={baseStats.spe} 
          maxValue={maxStat} 
          color="bg-pink-500" 
        />
      </div>
    </div>
  );
}