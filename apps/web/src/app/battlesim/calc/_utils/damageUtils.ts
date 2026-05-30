import { Result } from "@smogon/calc";

/**
 * Formats and pre-processes damage calculation results to ensure all data
 * needed for display is extracted, especially function results like kochance().
 */
export function processDamageResult(result: Result, direction: string) {
  // Extract data from result object
  const { 
    attacker, 
    defender, 
    move, 
    damage, 
    rawDesc 
  } = result;
  
  // Pre-compute KO chance
  let koChance = null;
  try {
    if (typeof result.kochance === 'function') {
      koChance = result.kochance();
    }
  } catch (error) {
    console.warn('Error computing KO chance:', error);
  }
  
  // Pre-compute damage range
  let damageRange = null;
  try {
    if (typeof result.range === 'function') {
      damageRange = result.range();
    }
  } catch (error) {
    console.warn('Error computing damage range:', error);
  }
  
  // Pre-compute description
  let description = null;
  try {
    if (typeof result.desc === 'function') {
      description = result.desc();
    }
  } catch (error) {
    console.warn('Error computing description:', error);
  }
  
  // Return a plain object with all data needed for UI display
  return {
    direction,
    attacker,
    defender,
    move,
    damage,
    rawDesc,
    koChance,
    damageRange,
    description,
    
    originalResult: result
  };
}

/**
 * Calculates minimum and maximum damage from a damage calculation result
 */
export function getDamageMinMax(damage: number | number[] | number[][]) {
  let minDamage: number, maxDamage: number;
  
  if (Array.isArray(damage)) {
    if (Array.isArray(damage[0])) {
      // Handle [number[], number[]]
      const damageArray = ([] as number[]).concat(...(damage as [number[], number[]]));
      minDamage = Math.min(...damageArray);
      maxDamage = Math.max(...damageArray);
    } else {
      // Handle number[]
      minDamage = Math.min(...damage as number[]);
      maxDamage = Math.max(...damage as number[]);
    }
  } else {
    // Handle single number
    minDamage = maxDamage = damage;
  }
  
  return { minDamage, maxDamage };
}

/**
 * Returns the display text for damage results
 */
export function getDamageText(result: ReturnType<typeof processDamageResult>) {
  const { minDamage, maxDamage } = getDamageMinMax(result.damage);
  
  // Calculate percentages
  const defenderHP = result.defender.stats.hp;
  const minPercent = ((minDamage / defenderHP) * 100).toFixed(1);
  const maxPercent = ((maxDamage / defenderHP) * 100).toFixed(1);
  
  // Get the relevant attacker stat based on move category
  const attackerRelevantStat = result.move.category === "Physical" ? "atk" : "spa";
  const attackerEVs = result.attacker.evs[attackerRelevantStat];
  
  // Format damage display
  return {
    title: `${attackerRelevantStat === 'spa' ? attackerEVs + ' SpA' : attackerEVs + ' Atk'} ${result.attacker.name} ${result.move.name} vs. ${defenderHP} HP / ${result.defender.evs.spd} SpD ${result.defender.name}: ${minDamage}-${maxDamage} (${minPercent}-${maxPercent}%) ${result.koChance?.text || ''}`,
    damageAmounts: Array.isArray(result.damage) 
      ? (Array.isArray(result.damage[0]) 
        ? (result.damage as [number[], number[]]).flat().join(", ")
        : (result.damage as number[]).join(", "))
      : result.damage,
    minDamage,
    maxDamage,
    minPercent,
    maxPercent
  };
}