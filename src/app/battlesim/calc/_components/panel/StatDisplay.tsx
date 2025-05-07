'use client';

import { NATURE_MODIFIERS } from '../../_utils/pokemonData';

type NatureType = string;

interface StatDisplayProps {
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ivs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  boosts: {
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  nature: NatureType;
  level: number;
  onStatChange: (stat: string, value: number, isEV: boolean) => void;
  onBoostChange: (stat: string, value: number) => void;
}

// Calculate actual stats based on base, EVs, IVs, nature and level
function calculateStat(base: number, ev: number, iv: number, level: number, nature: number, isHP: boolean) {
  if (isHP) {
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  } else {
    return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
  }
}

// Calculate boosted stat
function applyBoosts(stat: number, boost: number): number {
  const numerator = boost > 0 ? (2 + boost) : 2;
  const denominator = boost > 0 ? 2 : (2 - boost);
  return Math.floor(stat * (numerator / denominator));
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
  const natureModifiers = NATURE_MODIFIERS[nature] || {};
  
  const statLabels = {
    hp: "HP",
    atk: "Atk",
    def: "Def", 
    spa: "SpA",
    spd: "SpD",
    spe: "Spe"
  };

  // Calculate stats
  const calculatedStats = {
    hp: calculateStat(baseStats.hp, evs.hp, ivs.hp, level, 1, true),
    atk: calculateStat(baseStats.atk, evs.atk, ivs.atk, level, natureModifiers.atk || 1, false),
    def: calculateStat(baseStats.def, evs.def, ivs.def, level, natureModifiers.def || 1, false),
    spa: calculateStat(baseStats.spa, evs.spa, ivs.spa, level, natureModifiers.spa || 1, false),
    spd: calculateStat(baseStats.spd, evs.spd, ivs.spd, level, natureModifiers.spd || 1, false),
    spe: calculateStat(baseStats.spe, evs.spe, ivs.spe, level, natureModifiers.spe || 1, false),
  };
  
  // Apply boosts to stats (except HP)
  const boostedStats = {
    hp: calculatedStats.hp,
    atk: applyBoosts(calculatedStats.atk, boosts.atk),
    def: applyBoosts(calculatedStats.def, boosts.def),
    spa: applyBoosts(calculatedStats.spa, boosts.spa),
    spd: applyBoosts(calculatedStats.spd, boosts.spd),
    spe: applyBoosts(calculatedStats.spe, boosts.spe)
  };

  return (
    <div className="mb-2">
      <h3 className="text-xs font-medium text-primary-400">Stats</h3>
      <div className="flex justify-between items-center mb-1">
        <div className="grid grid-cols-6 gap-1 text-xs text-surface-400">
          <div className="text-center">Stat</div>
          <div className="text-center">Base</div>
          <div className="text-center">IVs</div>
          <div className="text-center">EVs</div>
          <div className="text-center">Total</div>
          <div className="text-center">Boost</div>
        </div>
      </div>
      
      {Object.entries(statLabels).map(([stat, label]) => {
        const statKey = stat as keyof typeof baseStats;
        const hasNatureBuff = stat !== 'hp' && natureModifiers[statKey as keyof typeof natureModifiers] === 1.1;
        const hasNatureNerf = stat !== 'hp' && natureModifiers[statKey as keyof typeof natureModifiers] === 0.9;
        
        return (
          <div 
            key={stat} 
            className="flex items-center mb-1 text-xs"
          >
            <div className="w-10">
              <span className={`${hasNatureBuff ? 'text-red-500 font-medium' : ''} ${hasNatureNerf ? 'text-blue-400 font-medium' : ''} text-surface-200`}>
                {label}
              </span>
            </div>
            
            <div className="w-8 text-center text-surface-300">
              {baseStats[statKey]}
            </div>
            
            <div className="w-12">
              <input
                type="number"
                className="w-full py-0 px-1 h-6 border rounded text-center bg-surface-700 border-surface-600 text-surface-100 text-xs"
                min="0"
                max="31"
                value={ivs[statKey]}
                onChange={(e) => onStatChange(stat, parseInt(e.target.value) || 0, false)}
              />
            </div>
            
            <div className="w-12">
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
            
            <div className="w-16 text-center font-medium text-primary-300">
              {stat !== 'hp' && boosts[stat as keyof typeof boosts] !== 0 
                ? `${calculatedStats[statKey]} → ${boostedStats[statKey]}`
                : calculatedStats[statKey]
              }
            </div>
            
            {stat !== 'hp' ? (
              <div className="w-12">
                <select
                  className="w-full py-0 px-0 h-6 border rounded text-center bg-surface-700 border-surface-600 text-surface-100 text-xs"
                  value={boosts[stat as keyof typeof boosts]}
                  onChange={(e) => onBoostChange(stat, parseInt(e.target.value))}
                >
                  {Array.from({length: 13}, (_, i) => i - 6).map(boost => (
                    <option key={boost} value={boost}>{boost > 0 ? `+${boost}` : boost}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="w-12 text-center">—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}