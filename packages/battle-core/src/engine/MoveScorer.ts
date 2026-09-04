/**
 * Move scoring for AI difficulty tiers.
 *
 * Scores legal moves by type effectiveness and base power, allowing tiers
 * to decide whether to pick the best move or a random one.
 *
 * TYPE EFFECTIVENESS: Checks if move's type is super-effective vs opponent's active Pokémon
 * BASE POWER: Prefers high-damage moves; status moves get neutral score
 *
 * This is host-agnostic and uses @pkmn/data which battle-core already depends on.
 */

import { Dex, type Move, type Pokemon } from '@pkmn/sim';
import type { PRNG } from '@pkmn/sim';

interface ScoredMove {
  /** The move string (e.g. "move 1" or "move 2") */
  choice: string;
  /** Numeric score: higher is better */
  score: number;
}

/**
 * Scores a move based on type effectiveness and base power.
 *
 * Returns a score where higher = better. Used to rank moves for decision-making.
 */
export function scoreMoveVsTarget(
  moveId: string,
  targetTypes: string[],
): number {
  const move = Dex.moves.get(moveId);
  if (!move || !move.exists) return 0;

  // Base score from power
  const basePower = (move as any).basePower ?? 0;
  let score = basePower / 100; // Normalize: 100 power = 1.0

  // Bonus for super-effective
  // Use Dex.types directly to check effectiveness
  const moveTypeObj = Dex.types.get(move.type) as any;
  if (moveTypeObj && moveTypeObj.effectiveness) {
    for (const targetType of targetTypes) {
      const typeId = targetType.toLowerCase();
      const effectiveness = moveTypeObj.effectiveness[typeId] ?? 1;
      if (effectiveness > 1) {
        score *= 1.5; // 50% boost for super-effective
        break; // Only count once
      }
    }
  }

  return score;
}

/**
 * Picks a move for the AI based on difficulty tier.
 *
 * @param legalMoves - Array of legal move indices (1-based: 1, 2, 3, 4)
 * @param activeTeam - The AI's active Pokémon
 * @param targetTypes - The opponent's active Pokémon's types (if known)
 * @param tier - Difficulty tier
 * @param prng - Seeded PRNG for reproducibility
 * @returns The move choice string (e.g. "move 1")
 */
export function pickMoveForDifficulty(
  legalMoves: number[],
  activeTeam: any, // Pokemon from @pkmn/sim
  targetTypes: string[], // Opponent's active Pokemon types
  tier: 'easy' | 'medium' | 'hard',
  prng: PRNG,
): string {
  if (legalMoves.length === 0) return 'move 1';
  if (legalMoves.length === 1) return `move ${legalMoves[0]}`;

  // Score each legal move
  const scores: ScoredMove[] = legalMoves.map((moveIndex) => {
    const moveName = activeTeam?.moves?.[moveIndex - 1];
    const score = moveName ? scoreMoveVsTarget(moveName, targetTypes) : 0;
    return { choice: `move ${moveIndex}`, score };
  });

  // Tier-based selection
  const rand = prng.random();
  const selectionThreshold = tier === 'hard' ? 0.9 : tier === 'medium' ? 0.5 : 0.1;

  if (rand < selectionThreshold) {
    // Pick best-scoring move
    const best = scores.reduce((prev, curr) => (curr.score > prev.score ? curr : prev));
    return best.choice;
  } else {
    // Pick random move
    const randomIndex = Math.floor(prng.random() * legalMoves.length);
    return scores[randomIndex].choice;
  }
}
