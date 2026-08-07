import type { Readable } from 'stream';

export interface RandomizeJob {
  /** Optional ROM stream for ROM-based games */
  romStream?: Readable;
  /** Settings in .rnqs format (binary) */
  settingsRnqs: Buffer;
  /** Cryptographically-safe seed [0, Number.MAX_SAFE_INTEGER] */
  seed: number;
  /** Game platform: 'gba' | 'nds' */
  gamePlatform: 'gba' | 'nds';
  /** SHA-512 of FVX jar used for this randomization */
  jarSha512: string;
}

export interface RandomizeResult {
  /** SHA-512 of the output ROM */
  outputSha512: string;
  /** Raw bytes of the spoiler log */
  logBytes: Buffer;
  /** Randomized ROM bytes */
  romBytes: Buffer;
}

/**
 * Port for the FVX randomizer runner. This spawns the FVX jar with the given
 * settings and seed, returning the randomized ROM and sealed spoiler log.
 *
 * Phase 0 spike implementation is a stub that throws ServiceUnavailableException.
 * Real implementation will spawn FVX in a child process and handle streaming.
 */
export interface IRandomizerRunner {
  randomize(job: RandomizeJob): Promise<RandomizeResult>;
}

export const RANDOMIZER_RUNNER_TOKEN = 'RANDOMIZER_RUNNER_TOKEN';
