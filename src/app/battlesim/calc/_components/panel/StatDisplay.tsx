'use client';

import { StatsTable, BoostsTable } from "../../types";
import { StatCalculator } from "../../_utils/statCalculator";

interface StatDisplayProps {
  baseStats: StatsTable;
  evs: StatsTable;
  ivs: StatsTable;
  boosts: BoostsTable;
  nature: string;
  level: number;
  onStatChange: (stat: string, value: number, isEV: boolean) => void;
  onBoostChange: (stat: string, value: number) => void;
}

export default function StatDisplay({
  baseStats,
  evs,
  ivs,
  boosts,
  nature,
  level,
  onStatChange,
  onBoostChange
}: StatDisplayProps) {
  const natureModifiers = StatCalculator.getNatureMultipliers(nature);
  
  const statLabels = {
    hp: "HP",
    atk: "Atk",
    def: "Def", 
    spa: "SpA",
    spd: "SpD",
    spe: "Spe"
  };

  // Calculate stats
  const calculatedStats = StatCalculator.calculateAllStats(baseStats, evs, ivs, level, nature);
  
  // Apply boosts to stats (except HP)
  const boostedStats = StatCalculator.applyAllBoosts(calculatedStats, boosts);

  return (
    <div className="mb-2 max-w-[75%] ml-1">
      <div className="grid grid-cols-6 gap-2 mb-1 text-xs text-surface-400">
        <div className="text-left pl-1">Stat</div>
        <div className="text-center">Base</div>
        <div className="text-center">IVs</div>
        <div className="text-center">EVs</div>
        <div className="text-center">Total</div>
        <div className="text-center">Boost</div>
      </div>
      
      {Object.entries(statLabels).map(([stat, label]) => {
        const statKey = stat as keyof typeof baseStats;
        const hasNatureBuff = stat !== 'hp' && natureModifiers[statKey as keyof typeof natureModifiers] === 1.1;
        const hasNatureNerf = stat !== 'hp' && natureModifiers[statKey as keyof typeof natureModifiers] === 0.9;
        
        return (
          <div 
            key={stat} 
            className="grid grid-cols-6 gap-2 mb-1 text-xs items-center"
          >
            <div>
              <span className={`${hasNatureBuff ? 'text-red-500 font-medium' : ''} ${hasNatureNerf ? 'text-blue-400 font-medium' : ''} text-surface-200`}>
                {label}
              </span>
            </div>
            
            <div className="text-center text-surface-300">
              {baseStats[statKey]}
            </div>
            
            <div className="text-center">
              <input
                type="number"
                className="w-full py-0 px-1 h-6 border rounded text-center bg-surface-700 border-surface-600 text-surface-100 text-xs"
                min="0"
                max="31"
                value={ivs[statKey]}
                onChange={(e) => onStatChange(stat, parseInt(e.target.value) || 0, false)}
              />
            </div>
            
            <div className="text-center">
              <input
                type="number"
                className="w-full py-0 px-1 h-6 border rounded text-center bg-surface-700 border-surface-600 text-surface-100 text-xs"
                min="0"
                max="252"
                step="4"
                value={evs[statKey]}
                onChange={(e) => onStatChange(stat, parseInt(e.target.value) || 0, true)}
              />
            </div>
            
            <div className="text-center font-medium text-primary-300">
              {stat !== 'hp' && boosts[stat as keyof typeof boosts] !== 0 
                ? `${calculatedStats[statKey]} → ${boostedStats[statKey]}`
                : calculatedStats[statKey]
              }
            </div>
            
            <div className="text-center">
              {stat !== 'hp' ? (
                <select
                  className="w-full py-0 px-0 h-6 border rounded text-center bg-surface-700 border-surface-600 text-surface-100 text-xs"
                  value={boosts[stat as keyof typeof boosts]}
                  onChange={(e) => onBoostChange(stat, parseInt(e.target.value))}
                >
                  {Array.from({length: 13}, (_, i) => i - 6).map(boost => (
                    <option key={boost} value={boost}>{boost > 0 ? `+${boost}` : boost}</option>
                  ))}
                </select>
              ) : (
                "—"
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}