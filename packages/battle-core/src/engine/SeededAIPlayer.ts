/**
 * Seeded AI player with real difficulty tiers.
 *
 * Extends RandomPlayerAI to intercept move selection and apply difficulty-based
 * move scoring. All randomness comes from the seeded PRNG.
 *
 * Difficulty affects how likely the AI is to pick the best-scoring move:
 * - easy (0.1): mostly random, occasionally picks best
 * - medium (0.5): balanced between best and random
 * - hard (0.9): mostly picks best, occasionally random
 */

import { RandomPlayerAI } from '@pkmn/sim';
import { scoreMoveVsTarget } from './MoveScorer.js';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * AI player that selects moves based on type effectiveness and difficulty tier.
 *
 * Overrides RandomPlayerAI.chooseMove to apply move scoring instead of
 * uniform random selection. The scoring uses type effectiveness vs the
 * opponent's active Pokémon.
 */
export class SeededAIPlayer extends RandomPlayerAI {
  readonly difficulty: AIDifficulty;

  constructor(
    playerStream: any, // ObjectReadWriteStream<string> from @pkmn/sim
    difficulty: AIDifficulty = 'medium',
    options?: {
      seed?: any; // PRNG seed
      move?: number;
      mega?: number;
    },
  ) {
    super(playerStream, options);
    this.difficulty = difficulty;
  }

  /**
   * Override move selection to apply difficulty-based scoring.
   *
   * The moves array contains {choice: "move 1", move: moveObj, ...} objects.
   * We score each move by type effectiveness and pick best or random based on tier.
   */
  protected chooseMove(active: any, moves: any[]): string {
    if (!moves.length) return 'pass';
    if (moves.length === 1) return moves[0].choice;

    // Get the opponent's active Pokémon types
    let targetTypes: string[] = [];
    try {
      const opponent = (this as any).battle?.getOppActive?.();
      targetTypes = opponent?.types ?? [];
    } catch {
      // Silently continue with empty targetTypes
    }

    // Score each move
    const scored = moves.map((m: any) => ({
      choice: m.choice,
      score: scoreMoveVsTarget(m.move.id ?? '', targetTypes),
    }));

    // Decide whether to pick best or random based on difficulty threshold
    const rand = this.prng.random();
    const threshold = this.difficulty === 'hard' ? 0.9 : this.difficulty === 'medium' ? 0.5 : 0.1;

    if (rand < threshold) {
      // Pick the best-scoring move
      const best = scored.reduce((prev: any, curr: any) => (curr.score > prev.score ? curr : prev));
      return best.choice;
    } else {
      // Pick random: use prng.sample like the parent class does
      return (this as any).prng.sample(moves).choice;
    }
  }
}
