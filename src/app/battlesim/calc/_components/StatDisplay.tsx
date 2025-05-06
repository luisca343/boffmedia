'use client';

type NatureType = keyof typeof NATURE_MODIFIERS;

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
  nature: NatureType;
  level: number;
  onStatChange: (stat: string, value: number, isEV: boolean) => void;
}

// Nature modifiers lookup
const NATURE_MODIFIERS: Record<string, {atk?: number, def?: number, spa?: number, spd?: number, spe?: number}> = {
  Adamant: { atk: 1.1, spa: 0.9 },
  Bashful: {},
  Bold: { def: 1.1, atk: 0.9 },
  Brave: { atk: 1.1, spe: 0.9 },
  Calm: { spd: 1.1, atk: 0.9 },
  Careful: { spd: 1.1, spa: 0.9 },
  Docile: {},
  Gentle: { spd: 1.1, def: 0.9 },
  Hardy: {},
  Hasty: { spe: 1.1, def: 0.9 },
  Impish: { def: 1.1, spa: 0.9 },
  Jolly: { spe: 1.1, spa: 0.9 },
  Lax: { def: 1.1, spd: 0.9 },
  Lonely: { atk: 1.1, def: 0.9 },
  Mild: { spa: 1.1, def: 0.9 },
  Modest: { spa: 1.1, atk: 0.9 },
  Naive: { spe: 1.1, spd: 0.9 },
  Naughty: { atk: 1.1, spd: 0.9 },
  Quiet: { spa: 1.1, spe: 0.9 },
  Quirky: {},
  Rash: { spa: 1.1, spd: 0.9 },
  Relaxed: { def: 1.1, spe: 0.9 },
  Sassy: { spd: 1.1, spe: 0.9 },
  Serious: {},
  Timid: { spe: 1.1, atk: 0.9 }
};

// Calculate actual stats based on base, EVs, IVs, nature and level
function calculateStat(base: number, ev: number, iv: number, level: number, nature: number, isHP: boolean) {
  if (isHP) {
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  } else {
    return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
  }
}

export default function StatDisplay({
  baseStats,
  evs,
  ivs,
  nature,
  level,
  onStatChange
}: StatDisplayProps) {
  const natureModifiers = NATURE_MODIFIERS[nature] || {};
  
  const statLabels = {
    hp: "HP",
    atk: "Attack",
    def: "Defense", 
    spa: "Sp. Atk",
    spd: "Sp. Def",
    spe: "Speed"
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

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">Stats</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-1 text-left">Stat</th>
            <th className="p-1 text-center">Base</th>
            <th className="p-1 text-center">EVs</th>
            <th className="p-1 text-center">IVs</th>
            <th className="p-1 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(statLabels).map(([stat, label]) => {
            // Exclude 'hp' as it's not affected by nature
            const statKey = stat as 'atk' | 'def' | 'spa' | 'spd' | 'spe';
            const hasNatureBuff = stat !== 'hp' && natureModifiers[statKey] === 1.1;
            const hasNatureNerf = stat !== 'hp' && natureModifiers[statKey] === 0.9;
            
            return (
              <tr key={stat} className="border-b">
                <td className="p-1">
                  <span className={`${hasNatureBuff ? 'text-red-600' : ''} ${hasNatureNerf ? 'text-blue-600' : ''}`}>
                    {label}
                  </span>
                </td>
                <td className="p-1 text-center">{baseStats[stat as keyof typeof baseStats]}</td>
                <td className="p-1">
                  <input
                    type="number"
                    className="w-full p-1 border rounded text-center"
                    min="0"
                    max="252"
                    step="4"
                    value={evs[stat as keyof typeof evs]}
                    onChange={(e) => onStatChange(stat, parseInt(e.target.value), true)}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className="w-full p-1 border rounded text-center"
                    min="0"
                    max="31"
                    value={ivs[stat as keyof typeof ivs]}
                    onChange={(e) => onStatChange(stat, parseInt(e.target.value), false)}
                  />
                </td>
                <td className="p-1 text-center font-semibold">{calculatedStats[stat as keyof typeof calculatedStats]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}