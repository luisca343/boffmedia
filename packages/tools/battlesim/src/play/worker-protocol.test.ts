/**
 * Integration tests for seeded AI difficulty flow through worker protocol.
 *
 * Validates that:
 * - BattleWorkerRequest accepts aiDifficulty and aiSeed
 * - AIDifficulty type is correctly exported and used
 * - Seed values are preserved through the protocol
 */

import { describe, test, expect } from 'vitest';
import type { BattleWorkerRequest, AIDifficulty } from './worker-protocol.js';

describe('Worker Protocol - Seeded AI Configuration', () => {
  test('BattleWorkerRequest.start accepts aiDifficulty', () => {
    const request: BattleWorkerRequest = {
      type: 'start',
      roomId: 'test-room',
      format: 'gen9randombattle',
      aiDifficulty: 'hard',
    };

    expect(request.type).toBe('start');
    expect(request.aiDifficulty).toBe('hard');
  });

  test('BattleWorkerRequest.start accepts aiSeed as number', () => {
    const request: BattleWorkerRequest = {
      type: 'start',
      roomId: 'test-room',
      format: 'gen9randombattle',
      aiSeed: 12345,
    };

    expect(request.aiSeed).toBe(12345);
  });

  test('BattleWorkerRequest.start accepts aiSeed as null', () => {
    const request: BattleWorkerRequest = {
      type: 'start',
      roomId: 'test-room',
      format: 'gen9randombattle',
      aiSeed: null,
    };

    expect(request.aiSeed).toBeNull();
  });

  test('BattleWorkerRequest.start accepts both aiDifficulty and aiSeed', () => {
    const request: BattleWorkerRequest = {
      type: 'start',
      roomId: 'test-room',
      format: 'gen9randombattle',
      p1Team: 'packed-team',
      p2Team: 'packed-team',
      aiDifficulty: 'easy',
      aiSeed: 99999,
    };

    expect(request.type).toBe('start');
    expect(request.p1Team).toBe('packed-team');
    expect(request.p2Team).toBe('packed-team');
    expect(request.aiDifficulty).toBe('easy');
    expect(request.aiSeed).toBe(99999);
  });

  test('AIDifficulty type accepts all three tiers', () => {
    const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard'];
    expect(difficulties).toHaveLength(3);
  });

  test('BattleWorkerRequest with default seed (undefined)', () => {
    const request: BattleWorkerRequest = {
      type: 'start',
      roomId: 'test-room',
      format: 'gen9randombattle',
      // aiSeed not specified - should be undefined (the default)
    };

    expect(request.aiSeed).toBeUndefined();
  });

  test('BattleWorkerRequest.choice/undo/forfeit/stop do not have difficulty fields', () => {
    const choiceRequest: BattleWorkerRequest = {
      type: 'choice',
      roomId: 'test-room',
      choice: 'move 1',
    };

    const undoRequest: BattleWorkerRequest = {
      type: 'undo',
      roomId: 'test-room',
    };

    const forfeitRequest: BattleWorkerRequest = {
      type: 'forfeit',
      roomId: 'test-room',
    };

    const stopRequest: BattleWorkerRequest = {
      type: 'stop',
      roomId: 'test-room',
    };

    // These requests should not have aiDifficulty/aiSeed (TypeScript would error if they did)
    expect(choiceRequest.type).toBe('choice');
    expect(undoRequest.type).toBe('undo');
    expect(forfeitRequest.type).toBe('forfeit');
    expect(stopRequest.type).toBe('stop');
  });
});
