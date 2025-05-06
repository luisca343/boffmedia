'use client';

interface DamageResultsProps {
  result: any;
}

export default function DamageResults({ result }: DamageResultsProps) {
  if (!result) return null;
  
  // Format damage range like "8-10 (2.7-3.4%)"
  const minDamage = Math.min(...result.damage);
  const maxDamage = Math.max(...result.damage);
  
  // Calculate percentages manually if not available
  const defenderHP = result.defender.stats.hp;
  const minPercent = ((minDamage / defenderHP) * 100).toFixed(1);
  const maxPercent = ((maxDamage / defenderHP) * 100).toFixed(1);
  
  const damageRangeText = `${minDamage}-${maxDamage} (${minPercent}-${maxPercent}%)`;
  
  // Build a more detailed title based on available data
  const attackerName = result.attacker.name;
  const defenderName = result.defender.name;
  const moveName = result.move.name;
  const moveType = result.move.type;
  const moveBP = result.move.bp;
  const moveCategory = result.move.category;
  
  const attackerNature = result.attacker.nature;
  const attackerRelevantStat = moveCategory === "Physical" ? "atk" : "spa";
  const attackerStatValue = result.attacker.stats[attackerRelevantStat];
  const attackerEVs = result.attacker.evs[attackerRelevantStat];
  
  const defenderNature = result.defender.nature;
  const defenderRelevantStat = moveCategory === "Physical" ? "def" : "spd";
  const defenderStatValue = result.defender.stats[defenderRelevantStat];
  
  // Format the title
  const title = `${attackerNature && attackerEVs > 0 ? `${attackerEVs} ${attackerRelevantStat === "spa" ? "SpA" : "Atk"}` : ""} ${attackerName} ${moveName} vs. ${defenderName}: ${damageRangeText} -- ${result.rawDesc?.attackEVs || ""}`;
  
  return (
    <div className="mb-4 p-4 border rounded bg-yellow-50">
      <h2 className="text-lg font-bold">{title}</h2>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="border-r pr-4">
          <h3 className="font-semibold">{attackerName}</h3>
          <p className="text-sm">
            <span className="inline-block px-2 py-1 bg-gray-200 rounded mr-1 text-xs">{result.attacker.types[0]}</span>
            {result.attacker.types[1] && <span className="inline-block px-2 py-1 bg-gray-200 rounded text-xs">{result.attacker.types[1]}</span>}
          </p>
          <p className="text-sm mt-1">
            <span className="font-medium">Ability:</span> {result.attacker.ability}
          </p>
          <p className="text-sm">
            <span className="font-medium">EVs:</span> {Object.entries(result.attacker.evs)
              .filter(([_, value]) => value > 0)
              .map(([stat, value]) => `${value} ${stat.toUpperCase()}`)
              .join(" / ")}
          </p>
          <p className="text-sm">
            <span className="font-medium">Nature:</span> {result.attacker.nature}
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium text-green-700">Move:</span> {moveName} ({moveType}, {moveCategory}, BP: {moveBP})
          </p>
        </div>
        
        <div className="pl-4">
          <h3 className="font-semibold">{defenderName}</h3>
          <p className="text-sm">
            <span className="inline-block px-2 py-1 bg-gray-200 rounded mr-1 text-xs">{result.defender.types[0]}</span>
            {result.defender.types[1] && <span className="inline-block px-2 py-1 bg-gray-200 rounded text-xs">{result.defender.types[1]}</span>}
          </p>
          <p className="text-sm mt-1">
            <span className="font-medium">Ability:</span> {result.defender.ability}
          </p>
          <p className="text-sm">
            <span className="font-medium">EVs:</span> {Object.entries(result.defender.evs)
              .filter(([_, value]) => value > 0)
              .map(([stat, value]) => `${value} ${stat.toUpperCase()}`)
              .join(" / ")}
          </p>
          <p className="text-sm">
            <span className="font-medium">Nature:</span> {result.defender.nature}
          </p>
          <p className="text-sm">
            <span className="font-medium">HP:</span> {result.defender.stats.hp}
          </p>
        </div>
      </div>
      
      {result.damage && (
        <div className="mt-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Possible damage amounts</summary>
            <p className="mt-1">{result.damage.join(", ")}</p>
          </details>
        </div>
      )}
      
      {result.move.drain && (
        <p className="mt-2 text-sm">
          <span className="font-medium">Drain:</span> {Math.floor((minDamage * result.move.drain[0]) / result.move.drain[1])}-{Math.floor((maxDamage * result.move.drain[0]) / result.move.drain[1])} HP ({result.move.drain[0]}/{result.move.drain[1]} of damage)
        </p>
      )}
      
      {/* Additional KO chance information */}
      {result.kochance && (
        <p className="mt-2 font-medium">
          <span className="text-red-600">KO Chance:</span> {result.kochance().text}
        </p>
      )}
    </div>
  );
}