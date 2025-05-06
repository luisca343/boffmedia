import { calculate, Pokemon, Move, Field } from '@smogon/calc';

export function calculateDamage(genInstance, attackerData, defenderData, moveData, attackerState, defenderState) {
  try {
    const attackerPokemon = new Pokemon(genInstance, attackerData.name, {
      level: attackerState.level,
      nature: attackerState.nature,
      evs: attackerState.evs,
      ivs: attackerState.ivs
    });
    
    const defenderPokemon = new Pokemon(genInstance, defenderData.name, {
      level: defenderState.level,
      nature: defenderState.nature,
      evs: defenderState.evs,
      ivs: defenderState.ivs
    });
    
    const move = new Move(genInstance, moveData.name);
    const field = new Field();
    
    return calculate(
      genInstance,
      attackerPokemon,
      defenderPokemon,
      move,
      field
    );
  } catch (error) {
    console.error("Calculation error:", error);
    throw error;
  }
}