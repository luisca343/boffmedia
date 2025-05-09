'use client';

import { StatsTable, BoostsTable } from "../../types";
import { StatCalculator } from "../../_utils/statCalculator";
import { calcStat } from "@smogon/calc";
import { useCalcContext } from "../../_context/CalcContext";

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
  // Get the current generation from context
  const { currentGeneration, genInstance } = useCalcContext();
  
  // Get the generation number for calculation
  const genNumber = genInstance?.num || 9; // Default to Gen 9 if not available
  
  // Check if we're in Gen 1-2
  const isEarlyGen = genNumber <= 2;
  
  const natureModifiers = StatCalculator.getNatureMultipliers(nature);
  
  const statLabels = {
    hp: "HP",
    atk: "Atk",
    def: "Def", 
    spa: genNumber === 1 ? "Spc" : "SpA", // In Gen 1, it's just "Special"
    spd: genNumber === 1 ? "Spc" : "SpD", // In Gen 1, SpA and SpD are the same stat
    spe: "Spe"
  };
 
  // Calculate stats using the generation-specific calculation
  const calculatedStats = StatCalculator.calculateAllStats(baseStats, evs, ivs, level, nature, genNumber);
  
  // Apply boosts to stats (except HP)
  const boostedStats = StatCalculator.applyAllBoosts(calculatedStats, boosts);

  // Determine column layout based on generation
  const gridColumns = isEarlyGen ? "grid-cols-5" : "grid-cols-6";

  return (
    <div className="mb-2 max-w-[75%] ml-1">
      <div className={`grid ${gridColumns} gap-2 mb-1 text-xs text-surface-400`}>
        <div className="text-left pl-1">Stat</div>
        <div className="text-center">Base</div>
        {/* Show "DVs" for Gen 1-2, "IVs" for others */}
        <div className="text-center">{isEarlyGen ? "DVs" : "IVs"}</div>
        {/* Only show EVs column for Gen 3+ */}
        {!isEarlyGen && <div className="text-center">EVs</div>}
        <div className="text-center">Total</div>
        <div className="text-center">Boost</div>
      </div>
      
      {Object.entries(statLabels).map(([stat, label]) => {
        // Skip SpD in Gen 1 since it's the same as SpA
        if (genNumber === 1 && stat === 'spd') return null;
        
        const statKey = stat as keyof typeof baseStats;
        const hasNatureBuff = stat !== 'hp' && !isEarlyGen && natureModifiers[statKey as keyof typeof natureModifiers] === 1.1;
        const hasNatureNerf = stat !== 'hp' && !isEarlyGen && natureModifiers[statKey as keyof typeof natureModifiers] === 0.9;
        
        return (
          <div 
            key={stat} 
            className={`grid ${gridColumns} gap-2 mb-1 text-xs items-center`}
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
                max={isEarlyGen ? "15" : "31"} // DVs go from 0-15, IVs from 0-31
                value={ivs[statKey]}
                onChange={(e) => onStatChange(stat, parseInt(e.target.value) || 0, false)}
              />
            </div>
            
            {/* Only show EVs input for Gen 3+ */}
            {!isEarlyGen && (
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
            )}
            
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