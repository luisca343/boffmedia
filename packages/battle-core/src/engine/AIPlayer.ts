/**
 * Seeded AI player with real difficulty tiers.
 *
 * SeededAIPlayer extends RandomPlayerAI to intercept move selection and apply
 * difficulty-based move scoring instead of uniform random choice.
 *
 * DIFFICULTY TIERS implement different strategies:
 * - easy: ~10% picks best move, ~90% random (weak, unpredictable)
 * - medium: ~50% picks best move, ~50% random (balanced)
 * - hard: ~90% picks best move, ~10% random (strong, predictable)
 *
 * Move scoring uses type effectiveness vs target + base power.
 * The seed MUST be threaded through explicitly; all randomness comes from
 * the seeded PRNG, never from Math.random().
 */

import type { PRNGSeed } from '@pkmn/sim';
import { SeededAIPlayer, type AIDifficulty } from './SeededAIPlayer.js';

// Re-export for convenience
export type { AIDifficulty };

/**
 * Creates a seeded AI player for the given difficulty and optional seed.
 *
 * @param playerStream The battle stream for p2 (the bot).
 * @param difficulty The difficulty tier (easy, medium, hard).
 * @param seed Optional PRNG seed for reproducibility.
 * @returns A SeededAIPlayer instance configured for the difficulty.
 */
export function createAIPlayer(
  playerStream: any, // ObjectReadWriteStream<string> from @pkmn/sim
  difficulty: AIDifficulty = 'medium',
  seed?: PRNGSeed | number | null,
): any {
  // Build options object based on seed
  const options: any = {};

  // Normalize seed: if it's a number, convert to PRNGSeed format
  if (seed !== null && seed !== undefined) {
    if (typeof seed === 'number') {
      options.seed = formatSeedForPRNG(seed);
    } else {
      options.seed = seed;
    }
  }

  return new SeededAIPlayer(playerStream, difficulty, Object.keys(options).length > 0 ? options : undefined);
}

/**
 * Converts a numeric seed into a PRNGSeed @pkmn/sim actually understands.
 *
 * This matters more than it looks. @pkmn's PRNG parses a string seed as:
 *   - `sodium,<base64>`  -> SodiumRNG
 *   - `gen5,<hex>`       -> Gen5RNG
 *   - anything else      -> `new Gen5RNG(seed.split(',').map(Number))`
 *
 * The first version of this function emitted `${seed},${base64}`, which lands
 * in that last branch and parses to `[seed, NaN]`. A NaN in the RNG state makes
 * every seed behave the SAME, so seeded battles were reproducible only in the
 * sense that they were all identically wrong — and no test noticed, because the
 * tests compared winners rather than transcripts.
 *
 * Gen5RNG wants FOUR numbers, so the seed is expanded with splitmix32: cheap,
 * deterministic, and it spreads adjacent seeds (1000, 1001) to unrelated states
 * instead of neighbouring ones.
 */
export function formatSeedForPRNG(seed: number | null): PRNGSeed | null {
  if (seed === null) return null;

  let state = seed >>> 0;
  const next = (): number => {
    // splitmix32
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    return (z ^ (z >>> 15)) >>> 0;
  };

  // Gen5RNG's state is four 16-bit words.
  const words = [next(), next(), next(), next()].map((n) => n & 0xffff);
  return words.join(',') as unknown as PRNGSeed;
}

/**
 * Generates a numeric PRNG seed from optional input.
 *
 * If seed is already a number, returns it.
 * If seed is null/undefined, returns null (unseeded).
 * If seed is a string, hashes it to a number.
 *
 * This allows seed values from various sources (user input, replay ID, etc.)
 * to be normalized to what RandomPlayerAI expects.
 */
export function normalizeSeed(
  seed: number | string | null | undefined,
): number | null {
  if (seed === null || seed === undefined) return null;
  if (typeof seed === 'number') return seed;
  // Simple hash: convert string to number via char codes
  // This is deterministic but not cryptographically secure (not needed here)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
