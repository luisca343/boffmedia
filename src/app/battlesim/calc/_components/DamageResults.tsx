'use client';

interface DamageResultsProps {
  result: any;
}

export default function DamageResults({ result }: DamageResultsProps) {
  if (!result) return null;
  
  // Calculate damage range
  const minDamage = Math.min(...result.damage);
  const maxDamage = Math.max(...result.damage);
  
  // Calculate percentages
  const defenderHP = result.defender.stats.hp;
  const minPercent = ((minDamage / defenderHP) * 100).toFixed(1);
  const maxPercent = ((maxDamage / defenderHP) * 100).toFixed(1);
  
  // Get relevant stats for display
  const attackerName = result.attacker.name;
  const defenderName = result.defender.name;
  const moveName = result.move.name;
  
  // Get the relevant attacker stat based on move category
  const attackerRelevantStat = result.move.category === "Physical" ? "atk" : "spa";
  const attackerStatValue = result.attacker.stats[attackerRelevantStat];
  const attackerEVs = result.attacker.evs[attackerRelevantStat];
  
  // Calculate KO chance if available
  let koChanceText = "";
  if (result.kochance) {
    koChanceText = result.kochance().text;
  }
  
  // Format the title like in the screenshot
  const title = `${attackerRelevantStat === 'spa' ? attackerEVs + ' SpA' : attackerEVs + ' Atk'} ${attackerName} ${moveName} vs. ${defenderHP} HP / ${result.defender.evs.spd} SpD ${defenderName}: ${minDamage}-${maxDamage} (${minPercent}-${maxPercent}%) -- ${koChanceText}`;
  
  return (
    <div className="p-3 mb-4 rounded">
      <div className="font-medium">{title}</div>
      <div className="text-xs  mt-1">
        Possible damage amounts: ({result.damage.join(", ")})
      </div>
    </div>
  );
}